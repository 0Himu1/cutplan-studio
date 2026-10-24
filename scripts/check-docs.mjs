import { readdir, readFile, access } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
async function checkDirectory(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await checkDirectory(file);
    else if (file.endsWith('.md')) {
      const text = await readFile(file, 'utf8');
      if ((text.match(/^```/gm) ?? []).length % 2) throw new Error(`Unclosed code fence: ${file}`);
      for (const match of text.matchAll(/\]\(([^)]+)\)/g)) {
        const target = match[1].split('#')[0];
        if (!target || /^(https?:|mailto:|\/)/.test(target)) continue;
        await access(path.resolve(path.dirname(file), target));
      }
    }
  }
}

try {
  await checkDirectory(path.join(root, 'docs'));
  console.log('PASS: documentation links and code fences.');
} catch (error) {
  console.error('Documentation check failed:', error.message);
  process.exit(1);
}
