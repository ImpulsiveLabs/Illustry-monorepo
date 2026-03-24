#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const repoRoot = process.cwd();
const docsRoot = path.join(repoRoot, 'docs', 'src', 'content', 'docs');

const localeMap = {
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

const sourceFiles = [
  '404.md',
  'index.mdx',
  ...[
    'bar-chart.md',
    'calendar.md',
    'dashboards.mdx',
    'filtering.md',
    'forced-layout-graph.md',
    'funnel.md',
    'getting-started.md',
    'hierarchical-edge-bundling.md',
    'line-chart.md',
    'manual-setup-instruction.mdx',
    'matrix.md',
    'pie-chart.md',
    'playground.md',
    'projects.mdx',
    'sankey.md',
    'scatter.md',
    'sun-burst.md',
    'theme.md',
    'timeline.md',
    'tree-map.md',
    'visualizations.mdx',
    'word-cloud.md'
  ].map((file) => path.join('guides', file))
];

const cache = new Map();
let lastRequestAt = 0;
const translationProviders = [
  'https://translate.cutie.dating',
  'https://translate.fedilab.app'
];
let providerCursor = 0;

async function throttleRequests(minDelayMs = 220) {
  const elapsed = Date.now() - lastRequestAt;
  if (elapsed < minDelayMs) {
    await new Promise((resolve) => setTimeout(resolve, minDelayMs - elapsed));
  }
  lastRequestAt = Date.now();
}

function splitFrontmatter(content) {
  if (!content.startsWith('---\n')) {
    return { frontmatter: null, body: content };
  }

  const endIndex = content.indexOf('\n---\n', 4);
  if (endIndex === -1) {
    return { frontmatter: null, body: content };
  }

  const frontmatter = content.slice(4, endIndex);
  const body = content.slice(endIndex + 5);
  return { frontmatter, body };
}

async function translate(text, targetLang) {
  const trimmed = text.trim();
  if (!trimmed) return text;

  const [translated] = await translateMany([text], targetLang);
  return translated;
}

async function requestBatch(texts, targetLang) {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const provider = translationProviders[providerCursor % translationProviders.length];
    providerCursor += 1;
    try {
      await throttleRequests();
      const response = await Promise.race([
        fetch(`${provider}/translate`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            q: texts.length === 1 ? texts[0] : texts,
            source: 'en',
            target: targetLang,
            format: 'text'
          })
        }),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 10000);
        })
      ]);
      if (!response.ok) {
        if (response.status === 429 || response.status >= 500) {
          throw new Error(`HTTP ${response.status}`);
        }
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = await response.json();
      const translated = Array.isArray(payload?.translatedText)
        ? payload.translatedText
        : [typeof payload?.translatedText === 'string' ? payload.translatedText : texts[0]];
      return translated;
    } catch (error) {
      if (attempt === 4) {
        console.error(`Translation failed (${targetLang}):`, error.message);
        return texts;
      }
      const waitTime = attempt * 500;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      continue;
    }
  }

  return texts;
}

async function translateMany(texts, targetLang) {
  const output = new Array(texts.length);
  const unresolved = [];

  for (let i = 0; i < texts.length; i += 1) {
    const text = texts[i];
    if (!text.trim()) {
      output[i] = text;
      continue;
    }

    const key = `${targetLang}::${text}`;
    if (cache.has(key)) {
      output[i] = cache.get(key);
      continue;
    }

    unresolved.push({ index: i, text, key });
  }

  const batchSize = 24;
  const maxBatchChars = 12000;
  for (let i = 0; i < unresolved.length; ) {
    const batch = [];
    let size = 0;
    while (i < unresolved.length && batch.length < batchSize) {
      const next = unresolved[i];
      if (batch.length > 0 && size + next.text.length > maxBatchChars) {
        break;
      }
      batch.push(next);
      size += next.text.length;
      i += 1;
    }
    const translatedBatch = await requestBatch(
      batch.map((item) => item.text),
      targetLang
    );

    for (let j = 0; j < batch.length; j += 1) {
      const original = batch[j].text;
      const translated = translatedBatch[j] || original;
      output[batch[j].index] = translated;
      cache.set(batch[j].key, translated);
    }
  }

  return output;
}

