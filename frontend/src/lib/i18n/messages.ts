export const SUPPORTED_LOCALES = ['en', 'fr', 'de', 'zh', 'ro'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

type Messages = Record<string, string>;

const messages: Record<Locale, Messages> = {
  en: {
    'common.home': 'Home',
    'common.toggleMenu': 'Toggle Menu',
    'common.toggleTheme': 'Toggle theme',
    'common.language': 'Language',
    'nav.projects': 'Projects',
    'nav.visualizations': 'Visualizations',
    'nav.dashboards': 'Dashboards',
    'nav.theme': 'Theme',
    'nav.playground': 'Playground',
    'tooltip.generic': 'Interactive chart. Use filters and legend.',
    'tooltip.axis': 'Compare trends across categories.',
    'tooltip.calendar': 'Explore values by date and category.',
    'tooltip.forcedLayout': 'Inspect graph links and clusters.',
    'tooltip.funnel': 'Track stages from top to bottom.',
    'tooltip.heb': 'Follow grouped edge relationships.',
    'tooltip.matrix': 'See pairwise links in table form.',
    'tooltip.pie': 'Compare part-to-whole distribution.',
    'tooltip.sankey': 'Follow flow between connected nodes.',
    'tooltip.scatter': 'Compare points by x, y, and group.',
    'tooltip.sunburst': 'Drill into hierarchical proportions.',
    'tooltip.timeline': 'Browse events in chronological order.',
    'tooltip.treemap': 'Compare hierarchy using area size.',
    'tooltip.wordcloud': 'Top words sized by value.'
  },
  fr: {
    'common.home': 'Accueil',
    'common.toggleMenu': 'Ouvrir le menu',
    'common.toggleTheme': 'Changer le thème',
    'common.language': 'Langue',
    'nav.projects': 'Projets',
    'nav.visualizations': 'Visualisations',
    'nav.dashboards': 'Tableaux de bord',
    'nav.theme': 'Thème',
    'nav.playground': 'Playground',
    'tooltip.generic': 'Graphique interactif. Utilisez filtres et légende.',
    'tooltip.axis': 'Comparez les tendances par catégorie.',
    'tooltip.calendar': 'Explorez les valeurs par date et catégorie.',
    'tooltip.forcedLayout': 'Inspectez les liens et clusters du graphe.',
    'tooltip.funnel': 'Suivez les étapes de haut en bas.',
    'tooltip.heb': 'Suivez les relations d’arêtes groupées.',
    'tooltip.matrix': 'Visualisez les liens par paires en tableau.',
    'tooltip.pie': 'Comparez la répartition des parts.',
    'tooltip.sankey': 'Suivez les flux entre nœuds connectés.',
    'tooltip.scatter': 'Comparez les points par x, y et groupe.',
    'tooltip.sunburst': 'Explorez les proportions hiérarchiques.',
    'tooltip.timeline': 'Parcourez les événements chronologiquement.',
    'tooltip.treemap': 'Comparez la hiérarchie par surface.',
    'tooltip.wordcloud': 'Mots principaux dimensionnés par valeur.'
  },
  de: {
    'common.home': 'Startseite',
    'common.toggleMenu': 'Menü umschalten',
    'common.toggleTheme': 'Thema umschalten',
    'common.language': 'Sprache',
    'nav.projects': 'Projekte',
    'nav.visualizations': 'Visualisierungen',
    'nav.dashboards': 'Dashboards',
    'nav.theme': 'Thema',
    'nav.playground': 'Playground',
    'tooltip.generic': 'Interaktives Diagramm. Filter und Legende nutzen.',
    'tooltip.axis': 'Trends über Kategorien vergleichen.',
    'tooltip.calendar': 'Werte nach Datum und Kategorie erkunden.',
    'tooltip.forcedLayout': 'Graph-Verbindungen und Cluster prüfen.',
    'tooltip.funnel': 'Phasen von oben nach unten verfolgen.',
    'tooltip.heb': 'Gebündelte Kantenbeziehungen nachverfolgen.',
    'tooltip.matrix': 'Paarweise Verbindungen als Matrix sehen.',
    'tooltip.pie': 'Anteile im Verhältnis zum Ganzen vergleichen.',
    'tooltip.sankey': 'Flüsse zwischen verbundenen Knoten verfolgen.',
    'tooltip.scatter': 'Punkte nach x, y und Gruppe vergleichen.',
    'tooltip.sunburst': 'Hierarchische Anteile aufschlüsseln.',
    'tooltip.timeline': 'Ereignisse chronologisch durchgehen.',
    'tooltip.treemap': 'Hierarchie über Flächengröße vergleichen.',
    'tooltip.wordcloud': 'Top-Wörter nach Wert skaliert.'
  },
  zh: {
    'common.home': '首页',
    'common.toggleMenu': '切换菜单',
    'common.toggleTheme': '切换主题',
    'common.language': '语言',
    'nav.projects': '项目',
    'nav.visualizations': '可视化',
    'nav.dashboards': '仪表板',
    'nav.theme': '主题',
    'nav.playground': '演练场',
    'tooltip.generic': '交互图表，可使用筛选和图例。',
    'tooltip.axis': '按类别比较趋势。',
    'tooltip.calendar': '按日期和类别查看数值。',
    'tooltip.forcedLayout': '查看图连接与聚类。',
    'tooltip.funnel': '自上而下跟踪阶段。',
    'tooltip.heb': '查看分组边关系。',
    'tooltip.matrix': '以矩阵查看成对关系。',
    'tooltip.pie': '比较整体中的占比。',
    'tooltip.sankey': '跟踪节点之间的流向。',
    'tooltip.scatter': '按 x、y 与分组比较点。',
    'tooltip.sunburst': '下钻查看层级占比。',
    'tooltip.timeline': '按时间顺序浏览事件。',
    'tooltip.treemap': '按面积比较层级结构。',
    'tooltip.wordcloud': '按数值缩放的高频词。'
  },
  ro: {
    'common.home': 'Acasă',
    'common.toggleMenu': 'Comută meniul',
    'common.toggleTheme': 'Comută tema',
    'common.language': 'Limbă',
    'nav.projects': 'Proiecte',
    'nav.visualizations': 'Vizualizări',
    'nav.dashboards': 'Tablouri de bord',
    'nav.theme': 'Temă',
    'nav.playground': 'Playground',
    'tooltip.generic': 'Grafic interactiv. Folosește filtre și legendă.',
    'tooltip.axis': 'Compară tendințe între categorii.',
    'tooltip.calendar': 'Explorează valori pe date și categorii.',
    'tooltip.forcedLayout': 'Inspectează legături și clustere în graf.',
    'tooltip.funnel': 'Urmărește etapele de sus în jos.',
    'tooltip.heb': 'Urmărește relațiile de muchii grupate.',
    'tooltip.matrix': 'Vezi legături pereche în format matrice.',
    'tooltip.pie': 'Compară distribuția părților din întreg.',
    'tooltip.sankey': 'Urmărește fluxuri între noduri conectate.',
    'tooltip.scatter': 'Compară puncte după x, y și grup.',
    'tooltip.sunburst': 'Explorează proporțiile ierarhice.',
    'tooltip.timeline': 'Parcurge evenimentele cronologic.',
    'tooltip.treemap': 'Compară ierarhia prin suprafață.',
    'tooltip.wordcloud': 'Cuvinte principale scalate după valoare.'
  }
};

const resolveLocaleFromLanguage = (language?: string | null): Locale => {
  if (!language) {
    return 'en';
  }

  const normalized = language.toLowerCase();
  if (normalized.startsWith('fr')) return 'fr';
  if (normalized.startsWith('de')) return 'de';
  if (normalized.startsWith('zh')) return 'zh';
  if (normalized.startsWith('ro')) return 'ro';
  return 'en';
};

const getMessage = (locale: Locale, key: string) => messages[locale][key] || messages.en[key] || key;

const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
  de: 'Deutsch',
  zh: '中文',
  ro: 'Română'
};

export {
  LOCALE_LABELS,
  getMessage,
  resolveLocaleFromLanguage
};
