#!/usr/bin/env node
import { cp, mkdir, access, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const src = resolve(__dirname, "..", "..", "..", "packages", "circuits", "build");
const dst = resolve(__dirname, "..", "public", "circuits");

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await exists(src))) {
    console.warn(
      `[copy-circuits] Skipping: ${src} does not exist.\n` +
        `Run: pnpm --filter @sol-login/circuits run compile && pnpm --filter @sol-login/circuits run setup`,
    );
    return;
  }
  await mkdir(dst, { recursive: true });
  const entries = await readdir(src, { recursive: true });
  let copied = 0;
  for (const entry of entries) {
    if (entry.endsWith(".wasm") || entry.endsWith("_final.zkey") || entry.endsWith("_vkey.json")) {
      const from = join(src, entry);
      const to = join(dst, entry.replace(/^.*[\\/]/, ""));
      await cp(from, to);
      copied++;
    }
  }
  console.log(`[copy-circuits] copied ${copied} artifact(s) -> ${dst}`);
}

main().catch((err) => {
  console.error("[copy-circuits] failed:", err);
  process.exitCode = 1;
});
