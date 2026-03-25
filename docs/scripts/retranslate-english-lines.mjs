#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const repoRoot = process.cwd();
const docsRoot = path.join(repoRoot, 'docs', 'src', 'content', 'docs');
const localeTargets = {
  ar: 'ar',
  bn: 'bn',
  de: 'de',
  el: 'el',
  es: 'es',
  fr: 'fr',
  he: 'he',
  hi: 'hi',
  id: 'id',
  it: 'it',
  ja: 'ja',
  ko: 'ko',
  nl: 'nl',
  pl: 'pl',
  pt: 'pt',
  ro: 'ro',
  ru: 'ru',
  th: 'th',
  tr: 'tr',
  uk: 'uk',
  ur: 'ur',
  vi: 'vi',
  zh: 'zh-Hans'
};
const locales = Object.keys(localeTargets);
const providers = ['https://translate.cutie.dating', 'https://translate.fedilab.app'];
let providerIndex = 0;

const englishSignal = /\b(the|and|with|for|used|represent|following|interface|example|pros|cons|quick|analysis|loss|context|subjectivity|data|structure|key|attributes|word|cloud|chart|calendar|funnel|timeline|matrix|scatter|sankey|sun|burst|tree|map|dashboard|project|visualization|create|update|delete|filter|name|description|value|values|category|categories|legend|theme|playground)\b/i;

async function translateLine(text, target) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const provider = providers[providerIndex % providers.length];
    providerIndex += 1;
    try {
      const response = await Promise.race([
        fetch(`${provider}/translate`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ q: text, source: 'en', target, format: 'text' })
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000))
      ]);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      if (typeof payload?.translatedText === 'string' && payload.translatedText.trim()) {
        return payload.translatedText;
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
    }
  }
  return text;
}

async function run() {
  for (const locale of locales) {
    const localeDir = path.join(docsRoot, locale);
    const files = [];

    async function walk(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) await walk(full);
        else if (/\.(md|mdx)$/.test(entry.name)) files.push(full);
      }
    }

    await walk(localeDir);

    for (const file of files) {
      const content = await fs.readFile(file, 'utf8');
      const lines = content.split('\n');
      let inCode = false;
      let inFrontmatter = false;
      let changed = false;

      for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i];

        if (i === 0 && line.trim() === '---') {
          inFrontmatter = true;
          continue;
        }
        if (inFrontmatter) {
          if (line.trim() === '---') {
            inFrontmatter = false;
          }
          continue;
        }
        if (/^\s*```/.test(line)) {
          inCode = !inCode;
          continue;
        }
        if (inCode) continue;
        if (!line.trim()) continue;
        if (/^\s*{{[^}]+}}\s*$/.test(line)) continue;
        if (/^\s*(import|export)\s+.+$/.test(line)) continue;
        if (/^\s*<[^>]+>\s*$/.test(line) || /^\s*<\/[^>]+>\s*$/.test(line)) continue;
        if (/\[[^\]]+\]\([^)]*\/Illustry-monorepo\/[^)]*\)/.test(line)) continue;
        if (/^\s*[A-Za-z_][A-Za-z0-9_-]*:\s*/.test(line)) continue;

        const markerMatch = line.match(/^(\s*(?:#{1,6}\s+|[-*+]\s+|\d+\.\s+|>\s+)?)(.*)$/);
        if (!markerMatch) continue;
        const prefix = markerMatch[1] ?? '';
        const text = markerMatch[2] ?? '';
        if (!text.trim()) continue;
        if (!englishSignal.test(text)) continue;

        const translated = await translateLine(text, localeTargets[locale]);
        if (translated !== text) {
          lines[i] = `${prefix}${translated}`;
          changed = true;
        }
      }

      if (changed) {
        await fs.writeFile(file, lines.join('\n'), 'utf8');
      }
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
