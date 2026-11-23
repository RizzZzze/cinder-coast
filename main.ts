// Cinder Coast — hand-in program (Node 22, standard library only).
// Copies game/ and screenshots/ from beside this file into /output
// (or MAKEFUN_OUTPUT_DIR when set) in sorted order and writes
// /output/dossier.json with the vendored make.fun dossier library.
// No timestamps, no random values, no machine paths: two runs write
// identical bytes.
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copySorted(srcDir: string, dstDir: string): void {
  mkdirSync(dstDir, { recursive: true });
  const entries = readdirSync(srcDir).sort();
  for (const name of entries) {
    const src = join(srcDir, name);
    const dst = join(dstDir, name);
    const st = statSync(src);
    if (st.isDirectory()) copySorted(src, dst);
    else if (st.isFile()) copyFileSync(src, dst);
  }
}

mkdirSync(out, { recursive: true });
copySorted(join(here, 'game'), join(out, 'game'));
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) copySorted(join(here, 'screenshots'), join(out, 'screenshots'));

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
