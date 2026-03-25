#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const docsRoot = path.join(root, 'docs', 'src', 'content', 'docs');

const localeTargets = {
  ar: 'ar', bn: 'bn', de: 'de', el: 'el', es: 'es', fr: 'fr', he: 'he', hi: 'hi',
  id: 'id', it: 'it', ja: 'ja', ko: 'ko', nl: 'nl', pl: 'pl', pt: 'pt', ro: 'ro',
  ru: 'ru', th: 'th', tr: 'tr', uk: 'uk', ur: 'ur', vi: 'vi', zh: 'zh-CN'
};

const files = ['index.mdx', '404.md', path.join('guides', 'visualizations.mdx')];

const phrases = [
  'The visualization HUB you always needed.',
  '💻 Get Started',
  '📈  Learn about visualizations',
  'Discover the power of Visualizations',
  '📊  Dive into the World of Visualizations',
  'Explore captivating visualizations and discover the art and science behind transforming raw data into insightful graphics. From stunning charts to immersive graphs, embark on a journey of understanding data in ways that go beyond the numbers.',
  '📂 Many File Formats Supported',
  'Explore the versatility of our application! 🚀 Analyze data effortlessly as we seamlessly support multiple file formats, including JSON, XML, CSV, and Excel.',
  '🔍 Tailor Your Insights: Precision Filtering for Personalized Data Exploration',
  'Refine your data exploration experience with our powerful filtering capabilities! 🔗 Easily narrow down and focus on the information that matters most to you. Whether it\'s dates, categories, or custom criteria, unleash the ability to tailor your insights and uncover meaningful patterns in your data.',
  ' 🎮 Data Playground: Explore, Test, and Play with Your Data in Real Time!',
  'Step into our data playground, where exploration meets interactivity! 🚀 Test and play around with your actual data in real time. Gain hands-on experience, experiment with filters, and uncover insights effortlessly. It\'s your space to make data exploration an engaging and enjoyable experience!',
  '<strong>Something went wrong.</strong> We couldn’t find that page.<br>Check the URL or try using the search bar.',
  'Go home',
  'All visualizations formats files can be downloaded from [here](/Illustry-monorepo/illustry_file_formats.zip)'
];

const cache = new Map();
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const translate = async (text, target) => {
  const cacheKey = `${target}::${text}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${encodeURIComponent(target)}`;
  try {
    const response = await fetch(url, { headers: { accept: 'application/json' } });
    const payload = await response.json();
    const translated = typeof payload?.responseData?.translatedText === 'string'
      ? payload.responseData.translatedText
      : text;
    cache.set(cacheKey, translated || text);
    await wait(20);
    return translated || text;
  } catch {
    return text;
  }
};

const run = async () => {
  for (const [locale, target] of Object.entries(localeTargets)) {
    const translations = new Map();
    for (const phrase of phrases) {
      translations.set(phrase, await translate(phrase, target));
    }

    for (const relative of files) {
      const filePath = path.join(docsRoot, locale, relative);
      try {
        let content = await fs.readFile(filePath, 'utf8');
        for (const phrase of phrases) {
          content = content.split(phrase).join(translations.get(phrase));
        }
        await fs.writeFile(filePath, content, 'utf8');
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
