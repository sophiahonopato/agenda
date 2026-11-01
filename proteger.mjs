// Criptografa agenda.html com uma senha e gera index.html (o arquivo que vai pro GitHub).
// Uso: node proteger.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { webcrypto as crypto } from "node:crypto";
import readline from "node:readline";

const ITER = 600000;

function ask(q) {
  return new Promise(res => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = s => { if (s.startsWith(q)) process.stdout.write(s); };
    rl.question(q, a => { rl.close(); process.stdout.write("\n"); res(a); });
  });
}

const senha = process.env.SENHA || await (async () => {
  const a = await ask("Senha: ");
  const b = await ask("Repete a senha: ");
  if (a !== b) { console.error("As senhas não batem."); process.exit(1); }
  return a;
})();
if (senha.length < 12) { console.error("Usa pelo menos 12 caracteres (dá pra ser uma frase, tipo: \"meu gato come alface\")."); process.exit(1); }

const b64 = u => Buffer.from(u).toString("base64");
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(senha), "PBKDF2", false, ["deriveKey"]);
const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: ITER, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(readFileSync("agenda.html", "utf8")));

const page = readFileSync("cadeado.html", "utf8")
  .replace("__SALT__", b64(salt)).replace("__IV__", b64(iv))
  .replace("__ITER__", ITER).replace("__DATA__", b64(new Uint8Array(data)));
writeFileSync("index.html", page);
console.log("Pronto: index.html gerado e protegido.");
