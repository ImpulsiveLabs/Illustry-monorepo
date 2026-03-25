import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { buildTypePlaceholderMap, createTypePlaceholderRemarkPlugin } from './type-placeholders.mjs';

const docsLocales = {
  root: { label: 'English', lang: 'en' },
  es: { label: 'Español', lang: 'es' },
  fr: { label: 'Français', lang: 'fr' },
  de: { label: 'Deutsch', lang: 'de' },
  it: { label: 'Italiano', lang: 'it' },
  pt: { label: 'Português', lang: 'pt' },
  ru: { label: 'Русский', lang: 'ru' },
  uk: { label: 'Українська', lang: 'uk' },
  ro: { label: 'Română', lang: 'ro' },
  nl: { label: 'Nederlands', lang: 'nl' },
  pl: { label: 'Polski', lang: 'pl' },
  tr: { label: 'Türkçe', lang: 'tr' },
  el: { label: 'Ελληνικά', lang: 'el' },
  ar: { label: 'العربية', lang: 'ar' },
  he: { label: 'עברית', lang: 'he' },
  hi: { label: 'हिन्दी', lang: 'hi' },
  bn: { label: 'বাংলা', lang: 'bn' },
  ur: { label: 'اردو', lang: 'ur' },
  id: { label: 'Bahasa Indonesia', lang: 'id' },
  vi: { label: 'Tiếng Việt', lang: 'vi' },
  th: { label: 'ไทย', lang: 'th' },
  ja: { label: '日本語', lang: 'ja' },
  ko: { label: '한국어', lang: 'ko' },
  zh: { label: '中文', lang: 'zh-CN' }
};

const docsRoot = path.dirname(fileURLToPath(import.meta.url));
const docsContentRoot = path.join(docsRoot, 'src', 'content', 'docs');
const nonRootLocales = Object.keys(docsLocales).filter((locale) => locale !== 'root');
const typePlaceholders = buildTypePlaceholderMap(docsRoot);
const typePlaceholderRemarkPlugin = createTypePlaceholderRemarkPlugin(typePlaceholders);

const getDocFilePath = (docPath, locale = 'root') => {
  const localePrefix = locale === 'root' ? '' : `${locale}/`;
  const basePath = path.join(docsContentRoot, localePrefix, docPath);
  const candidates = [`${basePath}.mdx`, `${basePath}.md`];
  return candidates.find((candidate) => fs.existsSync(candidate));
};

