import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  site: 'https://impulsivelabs.github.io',
  base: '/Illustry-monorepo',
  integrations: [
    starlight({
      title: 'Illustry',
      defaultLocale: 'root',
      locales: {
        root: { label: 'English', lang: 'en' },
        fr: { label: 'Francais', lang: 'fr' },
        de: { label: 'Deutsch', lang: 'de' },
        zh: { label: 'Chinese', lang: 'zh-CN' },
        ro: { label: 'Romana', lang: 'ro' }
      },
      logo: {
        light: './src/assets/logo-light.svg',
        dark: '/src/assets/logo-dark.svg',
        replacesTitle: true
      },
      head: [
        {
          tag: 'link',
          attrs: {
            rel: 'icon',
            href: 'icon.ico',
            sizes: '32x32'
          }
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
          translations: { fr: 'Guide', de: 'Leitfaden', zh: '指南', ro: 'Ghid' },
          items: [
            {
              label: 'Start here',
              translations: { fr: 'Commencer', de: 'Start', zh: '从这里开始', ro: 'Incepe aici' },
              link: '/guides/getting-started/'
            },
            {
              label: 'Manual Setup',
              translations: { fr: 'Configuration manuelle', de: 'Manuelle Einrichtung', zh: '手动设置', ro: 'Configurare manuala' },
              link: '/guides/manual-setup-instruction/'
            }
          ]
        },
        {
          label: 'Models',
          translations: { fr: 'Modele', de: 'Modelle', zh: '模型', ro: 'Modele' },
          items: [
            { label: 'Projects', translations: { fr: 'Projets', de: 'Projekte', zh: '项目', ro: 'Proiecte' }, link: '/guides/projects/' },
            { label: 'Visualizations', translations: { fr: 'Visualisations', de: 'Visualisierungen', zh: '可视化', ro: 'Vizualizari' }, link: '/guides/visualizations/' },
            { label: 'Dashboards', translations: { fr: 'Tableaux de bord', de: 'Dashboards', zh: '仪表板', ro: 'Tablouri de bord' }, link: '/guides/dashboards/' }
          ]
        },
        {
          label: 'Theme',
          translations: { fr: 'Theme', de: 'Theme', zh: '主题', ro: 'Tema' },
          items: [
            { label: 'Apply Themes', translations: { fr: 'Appliquer des themes', de: 'Themes anwenden', zh: '应用主题', ro: 'Aplica teme' }, link: '/guides/theme' }
          ]
        },
        {
          label: 'Playground',
          translations: { fr: 'Playground', de: 'Playground', zh: '演练场', ro: 'Playground' },
          items: [
            { label: 'Playground', translations: { fr: 'Playground', de: 'Playground', zh: '演练场', ro: 'Playground' }, link: '/guides/playground' }
          ]
        },
        {
          label: 'Filtering',
          translations: { fr: 'Filtrage', de: 'Filterung', zh: '筛选', ro: 'Filtrare' },
          items: [
            { label: 'Filter your data', translations: { fr: 'Filtrer vos donnees', de: 'Daten filtern', zh: '筛选你的数据', ro: 'Filtreaza datele' }, link: '/guides/filtering' }
          ]
        },
        {
          label: 'Visualizations',
          translations: { fr: 'Visualisations', de: 'Visualisierungen', zh: '可视化', ro: 'Vizualizari' },
          items: [
            { label: 'Word Cloud', link: '/guides/word-cloud' },
            { label: 'Forced Layout Graph', link: '/guides/forced-layout-graph' },
            { label: 'Sankey Diagram', link: '/guides/sankey' },
            { label: 'Calendar', link: '/guides/calendar' },
            { label: 'Hierarchical Edge Bundling', link: '/guides/hierarchical-edge-bundling' },
            { label: 'Matrix', link: '/guides/matrix' },
            { label: 'Line Chart', link: '/guides/line-chart' },
            { label: 'Bar Chart', link: '/guides/bar-chart' },
            { label: 'Pie Chart', link: '/guides/pie-chart' },
            { label: 'Scatter Plot', link: '/guides/scatter' },
            { label: 'Tree Map', link: '/guides/tree-map' },
            { label: 'Sun Burst', link: '/guides/sun-burst' },
            { label: 'Funnel', link: '/guides/funnel' },
            { label: 'Timeline', link: '/guides/timeline' }
          ]
        }
      ]
    })
  ]
});
