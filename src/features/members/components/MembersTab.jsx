import { useState } from 'react';
import { Badge, Button, Dropdown, Form, ListGroup } from 'react-bootstrap';
import { MoreVertical, Phone, Users } from 'lucide-react';
import EmptyState from '../../../shared/components/EmptyState';
import ConfirmModal from '../../../shared/components/ConfirmModal';
import StatusBadge from '../../../shared/components/StatusBadge';
import { useAsyncAction } from '../../../shared/hooks/useAsyncAction';
import {
  LIMITS,
  MEMBER_ROLE,
  MEMBER_ROLE_LABELS,
  MEMBER_STATUS,
  TONTINE_STATUS,
} from '../../../shared/constants/domain';
import { formatPhone } from '../../../shared/utils/formatPhone';
import { activeMembers } from '../../contributions/logic/contributions';
import { sumShares } from '../../rounds/logic/schedule';
import {
  acceptMember,
  refuseMember,
  removeMember,
  setCoOrganizer,
  setMemberShares,
} from '../services/memberService';

function MemberInfo({ member, uid }) {
  return (
    <div>
      <div className="fw-semibold">
        {member.displayName}
        {member.userId === uid && <span className="text-primary"> (vous)</span>}
        {member.role !== MEMBER_ROLE.MEMBER && (
          <Badge bg="light" text="dark" className="ms-2 border">
            {MEMBER_ROLE_LABELS[member.role]}
          </Badge>
        )}
      </div>
      <div className="small text-secondary d-flex flex-wrap gap-2">
        <span>
          {member.shares} part{member.shares > 1 ? 's' : ''}
        </span>
        {member.phone && (
          <a href={`tel:${member.phone}`} className="d-inline-flex align-items-center gap-1">
            <Phone size={14} aria-hidden="true" />
            {formatPhone(member.phone)}
          </a>
        )}
      </div>
    </div>
  );
}

