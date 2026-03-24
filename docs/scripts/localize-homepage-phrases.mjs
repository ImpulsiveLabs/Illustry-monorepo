#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const docsRoot = path.join(process.cwd(), 'docs', 'src', 'content', 'docs');
const providers = ['https://translate.cutie.dating', 'https://translate.fedilab.app'];
let providerIndex = 0;

const localeMap = {
  ar: 'ar', bn: 'bn', de: 'de', el: 'el', es: 'es', fr: 'fr', he: 'he', hi: 'hi',
  id: 'id', it: 'it', ja: 'ja', ko: 'ko', nl: 'nl', pl: 'pl', pt: 'pt', ro: 'ro',
  ru: 'ru', th: 'th', tr: 'tr', uk: 'uk', ur: 'ur', vi: 'vi', zh: 'zh-Hans'
};

const phrases = [
  'Get Started',
  'Learn about visualizations',
  'Dive into the World of Visualizations',
  'Many File Formats Supported',
  'Tailor Your Insights: Precision Filtering for Personalized Data Exploration',
  'Data Playground: Explore, Test, and Play with Your Data in Real Time!',
  'Go home',
  'Not found',
  'The visualization HUB you always needed.'
];

async function translate(text, target) {
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
      if (!response.ok) throw new Error(String(response.status));
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
  for (const [locale, target] of Object.entries(localeMap)) {
    const localeDir = path.join(docsRoot, locale);
    const files = [path.join(localeDir, 'index.mdx'), path.join(localeDir, '404.md')];

    const translations = new Map();
    for (const phrase of phrases) {
      translations.set(phrase, await translate(phrase, target));
    }

    for (const file of files) {
      let content;
      try {
        content = await fs.readFile(file, 'utf8');
      } catch {
        continue;
      }

      let updated = content;
      for (const phrase of phrases) {
        updated = updated.split(phrase).join(translations.get(phrase));
      }

      if (updated !== content) {
        await fs.writeFile(file, updated, 'utf8');
      }
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
