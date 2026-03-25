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
  zh: 'zh-CN'
};

const targetedFiles = [
  '404.md',
  'index.mdx',
  'guides/sun-burst.md',
  'guides/tree-map.md',
  'guides/sankey.md',
  'guides/projects.mdx',
  'guides/visualizations.mdx',
  'guides/filtering.md',
  'guides/dashboards.mdx'
];

const cache = new Map();

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const splitFrontmatter = (content) => {
  if (!content.startsWith('---\n')) {
    return { frontmatter: null, body: content };
  }

  const endIndex = content.indexOf('\n---\n', 4);
  if (endIndex === -1) {
    return { frontmatter: null, body: content };
  }

  return {
    frontmatter: content.slice(4, endIndex),
    body: content.slice(endIndex + 5)
  };
};

const translate = async (text, target) => {
  const source = text.trim();
  if (!source) return text;

  const cacheKey = `${target}::${source}`;
  if (cache.has(cacheKey)) {
    return text.replace(source, cache.get(cacheKey));
  }

  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(source)}&langpair=en|${encodeURIComponent(target)}`;
  try {
    const response = await fetch(url, { headers: { accept: 'application/json' } });
    const payload = await response.json();
    const translated = typeof payload?.responseData?.translatedText === 'string'
      ? payload.responseData.translatedText
      : source;
    cache.set(cacheKey, translated || source);
    await delay(15);
    return text.replace(source, translated || source);
  } catch {
    return text;
  }
};

const translateFrontmatter = async (frontmatter, target) => {
  if (!frontmatter) return null;

  const lines = frontmatter.split('\n');
  const out = [];

  for (const line of lines) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_.-]*):(\s*)(.*)$/);
    if (!match) {
      out.push(line);
      continue;
    }

    const [, key, spacing, rawValue] = match;
    const value = rawValue.trim();
    if (!value) {
      out.push(line);
      continue;
    }

    if (!['title', 'description', 'tagline'].includes(key)) {
      out.push(line);
      continue;
    }

    const quote = value.startsWith('"') && value.endsWith('"')
      ? '"'
      : value.startsWith("'") && value.endsWith("'")
        ? "'"
        : '';
    const unwrapped = quote ? value.slice(1, -1) : value;
    const translated = await translate(unwrapped, target);
    const escaped = quote === '"' ? translated.replaceAll('"', '\\"') : translated;
    out.push(`${key}:${spacing}${quote}${escaped}${quote}`);
  }

  return out.join('\n');
};

const translateBody = async (body, target) => {
  const lines = body.split('\n');
  const out = [];
  let inCode = false;

  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      inCode = !inCode;
      out.push(line);
      continue;
    }

    if (inCode || !line.trim()) {
      out.push(line);
      continue;
    }

    if (/^\s*(import|export)\s+/.test(line)) {
      out.push(line);
      continue;
    }

    if (/^\s*<[^>]+>\s*$/.test(line) || /^\s*<\/[A-Za-z][^>]*>\s*$/.test(line)) {
      out.push(line);
      continue;
    }

    if (/^\s*\|/.test(line)) {
      out.push(line);
      continue;
    }

    if (/\[[^\]]+\]\([^)]*\)/.test(line) && !/^\s*[-*+]\s+/.test(line)) {
      out.push(line);
      continue;
    }

    const markerMatch = line.match(/^(\s*(?:#{1,6}\s+|[-*+]\s+|\d+\.\s+|>\s+)?)(.*)$/);
    if (!markerMatch) {
      out.push(line);
      continue;
    }

    const [, prefix, text] = markerMatch;
    if (!text.trim()) {
      out.push(line);
      continue;
    }

    const translated = await translate(text, target);
    out.push(`${prefix}${translated}`);
  }

  return out.join('\n');
};

const run = async () => {
  for (const [locale, target] of Object.entries(localeTargets)) {
    for (const relativeFile of targetedFiles) {
      const sourcePath = path.join(docsRoot, relativeFile);
      const localePath = path.join(docsRoot, locale, relativeFile);

      try {
        const sourceContent = await fs.readFile(sourcePath, 'utf8');
        const { frontmatter, body } = splitFrontmatter(sourceContent);
        const translatedFrontmatter = await translateFrontmatter(frontmatter, target);
        const translatedBody = await translateBody(body, target);

        const finalContent = translatedFrontmatter === null
          ? translatedBody
          : `---\n${translatedFrontmatter}\n---\n${translatedBody}`;

        await fs.mkdir(path.dirname(localePath), { recursive: true });
        await fs.writeFile(localePath, finalContent, 'utf8');
      } catch {
        continue;
      }
    }
    console.log(`done ${locale}`);
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
