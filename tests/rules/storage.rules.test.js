import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { getBytes, ref, uploadBytes } from 'firebase/storage';
import { ACTIVE_ID, createTestEnv, seed } from './setup';

let env;

beforeAll(async () => {
  env = await createTestEnv();
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.clearStorage();
  await seed(env);
});

const storageAs = (uid) => env.authenticatedContext(uid).storage();
const image = new Uint8Array(1024).fill(1);
const jpeg = { contentType: 'image/jpeg' };

describe('preuves de paiement', () => {
  const proofPath = (uid) => `proofs/${ACTIVE_ID}/${uid}/capture.jpg`;

  it('un membre envoie une image pour lui-même', async () => {
    await assertSucceeds(uploadBytes(ref(storageAs('alice'), proofPath('alice')), image, jpeg));
  });

  it('refuse un fichier qui n’est pas une image', async () => {
    await assertFails(
      uploadBytes(ref(storageAs('alice'), proofPath('alice')), image, {
        contentType: 'application/pdf',
      }),
    );
  });

  it('refuse une image de plus de 2 Mo', async () => {
    const big = new Uint8Array(2 * 1024 * 1024 + 1);
    await assertFails(uploadBytes(ref(storageAs('alice'), proofPath('alice')), big, jpeg));
  });

  it('refuse un envoi au nom d’un autre ou par un non-membre', async () => {
    await assertFails(uploadBytes(ref(storageAs('alice'), proofPath('co')), image, jpeg));
    await assertFails(uploadBytes(ref(storageAs('zoe'), proofPath('zoe')), image, jpeg));
  });

  it('seuls les membres de la tontine lisent les preuves', async () => {
    await env.withSecurityRulesDisabled((context) =>
      uploadBytes(ref(context.storage(), proofPath('alice')), image, jpeg),
    );
    await assertSucceeds(getBytes(ref(storageAs('co'), proofPath('alice'))));
    await assertFails(getBytes(ref(storageAs('zoe'), proofPath('alice'))));
  });
});

describe('photos de profil', () => {
  it('chacun envoie uniquement sa propre photo', async () => {
    await assertSucceeds(
      uploadBytes(ref(storageAs('alice'), 'avatars/alice/photo.jpg'), image, jpeg),
    );
    await assertFails(uploadBytes(ref(storageAs('alice'), 'avatars/bob/photo.jpg'), image, jpeg));
  });
});
