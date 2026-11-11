# Modèle de données Firestore

Toutes les dates d'événements utilisent `serverTimestamp()` (jamais l'heure du téléphone).
Les **échéances** sont des dates calendaires `AAAA-MM-JJ` (fuseau Africa/Abidjan = UTC+0) : pas
d'heure, pas d'ambiguïté. Les montants sont des **entiers** en FCFA.

## `users/{uid}` — profil privé

| Champ                    | Type                | Note                           |
| ------------------------ | ------------------- | ------------------------------ |
| `firstName`, `lastName`  | string              |                                |
| `email`                  | string              |                                |
| `phone`                  | string              | `+225XXXXXXXXXX` (10 chiffres) |
| `photoURL`               | string \| null      | Storage `avatars/{uid}/…`      |
| `emailNotifications`     | bool (absent = oui) | résumé quotidien par e-mail    |
| `createdAt`, `updatedAt` | timestamp           |                                |

Lisible uniquement par son propriétaire. Le nom et le téléphone utiles aux autres membres sont
recopiés dans `members/{uid}` au moment de la demande d'adhésion.

## `invites/{code}` — recherche par code

`tontineId, tontineName, ownerName, amount, frequency, totalShares, createdAt`.
Lisible (get uniquement) par tout utilisateur connecté, pour rejoindre une tontine sans pouvoir la
lire avant d'être accepté.

## `tontines/{tontineId}`

| Champ                        | Type      | Note                                                   |
| ---------------------------- | --------- | ------------------------------------------------------ |
| `name`, `description`        | string    |                                                        |
| `amount`                     | int       | cotisation par part                                    |
| `frequency`                  | string    | `WEEKLY` · `BIWEEKLY` · `MONTHLY`                      |
| `startDate`                  | string    | `AAAA-MM-JJ`, échéance du tour 1                       |
| `totalShares`                | int       | nombre de parts = nombre de tours                      |
| `graceDays`, `penaltyAmount` | int       | règles de retard                                       |
| `status`                     | string    | `DRAFT` → `ACTIVE` → `COMPLETED` (ou `CANCELLED`)      |
| `ownerId`, `ownerName`       | string    | organisateur                                           |
| `inviteCode`                 | string    | 6 caractères                                           |
| `memberIds`                  | string[]  | membres acceptés (requêtes « mes tontines » et règles) |
| `coOrganizerIds`             | string[]  | peuvent confirmer les paiements                        |
| `orderMode`                  | string    | `MANUAL` · `DRAW`                                      |
| `payoutOrder`                | object[]  | `{ memberId, memberName, shareNumber }` par part       |
| `drawAt`, `drawBy`           | timestamp | tirage au sort : écrit une seule fois                  |
| `activatedAt`, `closedAt`    | timestamp |                                                        |
| `createdAt`, `updatedAt`     | timestamp |                                                        |

Une fois `ACTIVE` : montant, fréquence, date de début, parts, ordre, membres et règles de retard
sont figés par les règles de sécurité.

### `tontines/{id}/members/{uid}`

`userId, displayName, phone, role (ORGANIZER | CO_ORGANIZER | MEMBER), shares (1–10),
status (PENDING | ACTIVE | REFUSED | LEFT), joinedAt, updatedAt`.

**Membres sans compte** : l'organisateur peut ajouter une personne qui n'utilisera pas
l'application (tant que la tontine est en préparation et non tirée au sort). Son identifiant est
`guest_` + 20 caractères (aucun uid Firebase ne contient « _ »), `userId` vaut ce même identifiant
et `isGuest: true`. Il figure dans `memberIds` comme les autres (ordre, tours, cotisations), mais ne
peut jamais se connecter : l'organisateur enregistre ses paiements (« Paiement reçu ») et confirme
pour lui la remise du pot. Il ne peut pas être co-organisateur et ne reçoit pas de notifications
dans l'application.

### `tontines/{id}/guestContacts/{guestId}`

`email, updatedAt` : e-mail facultatif d'un membre sans compte, lisible par l'organisateur seul,
utilisé uniquement pour lui envoyer les e-mails. Effacé quand le membre est retiré.

Une personne peut avoir plusieurs « mains » (`shares`) : elle cotise `amount × shares` à chaque tour
et reçoit autant de tours.

### `tontines/{id}/rounds/{index}`

Créés en un seul lot au démarrage : `index, dueDate, beneficiaryId, beneficiaryName, shareNumber,
potAmount (= amount × totalShares), payoutStatus (PENDING | SENT | RECEIVED), payoutMethod,
payoutReference, payoutSentAt, payoutSentBy, payoutConfirmedAt`.

Le versement du pot est tracé dans les deux sens : l'organisateur l'envoie (`SENT`), le
bénéficiaire confirme la réception (`RECEIVED`).

### `tontines/{id}/contributions/{roundIndex}_{uid}`

Une cotisation par membre et par tour (identifiant déterministe) :
`roundIndex, memberId, memberName, amount, penaltyAmount, method, reference, proofPath, status,
declaredAt, confirmedAt, confirmedBy, rejectedAt, rejectedBy, rejectionReason, penaltyAppliedAt,
updatedAt`.

Statuts stockés : `DECLARED`, `CONFIRMED`, `REJECTED`, `LATE` (pénalité appliquée sans paiement).
Les statuts `PENDING` (aucun document) et `LATE` (échéance + délai de grâce dépassés) sont aussi
**calculés** par `getEffectiveStatus()` dans `src/features/contributions/logic/contributions.js`.

### `tontines/{id}/events/{eventId}` — journal en ajout uniquement

`type, actorId, actorName, payload, createdAt`. Écrit dans le même lot (batch/transaction) que
l'action qu'il décrit. Les règles interdisent toute modification ou suppression.

## `notifications/{id}`

`userId, tontineId, type, message, link, actorId, read, readAt, createdAt`.
Créées par l'application dans le même lot que l'action. Les rappels « c'est ton tour » et
« échéance proche » sont calculés à l'affichage (les rappels automatiques par Cloud Functions sont
prévus pour une version ultérieure).

## `mailLog/digest_{date}_{memberId}` — résumés quotidiens envoyés

Écrit uniquement par la Cloud Function `sendDailyDigest` (aucun accès depuis l'application) :
`kind, to, subject, tontineIds, eventCount, status (PENDING | SENT | SIMULATED | FAILED), error,
createdAt, sentAt`. L'identifiant garantit un seul résumé par jour et par destinataire, même si la
fonction est relancée. En mode simulé (émulateurs), le texte de l'e-mail est aussi stocké.

## `digestState/daily`

`lastUntil, lastStats` : fin de la période couverte par le dernier résumé. Le suivant reprend à
partir de là : aucun événement oublié ni envoyé deux fois. Aucun accès depuis l'application.

## Storage

- `proofs/{tontineId}/{uid}/{fichier}` : preuve de paiement, image ≤ 2 Mo, lisible par les membres.
- `avatars/{uid}/{fichier}` : photo de profil, image ≤ 2 Mo.

## Index

Voir `firestore.indexes.json` : notifications par utilisateur triées par date, et index
`collectionGroup('members')` sur `userId` pour retrouver ses demandes en attente.
