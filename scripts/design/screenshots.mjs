import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { die, packetDir } from './lib.mjs';

function isMain() {
  return (
    process.argv[1] &&
    fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  );
}

function main() {
  const slug = process.argv.slice(2).find((arg) => !arg.startsWith('--'));
  if (!slug) {
    die('usage: node scripts/design/screenshots.mjs <slug>');
  }
  const dir = path.join(packetDir(slug), 'screenshots');
  const images = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((name) => /\.(png|jpe?g|webp)$/i.test(name))
    : [];
  if (!images.length) {
    console.error(
      `No screenshots in design/${slug}/screenshots/. This script does not install Playwright and does not change the environment. The build agent captures scenes from the playground dev server and places the images here.`,
    );
    process.exit(2);
  }
  console.log(images.join('\n'));
}

if (isMain()) {
  main();
}
