import fs from 'node:fs';
import path from 'node:path';

const PLACEHOLDER_TYPE_MAP = {
  ProjectData: { file: 'project.ts', typeName: 'ProjectData' },
  Layout: { file: 'dashboard.ts', typeName: 'Layout' },
  DashboardData: { file: 'dashboard.ts', typeName: 'DashboardData' },
  DashboardType: { file: 'dashboard.ts', typeName: 'DashboardType' },
  WordType: { file: 'visualization.ts', typeName: 'WordType' },
  WordCloudData: { file: 'visualization.ts', typeName: 'WordCloudData' },
  CalendarType: { file: 'visualization.ts', typeName: 'CalendarType' },
  CalendarData: { file: 'visualization.ts', typeName: 'CalendarData' },
  TimelineEventTag: { file: 'visualization.ts', typeName: 'TimelineEventTag' },
  TimelineEvent: { file: 'visualization.ts', typeName: 'TimelineEvent' },
  TimelineData: { file: 'visualization.ts', typeName: 'TimelineData' },
  Node: { file: 'visualization.ts', typeName: 'Node' },
  Link: { file: 'visualization.ts', typeName: 'Link' },
  NodeLinkData: { file: 'visualization.ts', typeName: 'NodeLinkData' },
  AxisChartData: { file: 'visualization.ts', typeName: 'AxisChartData' },
  ScatterPoint: { file: 'visualization.ts', typeName: 'ScatterPoint' },
  ScatterData: { file: 'visualization.ts', typeName: 'ScatterData' },
  PieChartData: { file: 'visualization.ts', typeName: 'PieChartData' },
  FunnelData: { file: 'visualization.ts', typeName: 'FunnelData' },
  HierarchyNode: { file: 'visualization.ts', typeName: 'HierarchyNode' },
  HierarchyData: { file: 'visualization.ts', typeName: 'HierarchyData' },
  VisualizationData: { file: 'visualization.ts', typeName: 'VisualizationData' }
};

const TYPES_SRC_DIR = ['..', 'types', 'src'];

const findDeclarationEnd = (source, startIndex) => {
  let braceDepth = 0;
  let bracketDepth = 0;
  let parenDepth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inTemplate = false;
  let escaped = false;

  for (let i = startIndex; i < source.length; i += 1) {
    const char = source[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (!inDoubleQuote && !inTemplate && char === '\'' && source[i - 1] !== '\\') {
      inSingleQuote = !inSingleQuote;
      continue;
    }

    if (!inSingleQuote && !inTemplate && char === '"' && source[i - 1] !== '\\') {
      inDoubleQuote = !inDoubleQuote;
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote && char === '`' && source[i - 1] !== '\\') {
      inTemplate = !inTemplate;
      continue;
    }

    if (inSingleQuote || inDoubleQuote || inTemplate) {
      continue;
    }

    if (char === '{') braceDepth += 1;
    if (char === '}') braceDepth -= 1;
    if (char === '[') bracketDepth += 1;
    if (char === ']') bracketDepth -= 1;
    if (char === '(') parenDepth += 1;
    if (char === ')') parenDepth -= 1;

    if (
      char === ';'
      && braceDepth === 0
      && bracketDepth === 0
      && parenDepth === 0
    ) {
      return i;
    }
  }

  return -1;
};

const extractTypeSnippet = (source, typeName) => {
  const declarationPrefix = `type ${typeName} =`;
  const declarationStart = source.indexOf(declarationPrefix);
  if (declarationStart === -1) {
    return null;
  }

  const equalIndex = source.indexOf('=', declarationStart);
  if (equalIndex === -1) {
    return null;
  }

  const semicolonDeclarationEnd = findDeclarationEnd(source, equalIndex + 1);
  const trailingSource = source.slice(declarationStart + declarationPrefix.length);
  const nextDeclarationOffset = trailingSource.search(/\n(?:type|enum|export)\s+/);
  const nextDeclarationIndex = nextDeclarationOffset === -1
    ? -1
    : declarationStart + declarationPrefix.length + nextDeclarationOffset;

  const declarationEnd = (
    semicolonDeclarationEnd !== -1
    && (nextDeclarationIndex === -1 || semicolonDeclarationEnd < nextDeclarationIndex)
  )
    ? semicolonDeclarationEnd + 1
    : (nextDeclarationIndex === -1 ? source.length : nextDeclarationIndex);

  const snippet = source.slice(declarationStart, declarationEnd).trim();
  if (!snippet) {
    return null;
  }

  return snippet;
};

const buildTypePlaceholderMap = (docsRoot) => {
  const typesDir = path.join(docsRoot, ...TYPES_SRC_DIR);
  const sourceCache = new Map();

  const readTypeFile = (fileName) => {
    if (!sourceCache.has(fileName)) {
      sourceCache.set(fileName, fs.readFileSync(path.join(typesDir, fileName), 'utf8'));
    }
    return sourceCache.get(fileName);
  };

  return Object.entries(PLACEHOLDER_TYPE_MAP).reduce((acc, [placeholder, config]) => {
    const source = readTypeFile(config.file);
    const snippet = extractTypeSnippet(source, config.typeName);
    if (snippet) {
      acc[placeholder] = snippet;
    }
    return acc;
  }, {});
};

const createTypePlaceholderRemarkPlugin = (placeholders) => () => (tree) => {
  const replaceValue = (value) => value.replace(/\{\{([A-Za-z0-9_]+)\}\}/g, (match, key) => (
    Object.prototype.hasOwnProperty.call(placeholders, key)
      ? placeholders[key]
      : match
  ));

  const walk = (node) => {
    if (!node || typeof node !== 'object') return;

    if (
      typeof node.value === 'string'
      && (node.type === 'code' || node.type === 'inlineCode' || node.type === 'text')
    ) {
      node.value = replaceValue(node.value);
    }

    if (Array.isArray(node.children)) {
      node.children.forEach(walk);
    }
  };

  walk(tree);
};

export { buildTypePlaceholderMap, createTypePlaceholderRemarkPlugin };
