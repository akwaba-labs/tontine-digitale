// Les émulateurs lisent les secrets des fonctions dans functions/.secret.local (jamais commité).
// On le crée vide s'il manque : sans mot de passe SMTP, les e-mails sont simplement simulés.
import { existsSync, writeFileSync } from 'node:fs';

const path = new URL('../functions/.secret.local', import.meta.url);
if (!existsSync(path)) writeFileSync(path, 'SMTP_PASS=\n');
