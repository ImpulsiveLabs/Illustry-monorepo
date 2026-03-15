import { VisualizationTypes } from '@illustry/types';
import { evaluateCondition } from './generic';

const nodeLinksWords = [
  'categories',
  'sources',
  'targets',
  'names',
  'values'
];

const applyNodeNameFilter = (
  filter: string,
  defaultData: {
    nodes: VisualizationTypes.Node[];
    links: VisualizationTypes.Link[];
  },
  filterType: string
) => {
  const included: string[] = [];
  const excluded: string[] = [];

  try {
    const regexPattern = new RegExp(
      `${filterType}\\s*([!=]+)\\s*\\[([^\\]]+)\\]`,
      'g'
    );
    const matches = filter.match(regexPattern);

    if (matches) {
      matches.forEach((match) => {
        const innerRegexPattern = new RegExp(
          `${filterType}\\s*([!=]+)\\s*\\[([^\\]]+)\\]`
        );
        const [, operator = '', values = ''] = match.match(innerRegexPattern) ?? [];
        const filterCategories = values
          .replace(/'/g, '')
          .split(/\s*,\s*/)
          .filter(Boolean);
        if (operator === '=') {
          included.push(...filterCategories);
        } else if (operator === '!=') {
          excluded.push(...filterCategories);
        }
      });

      if (filterType === 'categories' || filterType === 'names') {
        const filteredNodes = defaultData.nodes.filter(
          (node) => (included.length
            && included.includes(
              filterType === 'categories' ? node.category : node.name
            ))
            || (excluded.length
              && !excluded.includes(
                filterType === 'categories' ? node.category : node.name
              ))
        );
        const remainingNodesNames = filteredNodes.map((node) => node.name);
        const filteredLinks = defaultData.links.filter(
          (link) => remainingNodesNames.length
            && remainingNodesNames.includes(link.source)
            && remainingNodesNames.includes(link.target)
        );
        return { nodes: filteredNodes, links: filteredLinks };
      }
      const filteredLinks = defaultData.links.filter(
        (link) => (included.length
          && included.includes(
            filterType === 'sources' ? link.source : link.target
          ))
          || (excluded.length
            && !excluded.includes(
              filterType === 'sources' ? link.source : link.target
            ))
      );
      const remainingNodesNames = [...new Set(filteredLinks
        .flatMap((link) => [link.source, link.target]))];
      const filteredNodes = defaultData.nodes
        .filter((node) => remainingNodesNames.includes(node.name));
      return { nodes: filteredNodes, links: filteredLinks };
    }
  } catch (error) {
    return defaultData;
  }
  return defaultData;
};

const applyValuesFilter = (
  valuesFilter: string,
  defaultData: {
    nodes: VisualizationTypes.Node[];
    links: VisualizationTypes.Link[];
  }
) => {
  try {
    let valuesOperations: string[] = [];
    const matchesValues = valuesFilter.match(/values\s*([><=!]*)\s*(\d+)/g);
    if (matchesValues) {
      valuesOperations = matchesValues.map((match) => {
        const [, operator = '', values = ''] = match.match(/values\s*([><=!]*)\s*(\d+)/) ?? [];
        const filterValue = values.trim();
        return `${operator}${filterValue}`;
      });
    }
    const filteredLinks = defaultData.links.map((link) => {
      if (valuesOperations.length > 0) {
        if (valuesOperations.every((condition) => evaluateCondition(link.value, condition))) {
          return link;
        }
        return {
          source: '', target: '', value: 0, properties: ''
        };
      }
      return link;
    });
    const remainingNodesNames = [...new Set(filteredLinks
      .flatMap((link) => [link.source, link.target]))];
    const filteredNodes = defaultData.nodes
      .filter((node) => remainingNodesNames.includes(node.name));
    return { nodes: filteredNodes, links: filteredLinks };
  } catch (error) {
    return defaultData;
  }
};

const applyNodeLinkFilter = (
  expressions: string[],
  defaultData: {
    nodes: VisualizationTypes.Node[];
    links: VisualizationTypes.Link[];
  }
) => {
  let newData: {
    nodes: VisualizationTypes.Node[];
    links: VisualizationTypes.Link[];
  } = { nodes: [...defaultData.nodes], links: [...defaultData.links] };
  const categoriesFilter = expressions.filter((expression) => expression.includes('categories')).join('&&');
  const sourcesFilter = expressions.filter((expression) => expression.includes('sources')).join('&&');
  const targetsFilter = expressions.filter((expression) => expression.includes('targets')).join('&&');
  const namesFilter = expressions.filter((expression) => expression.includes('names')).join('&&');
  const valuesFilter = expressions.filter((expression) => expression.includes('values')).join('&&');
  if (categoriesFilter !== '') {
    newData = applyNodeNameFilter(categoriesFilter, newData, 'categories');
  }
  if (sourcesFilter !== '') {
    newData = applyNodeNameFilter(sourcesFilter, newData, 'sources');
  }
  if (targetsFilter !== '') {
    newData = applyNodeNameFilter(targetsFilter, newData, 'targets');
  }
  if (namesFilter !== '') {
    newData = applyNodeNameFilter(namesFilter, newData, 'names');
  }
  if (valuesFilter !== '') {
    newData = applyValuesFilter(valuesFilter, newData);
  }
  return newData;
};

export { nodeLinksWords, applyNodeLinkFilter };
