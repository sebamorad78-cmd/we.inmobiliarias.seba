// Genera un hash de contraseña compatible con el panel.
// Uso: npm run hash-password -- "clave-segura"
import { randomBytes, scryptSync } from "node:crypto";

const pw = process.argv[2];
if (!pw) {
  console.error('Uso: npm run hash-password -- "clave-segura"');
  process.exit(1);
}
const salt = randomBytes(16);
console.log(`scrypt$${salt.toString("base64url")}$${scryptSync(pw, salt, 64).toString("base64url")}`);
