import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://impulsivelabs.github.io',
	base: '/Illustry-monorepo',
	integrations: [
		starlight({
			title: 'Illustry',
			logo: {
				light: './src/assets/logo-light.svg',
				dark: '/src/assets/logo-dark.svg',
				replacesTitle: true,
			},
			head: [
				{
				  tag: 'link',
				  attrs: {
					rel: 'icon',
					href:'icon.ico',
					sizes: '32x32',
				  },
				},
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
					items: [
						{ label: 'Start here', link: '/guides/getting-started/' },
						{ label: 'Manual Setup', link: '/guides/manual-setup-instruction/'}
					],
				},
				{
					label: 'Models',
					items: [
						{label: 'Projects', link: '/guides/projects/'},
						{label: 'Visualizations', link: '/guides/visualizations/'},
						{label: 'Dashboards', link: '/guides/dashboards/'}
					]
				},
				{
					label: 'Theme',
					items: [
						{label: 'Apply Themes', link:'guides/theme'}
					]
				},
				{
					label: 'Playground',
					items: [
						{label: 'Playground', link:'guides/playground'}
					]
				},
				{
					label: 'Filtering',
					items: [
						{label: 'Filter your data', link:'guides/filtering'}
					]
				},
				{
					label: 'Visualizations',
					items: [
						{label: 'Word Cloud', link:'guides/word-cloud'},
						{label: 'Forced Layout Graph', link:'guides/forced-layout-graph'},
						{label: 'Sankey Diagram', link:'guides/sankey'},
						{label: 'Calendar', link:'guides/calendar'},
						{label: 'Hierarchical Edge Bundling', link:'guides/hierarchical-edge-bundling'},
						{label: 'Matrix', link:'guides/matrix'},
						{label: 'Line Chart', link:'guides/line-chart'},
						{label: 'Bar Chart', link:'guides/bar-chart'},
						{label: 'Pie Chart', link:'guides/pie-chart'},
						{label: 'Scatter Plot', link:'guides/scatter'},
						{label: 'Tree Map', link:'guides/tree-map'},
						{label: 'Sun Burst', link:'guides/sun-burst'},
						{label: 'Funnel', link:'guides/funnel'},
						{label: 'Timeline', link:'guides/timeline'},
					]
				}
			],
		}),
	],
});