export default function MembersTab({ detail }) {
  const { tontine, members, isOwner, uid, actor } = detail;
  const { run, isRunning } = useAsyncAction();
  const [toRemove, setToRemove] = useState(null);
  const membershipOpen = tontine.status === TONTINE_STATUS.DRAFT && !tontine.drawAt;
  const canManageRoles =
    isOwner && [TONTINE_STATUS.DRAFT, TONTINE_STATUS.ACTIVE].includes(tontine.status);

  const active = activeMembers(members);
  const pending = members.filter((m) => m.status === MEMBER_STATUS.PENDING);
  const others = members.filter((m) =>
    [MEMBER_STATUS.LEFT, MEMBER_STATUS.REFUSED].includes(m.status),
  );
  const usedShares = sumShares(active);

  return (
    <>
      {pending.length > 0 && (
        <section className="mb-4">
          <h2 className="h6 text-uppercase text-secondary">
            Demandes en attente ({pending.length})
          </h2>
          <ListGroup className="shadow-sm">
            {pending.map((member) => (
              <ListGroup.Item
                key={member.userId}
                className="d-flex justify-content-between align-items-center flex-wrap gap-2"
              >
                <MemberInfo member={member} uid={uid} />
                {isOwner && membershipOpen ? (
                  <div className="d-flex gap-2">
                    <Button
                      size="sm"
                      variant="success"
                      disabled={isRunning}
                      onClick={() =>
                        run(() => acceptMember(actor, tontine, members, member), {
                          success: `${member.displayName} fait maintenant partie de la tontine.`,
                        })
                      }
                    >
                      Accepter
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      disabled={isRunning}
                      onClick={() =>
                        run(() => refuseMember(actor, tontine, member), {
                          success: 'Demande refusée.',
                        })
                      }
                    >
                      Refuser
                    </Button>
                  </div>
                ) : (
                  <StatusBadge kind="member" status={member.status} />
                )}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </section>
      )}

      <section className="mb-4">
        <h2 className="h6 text-uppercase text-secondary">
          Membres ({active.length}) · {usedShares} / {tontine.totalShares} parts
        </h2>
        {active.length === 0 ? (
          <EmptyState icon={Users} title="Aucun membre" />
        ) : (
          <ListGroup className="shadow-sm">
            {active.map((member) => {
              const isTontineOwner = member.userId === tontine.ownerId;
              const maxShares = Math.min(
                LIMITS.maxSharesPerMember,
                tontine.totalShares - (usedShares - member.shares),
              );
              return (
                <ListGroup.Item
                  key={member.userId}
                  className="d-flex justify-content-between align-items-center flex-wrap gap-2"
                >
                  <MemberInfo member={member} uid={uid} />
                  <div className="d-flex align-items-center gap-2">
                    {isOwner && membershipOpen && (
                      <Form.Select
                        size="sm"
                        style={{ width: 'auto' }}
                        aria-label={`Parts de ${member.displayName}`}
                        value={member.shares}
                        disabled={isRunning}
                        onChange={(event) =>
                          run(
                            () =>
                              setMemberShares(
                                actor,
                                tontine,
                                members,
                                member,
                                Number(event.target.value),
                              ),
                            {
                              success: 'Parts mises à jour.',
                            },
                          )
                        }
                      >
                        {Array.from({ length: Math.max(1, maxShares) }, (_, i) => i + 1).map(
                          (n) => (
                            <option key={n} value={n}>
                              {n} part{n > 1 ? 's' : ''}
                            </option>
                          ),
                        )}
                      </Form.Select>
                    )}
                    {canManageRoles && !isTontineOwner && (
                      <Dropdown align="end">
                        <Dropdown.Toggle
                          variant="light"
                          size="sm"
                          className="border"
                          aria-label={`Actions pour ${member.displayName}`}
                        >
                          <MoreVertical size={16} aria-hidden="true" />
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item
                            as="button"
                            onClick={() =>
                              run(
                                () =>
                                  setCoOrganizer(
                                    actor,
                                    tontine,
                                    member,
                                    member.role !== MEMBER_ROLE.CO_ORGANIZER,
                                  ),
                                {
                                  success: 'Rôle mis à jour.',
                                },
                              )
                            }
                          >
                            {member.role === MEMBER_ROLE.CO_ORGANIZER
                              ? 'Retirer le rôle de co-organisateur'
                              : 'Nommer co-organisateur (confirme les paiements)'}
                          </Dropdown.Item>
                          {membershipOpen && (
                            <Dropdown.Item
                              as="button"
                              className="text-danger"
                              onClick={() => setToRemove(member)}
                            >
                              Retirer de la tontine
                            </Dropdown.Item>
                          )}
                        </Dropdown.Menu>
                      </Dropdown>
                    )}
                  </div>
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        )}
        {!membershipOpen && tontine.status === TONTINE_STATUS.DRAFT && (
          <p className="small text-secondary mt-2">
            L’ordre a été tiré au sort : la liste des membres est figée.
          </p>
        )}
      </section>

      {others.length > 0 && (
        <section>
          <h2 className="h6 text-uppercase text-secondary">Anciens membres et demandes refusées</h2>
          <ListGroup className="shadow-sm">
            {others.map((member) => (
              <ListGroup.Item
                key={member.userId}
                className="d-flex justify-content-between align-items-center"
              >
                <span>{member.displayName}</span>
                <StatusBadge kind="member" status={member.status} />
              </ListGroup.Item>
            ))}
          </ListGroup>
        </section>
      )}

      <ConfirmModal
        show={Boolean(toRemove)}
        title={`Retirer ${toRemove?.displayName ?? ''} ?`}
        confirmLabel="Retirer"
        confirmVariant="danger"
        isProcessing={isRunning}
        onCancel={() => setToRemove(null)}
        onConfirm={async () => {
          const { ok } = await run(() => removeMember(actor, tontine, toRemove), {
            success: 'Membre retiré.',
          });
          if (ok) setToRemove(null);
        }}
      >
        Cette personne ne fera plus partie de la tontine. Le retrait est inscrit dans l’historique.
      </ConfirmModal>
    </>
  );
}