const getDocTitle = (docPath, locale = 'root') => {
  const filePath = getDocFilePath(docPath, locale);

  if (!filePath) {
    return '';
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const titleMatch = fileContent.match(/^title:\s*(.+)$/m);
  return titleMatch ? titleMatch[1].trim().replace(/^["']|["']$/g, '') : '';
};

const buildGroupTranslations = (docPath) => Object.fromEntries(
  nonRootLocales
    .map((locale) => [locale, getDocTitle(docPath, locale)])
    .filter(([, title]) => Boolean(title))
);

const guideGroupTranslations = buildGroupTranslations('guides/getting-started');
const modelsGroupTranslations = buildGroupTranslations('guides/projects');
const themeGroupTranslations = buildGroupTranslations('guides/theme');
const playgroundGroupTranslations = buildGroupTranslations('guides/playground');
const filteringGroupTranslations = buildGroupTranslations('guides/filtering');
const visualizationsGroupTranslations = buildGroupTranslations('guides/visualizations');

// https://astro.build/config
export default defineConfig({
  site: 'https://impulsivelabs.github.io',
  base: '/Illustry-monorepo',
  markdown: {
    remarkPlugins: [typePlaceholderRemarkPlugin]
  },
  integrations: [
    starlight({
      title: 'Illustry',
      defaultLocale: 'root',
      locales: docsLocales,
      logo: {
        light: './src/assets/logo-light.svg',
        dark: '/src/assets/logo-dark.svg',
        replacesTitle: true
      },
      components: {
        LanguageSelect: './src/components/LanguageSelect.astro'
      },
      customCss: ['./src/styles/custom.css'],
      head: [
        {
          tag: 'link',
          attrs: {
            rel: 'icon',
            href: 'icon.ico',
            sizes: '32x32'
          }
        },
        {
          tag: 'meta',
          attrs: {
            name: 'description',
            content: 'Illustry documentation for building multilingual visual analytics with ECharts and customizable dashboards.'
          }
        },
        {
          tag: 'meta',
          attrs: {
            name: 'keywords',
            content: 'Illustry, docs, ECharts, dashboard, analytics, visualization, multilingual, starlight, astro'
          }
        },
        {
          tag: 'meta',
          attrs: {
            name: 'robots',
            content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
          }
        },
        {
          tag: 'meta',
          attrs: {
            property: 'og:type',
            content: 'website'
          }
        },
        {
          tag: 'meta',
          attrs: {
            property: 'og:site_name',
            content: 'Illustry Docs'
          }
        },
        {
          tag: 'meta',
          attrs: {
            property: 'og:title',
            content: 'Illustry Documentation'
          }
        },
        {
          tag: 'meta',
          attrs: {
            property: 'og:description',
            content: 'Guides for projects, visualizations, dashboards, themes, and playground workflows in Illustry.'
          }
        },
        {
          tag: 'meta',
          attrs: {
            property: 'og:url',
            content: 'https://impulsivelabs.github.io/Illustry-monorepo/'
          }
        },
        {
          tag: 'meta',
          attrs: {
            name: 'twitter:card',
            content: 'summary_large_image'
          }
        },
        {
          tag: 'meta',
          attrs: {
            name: 'twitter:title',
            content: 'Illustry Documentation'
          }
        },
        {
          tag: 'meta',
          attrs: {
            name: 'twitter:description',
            content: 'Production documentation for Illustry visualizations and dashboards.'
          }
        },
        {
          tag: 'script',
          attrs: {
            type: 'application/ld+json'
          },
          content: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Illustry Documentation',
            url: 'https://impulsivelabs.github.io/Illustry-monorepo/',
            inLanguage: Object.keys(docsLocales).map((key) => (key === 'root' ? 'en' : key)),
            publisher: {
              '@type': 'Organization',
              name: 'Illustry'
            },
            potentialAction: {
              '@type': 'SearchAction',
              target: 'https://impulsivelabs.github.io/Illustry-monorepo/?q={search_term_string}',
              'query-input': 'required name=search_term_string'
            }
          })
        },
        {
          tag: 'script',
          attrs: {
            type: 'text/javascript'
          },
          content: `(function () {
  var base = '/Illustry-monorepo';
  var supported = ${JSON.stringify(Object.keys(docsLocales).filter((locale) => locale !== 'root'))};
  var countryToLocale = { ES: 'es', MX: 'es', AR: 'es', CO: 'es', CL: 'es', FR: 'fr', BE: 'fr', CH: 'de', DE: 'de', AT: 'de', IT: 'it', BR: 'pt', PT: 'pt', RU: 'ru', UA: 'uk', RO: 'ro', NL: 'nl', PL: 'pl', TR: 'tr', GR: 'el', EG: 'ar', SA: 'ar', IL: 'he', IN: 'hi', BD: 'bn', PK: 'ur', ID: 'id', VN: 'vi', TH: 'th', JP: 'ja', KR: 'ko', CN: 'zh', TW: 'zh', HK: 'zh' };
  var getCookie = function (name) {
    var value = document.cookie.split(';').map(function (item) { return item.trim(); }).find(function (item) { return item.indexOf(name + '=') === 0; });
    return value ? decodeURIComponent(value.slice(name.length + 1)) : '';
  };
  var normalize = function (value) {
    if (!value) return '';
    var normalized = value.toLowerCase().replace('_', '-');
    if (supported.indexOf(normalized) >= 0) return normalized;
    var prefix = normalized.split('-')[0];
    return supported.indexOf(prefix) >= 0 ? prefix : '';
  };
  var pathname = window.location.pathname;
  var atDocsRoot = pathname === base || pathname === base + '/' || pathname === '/';
  var pathParts = pathname.replace(/^\\/+|\\/+$/g, '').split('/');
  var currentLocale = pathParts.length > 1 ? normalize(pathParts[1]) : '';
  if (currentLocale) {
    localStorage.setItem('illustry-docs-locale', currentLocale);
    return;
  }
  if (!atDocsRoot) return;
  var savedLocale = normalize(localStorage.getItem('illustry-docs-locale'));
  var cookieLocale = normalize(getCookie('illustry-locale'));
  var countryLocale = countryToLocale[(getCookie('illustry-country') || '').toUpperCase()] || '';
  var browserLocale = '';
  var languageSources = (navigator.languages && navigator.languages.length > 0 ? navigator.languages : [navigator.language || 'en']);
  for (var i = 0; i < languageSources.length; i += 1) {
    var candidate = normalize(languageSources[i]);
    if (candidate) {
      browserLocale = candidate;
      break;
    }
  }
  var preferred = savedLocale || cookieLocale || countryLocale || browserLocale;
  if (preferred && supported.indexOf(preferred) >= 0) {
    window.location.replace(base + '/' + preferred + '/');
  }
})();`
        }
      ],
      favicon: 'icon.ico',
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://impulsivelabs.github.io/Illustry-monorepo/'
        },
        {
          icon: 'linkedin',
          label: 'LinkedIn',
          href: 'https://www.linkedin.com/in/vladimir-nitu-antonie-763b45172/'
        }
      ],
      sidebar: [
        {
          label: 'Guide',
          translations: guideGroupTranslations,
          items: [
            { slug: 'guides/getting-started' },
            { slug: 'guides/manual-setup-instruction' }
          ]
        },
        {
          label: 'Models',
          translations: modelsGroupTranslations,
          items: [
            { slug: 'guides/projects' },
            { slug: 'guides/visualizations' },
            { slug: 'guides/dashboards' }
          ]
        },
        {
          label: 'Theme',
          translations: themeGroupTranslations,
          items: [
            { slug: 'guides/theme' }
          ]
        },
        {
          label: 'Playground',
          translations: playgroundGroupTranslations,
          items: [
            { slug: 'guides/playground' }
          ]
        },
        {
          label: 'Filtering',
          translations: filteringGroupTranslations,
          items: [
            { slug: 'guides/filtering' }
          ]
        },
        {
          label: 'Visualizations',
          translations: visualizationsGroupTranslations,
          items: [
            { slug: 'guides/word-cloud' },
            { slug: 'guides/forced-layout-graph' },
            { slug: 'guides/sankey' },
            { slug: 'guides/calendar' },
            { slug: 'guides/hierarchical-edge-bundling' },
            { slug: 'guides/matrix' },
            { slug: 'guides/line-chart' },
            { slug: 'guides/bar-chart' },
            { slug: 'guides/pie-chart' },
            { slug: 'guides/scatter' },
            { slug: 'guides/tree-map' },
            { slug: 'guides/sun-burst' },
            { slug: 'guides/funnel' },
            { slug: 'guides/timeline' }
          ]
        }
      ]
    })
  ]
});