async function translateFrontmatter(frontmatter, targetLang) {
  if (!frontmatter) return null;

  const lines = frontmatter.split('\n');
  const out = [];

  for (const line of lines) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_-]*):(\s*)(.*)$/);
    if (!match) {
      out.push(line);
      continue;
    }

    const [, key, spacing, rawValue] = match;
    const trimmedValue = rawValue.trim();
    if (!trimmedValue || trimmedValue.startsWith('[') || trimmedValue.startsWith('{')) {
      out.push(line);
      continue;
    }

    if (!['title', 'description'].includes(key)) {
      out.push(line);
      continue;
    }

    const quote = trimmedValue.startsWith('"') && trimmedValue.endsWith('"')
      ? '"'
      : trimmedValue.startsWith("'") && trimmedValue.endsWith("'")
        ? "'"
        : '';

    const unwrapped = quote ? trimmedValue.slice(1, -1) : trimmedValue;
    const translated = await translate(unwrapped, targetLang);
    const escaped = quote === '"' ? translated.replaceAll('"', '\\"') : translated;

    out.push(`${key}:${spacing}${quote}${escaped}${quote}`);
  }

  return out.join('\n');
}

async function translateBody(body, targetLang) {
  const lines = body.split('\n');
  const textEntries = [];
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    if (/^\s*```/.test(line)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;
    if (!line.trim()) continue;
    if (/^\s*{{[^}]+}}\s*$/.test(line)) continue;
    if (/^\s*(import|export)\s+.+$/.test(line)) continue;
    if (/^\s*<[^>]+>\s*$/.test(line) || /^\s*<\/[^>]+>\s*$/.test(line)) continue;

    let prefix = '';
    let text = line;
    const markerMatch = line.match(/^(\s*(?:#{1,6}\s+|[-*+]\s+|\d+\.\s+|>\s+))(.*)$/);
    if (markerMatch) {
      prefix = markerMatch[1];
      text = markerMatch[2];
    }

    const trimmedText = text.trim();
    if (!trimmedText) continue;
    if (/`[^`\n]+`/.test(trimmedText)) continue;
    if (/\[[^\]]+\]\([^)]+\)/.test(trimmedText)) continue;
    if (/https?:\/\/[^\s)]+/.test(trimmedText)) continue;
    if (/\/Illustry-monorepo\/[\w\-./]+/.test(trimmedText)) continue;

    textEntries.push({
      lineIndex: i,
      prefix,
      text: trimmedText
    });
  }

  const translatedTexts = await translateMany(
    textEntries.map((entry) => entry.text),
    targetLang
  );

  for (let i = 0; i < textEntries.length; i += 1) {
    const entry = textEntries[i];
    const translated = translatedTexts[i] ?? entry.text;
    lines[entry.lineIndex] = `${entry.prefix}${translated}`;
  }

  return lines.join('\n');
}

async function ensureDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function run() {
  const entries = await fs.readdir(docsRoot, { withFileTypes: true });
  const requestedLocales = process.env.LOCALES
    ? new Set(
        process.env.LOCALES.split(',')
          .map((value) => value.trim())
          .filter(Boolean)
      )
    : null;
  const locales = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => name !== 'guides' && localeMap[name])
    .filter((name) => !requestedLocales || requestedLocales.has(name));

  let writeCount = 0;

  for (const locale of locales) {
    const lang = localeMap[locale];
    console.log(`Translating locale: ${locale} (${lang})`);

    let fileIndex = 0;
    for (const relativeFile of sourceFiles) {
      fileIndex += 1;
      console.log(`  [${locale}] ${fileIndex}/${sourceFiles.length}: ${relativeFile}`);
      const sourcePath = path.join(docsRoot, relativeFile);
      const targetPath = path.join(docsRoot, locale, relativeFile);

      const sourceContent = await fs.readFile(sourcePath, 'utf8');
      const { frontmatter, body } = splitFrontmatter(sourceContent);

      const translatedFrontmatter = await translateFrontmatter(frontmatter, lang);
      const translatedBody = await translateBody(body, lang);

      const finalContent = translatedFrontmatter === null
        ? translatedBody
        : `---\n${translatedFrontmatter}\n---\n${translatedBody}`;

      await ensureDir(targetPath);
      await fs.writeFile(targetPath, finalContent, 'utf8');
      writeCount += 1;
    }
  }

  console.log(`Translated files: ${writeCount}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
