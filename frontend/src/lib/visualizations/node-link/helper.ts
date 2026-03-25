import { TransformerTypes, VisualizationTypes } from '@illustry/types';

// Sankey transformers
const computeCategoriesSankey = (nodes: VisualizationTypes.Node[]) => [
  ...new Set(
    nodes.map((node) => node.category)
  )
];

const computePropertiesForToolTip = (
  properties: string | Record<string, string | number>,
  value?: number | string
) => {
  let prop = '';
  if (typeof properties === 'object') {
    Object.entries(properties).forEach(([key, propValue]) => {
      prop += `<div style="font-weight: bold">${key}:${propValue}</div>`;
    });

    if (value) {
      prop += `<div style="font-weight: bold">value:${value}</div>`;
    }
  } else if (typeof properties === 'string') {
    if (value) {
      prop
        += `${properties}<div style="font-weight: bold">value:${value}</div>`;
    } else {
      prop += properties;
    }
  }

  return prop;
};

const computeNodesSankey = (
  nodes: VisualizationTypes.Node[],
  categories: string[],
  colors: string[]
) => {
  const colorMapSchema = new Map<string, string>();
  categories.forEach((cat, index) => {
    colorMapSchema.set(cat, colors[index] as string);
  });
  return nodes.map((node) => {
    const { name, category, properties } = node;
    const colorKey = colorMapSchema.has(category) ? category : name;
    const finalNode: TransformerTypes.NodeWithStyling = {
      name,
      itemStyle: {
        color: colorMapSchema.get(colorKey),
        borderColor: colorMapSchema.get(colorKey)
      }
    };
    if (properties) {
      finalNode.prop = computePropertiesForToolTip((properties as Record<string, string | number> | string));
    }
    return finalNode;
  });
};

const computeLinksSankey = (links: VisualizationTypes.Link[]) => links.map((link) => {
  const {
    source, target, value, properties
  } = link;
  const finalLink: TransformerTypes.LinkWithStyling = {
    source,
    target,
    value
  };
  if (properties) {
    finalLink.prop = computePropertiesForToolTip((properties as Record<string, string | number> | string), value);
  }
  return finalLink;
});

// HEB transformers

const computeNodesHEB = (
  nodes: VisualizationTypes.Node[],
  categories: {
    name: string;
    itemStyle: { color: string | undefined };
  }[]
) => nodes.map((node) => {
  const { name, category: nCategory, properties } = node;
  const category = categories.find((cate) => cate.name === nCategory);
  const finalNode: TransformerTypes.NodeWithStyling = {
    ...node,
    id: name,
    label: {
      show: true,
      color: category?.itemStyle.color || '#000'
    },
    symbolSize: ''
  };
  if (properties) {
    finalNode.prop = computePropertiesForToolTip((properties as Record<string, string | number> | string));
  }
  return finalNode;
});

// FLG transformers

const computeCategoriesFLGOrHEB = (nodes: VisualizationTypes.Node[], colors: string[]) => [
  ...new Set(
    nodes.map((node) => node.category)
  )
].map((node, index) => ({ name: node, itemStyle: { color: colors[index] } }));

const computeNodesFLG = (
  nodes: VisualizationTypes.Node[],
  categories: {
    name: string;
  }[]
) => nodes.map((node, index) => {
  const { category: nCategory, name, properties } = node;
  const categoryIndex = categories.findIndex(
    (category) => category.name === nCategory
  );
  const finalNode: TransformerTypes.NodeWithStyling = {
    id: index.toString(),
    name,
    category: categoryIndex
  };
  if (properties) {
    finalNode.prop = computePropertiesForToolTip((properties as Record<string, string | number> | string));
  }
  return finalNode;
});

const computeLinksFLGOrHEB = (links: VisualizationTypes.Link[], nodes: VisualizationTypes.Node[]) => links.map((link) => {
  const {
    source: lSource, target: lTarget, value, properties
  } = link;
  const source = nodes.findIndex((node) => node.name === lSource);
  const target = nodes.findIndex((node) => node.name === lTarget);
  const finalLink: TransformerTypes.LinkWithStyling = {
    source,
    target,
    value
  };
  if (properties) {
    finalLink.prop = computePropertiesForToolTip((properties as Record<string, string | number> | string), value);
  }
  return finalLink;
});

// Matrix

const constructMatrixTooltip = (obj: unknown) => {
  if (!obj || typeof obj !== 'object') {
    return '';
  }
  return `<span class="tooltip" style=" width: 10%; 
background-color: rgba(235, 0, 0, 0.703); color: #fff; text-align: center; 
border-radius: 6px; padding: 5px 0; position: absolute; z-index: 1;">${Object.entries(
    obj
  )
    .map(([k, v]) => `${k}:${v}</br>`)
    .join(' ')}</span>`;
};

const constructMatrixStyle = (styleObject: unknown) => {
  if (!styleObject || typeof styleObject !== 'object') {
    return '';
  }
  return `${Object.entries(styleObject)
    .map(([k, v]) => `${k}:${v}`)
    .join(';')};width:10%;text-align:center; border: 1px solid #ddd ;`;
};

const constructMatrixToolTipAndStyle = (
  htmlElement: string,
  tooltip: string,
  style: string,
  name: string | number,
  classNames: string[] = []
) => {
  const className = classNames.join(' ');
  return `<${htmlElement} class="${className}" style=${style?.length
    ? `${style};border: 1px solid #ddd ;`
    : 'width:10%;text-align:center; border: 1px solid #ddd ;'
  }>${tooltip?.length ? tooltip : ''}${name}</${htmlElement}>`;
};

const categoryMap = (
  nodes: VisualizationTypes.Node[]
) => nodes.reduce((map: Record<string, VisualizationTypes.Node[]>, node) => {
  const { category } = node;
  if (!map[category]) {
    // eslint-disable-next-line no-param-reassign
    map[category] = [];
    map[category]?.push(node);
  } else {
    map[category]?.push(node);
  }
  return map;
}, {});

const constructPropertiesMatrix = (
  htmlElement: string,
  value: string | number,
  properties?: object | object[] | string,
  className?: string[]
) => {
  let finalConstruction = '';
  if (properties) {
    if (Array.isArray(properties)) {
      let style = '';
      let tooltip = '';
      properties.filter(Boolean).forEach((prop) => {
        Object.entries(prop).forEach(([key, value]) => {
          if (key.includes('style')) {
            style += constructMatrixStyle(value);
          } else {
            tooltip += constructMatrixTooltip(value);
          }
        });
      });
      finalConstruction += constructMatrixToolTipAndStyle(
        htmlElement,
        tooltip,
        style,
        value,
        className
      );
    } else if (typeof properties === 'object') {
      let style = '';
      let tooltip = '';
      Object.entries(properties).filter(Boolean).forEach(([kProp, kValue]) => {
        if (kProp.includes('style')) {
          style += constructMatrixStyle(kValue);
        } else {
          tooltip += constructMatrixTooltip(kValue);
        }
      });
      finalConstruction += constructMatrixToolTipAndStyle(
        htmlElement,
        tooltip,
        style,
        value,
        className
      );
    }
  } else {
    finalConstruction += constructMatrixToolTipAndStyle(
      htmlElement,
      '',
      '',
      value,
      className
    );
  }
  return finalConstruction;
};

const createRightHeaderString = (spacesForEmptyTd: number, headers: VisualizationTypes.Node[]) => {
  let firstRow = ' <tr id="header" ><th> </th>';
  for (let i = 0; i < spacesForEmptyTd; i += 1) {
    firstRow += '<th style="width: 10%; "> </th>';
  }
  headers.forEach((header) => {
    firstRow += constructPropertiesMatrix(
      'th',
      header.name,
      header.properties,
      ['right-sortable-items']
    );
  });
  firstRow += '</tr> ';
  return firstRow;
};

const populateRightPropertiesString = (group2: VisualizationTypes.Node[], label: string) => {
  let finalProduct = '';
  group2.forEach((g2: VisualizationTypes.Node) => {
    const foundLabel = g2.labels?.find(
      (groupLabel) => groupLabel.name === label
    );

    if (foundLabel) {
      finalProduct += constructPropertiesMatrix(
        'td',
        foundLabel.value,
        foundLabel.properties,
        ['right-sortable-items']
      );
    } else {
      finalProduct += constructPropertiesMatrix('td', '', undefined, [
        'right-sortable-items'
      ]);
    }
  });

  return finalProduct;
};

/* v8 ignore start */
const getTextContent = (td: Element) => (td.lastChild?.textContent ? td.lastChild?.textContent : '');
/* v8 ignore stop */

const getSwappedIndexes = (arr: number[], dir: string) => {
  // Create an array of indices and sort it based on the values in 'arr'
  const indices = Array.from(arr.keys());
  indices.sort((a, b) => {
    if (dir === 'asc') {
      return (arr[a] as number) - (arr[b] as number);
    }
    return (arr[b] as number) - (arr[a] as number);
  });
  return indices;
};

const sortUpperTable = (n: number, newDir: string) => {
  const table = document.getElementById('myTable') as HTMLElement;
  const rows = table.getElementsByTagName('TR');
  const rowsElements: Element[] = [];
  if (rows[n]) {
    const rowsEl = rows[n].getElementsByClassName('right-sortable-items') as HTMLCollectionOf<Element>;
    rowsElements.push(...rowsEl);
  }
  if (rowsElements.length > 0) {
    const rowsValues = rowsElements.map((el) => {
      const element = Number.isNaN(parseInt(getTextContent(el) as string, 10))
        ? 0
        : Number.parseInt(getTextContent(el) as string, 10);
      return element;
    });
    const newIndexMap = getSwappedIndexes(rowsValues, newDir);

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      if (!row) {
        // Defensive guard for strict indexed access checks.
        // eslint-disable-next-line no-continue
        continue;
      }
      const sortableItemsArray: Element[] = [];
      const rowsEl = row.getElementsByClassName('right-sortable-items') as HTMLCollectionOf<Element>;
      sortableItemsArray.push(...rowsEl);
      if (sortableItemsArray.length) {
        const sortedItems = newIndexMap.map(
          (newIndex) => sortableItemsArray[newIndex]
        );
        // Replace the "right-sortable-items" elements in the current row with the sorted items
        const existingSortableItems = row.getElementsByClassName(
          'right-sortable-items'
        ) as HTMLCollectionOf<Element>;
        for (
          let j = 0;
          j < existingSortableItems.length;
          j += 1
        ) {
          const existingItem = existingSortableItems[j];
          const sortedItem = sortedItems[j];
          if (sortedItem && existingItem) {
            existingItem.replaceWith(
              sortedItem.cloneNode(true)
            );
          }
        }
      }
    }
  }
};

const sortColumns = () => {
  const sortable = document.querySelectorAll('.sortableCol');
  sortable.forEach((s, sIndex) => {
    s.addEventListener('click', () => {
      // Get the current sorting direction from the data attribute
      const currentDir = s.getAttribute('right-data-sort-direction');
      let newDir;

      // Toggle the sorting direction
      if (currentDir === 'asc') {
        newDir = 'desc';
      } else {
        newDir = 'asc';
      }

      // Update the data attribute with the new sorting direction
      s.setAttribute('right-data-sort-direction', newDir);

      // Call sortUpperTable with the column index (sIndex + 1) and the new sorting direction
      sortUpperTable(sIndex + 1, newDir);
    });
  });
};

const sortLowerTable = (n: number, newDir: string) => {
  const table = document.getElementById('myTable') as HTMLElement;
  const sortedRows = Array.from(table.getElementsByClassName('sortus'));

  // Sort the rows based on the specified column and direction
  sortedRows.sort((row1, row2) => {
    const element1 = row1.getElementsByClassName('left-sortable-items')[n];
    const element2 = row2.getElementsByClassName('left-sortable-items')[n];

    const element1Text = getTextContent(element1 as HTMLElement);
    const element2Text = getTextContent(element2 as HTMLElement);

    const element1Value = Number.isNaN(Number.parseInt(element1Text as string, 10))
      ? 0
      : Number.parseInt(element1Text as string, 10);
    const element2Value = Number.isNaN(Number.parseInt(element2Text as string, 10))
      ? 0
      : Number.parseInt(element2Text as string, 10);

    if (newDir === 'asc') {
      return element1Value - element2Value;
    }
    return element2Value - element1Value;
  });

  // Clear the table and reinsert the sorted rows
  const tbody = table.querySelector('tbody');
  sortedRows.forEach((row) => {
    tbody?.appendChild(row);
  });
};

const addStyleTooltipWithHover = () => {
  const sortableItems = document.querySelectorAll(
    '.right-sortable-items, .left-sortable-items'
  );

  sortableItems.forEach((sortableItem) => {
    const tooltip: HTMLElement = sortableItem.querySelector(
      '.tooltip'
    ) as HTMLElement;

    if (tooltip) {
      tooltip.style.visibility = 'hidden';

      sortableItem.addEventListener('mouseover', () => {
        tooltip.style.visibility = 'visible';
      });

      sortableItem.addEventListener('mouseout', () => {
        tooltip.style.visibility = 'hidden';
      });
    }
  });
};

const sortRows = () => {
  const sortable = document.querySelectorAll('.sortableRow');
  sortable.forEach((s, sIndex) => {
    s.addEventListener('click', () => {
      // Get the current sorting direction from the data attribute
      const currentDir = s.getAttribute('left-data-sort-direction');
      let newDir;

      // Toggle the sorting direction
      if (currentDir === 'asc') {
        newDir = 'desc';
      } else {
        newDir = 'asc';
      }

      // Update the data attribute with the new sorting direction
      s.setAttribute('left-data-sort-direction', newDir);

      // Call sortLowerTable with the column index (sIndex + 1) and the new sorting direction
      sortLowerTable(sIndex, newDir);
    });
  });
};

const createLeftHeaderString = (labels: string[]) => {
  let finalProduct = '<tr><td style="width: 10%; "></td>';
  labels.forEach((label: string) => {
    finalProduct += '<td class="sortableRow" left-data-sort-direction:"asc" style ="font-weight:bold;width: 10%;'
      + `border: 1px solid #ddd ; cursor: pointer; text-align:center;">${label} </td>`;
  });
  return `${finalProduct}</tr>`;
};

const createRightPropertiesString = (
  spacesForEmptyTd: number,
  labels: string[],
  group2: VisualizationTypes.Node[]
) => {
  const finalProduct = labels.map((label: string) => {
    let row = '<tr>';
    for (let i = 0; i < spacesForEmptyTd - 1; i += 1) {
      row += '<td style= "width: 10%;"></td>';
    }
    row += '<td class="sortableCol" right-data-sort-direction="asc" style="font-weight: bold;'
      + `width: 10%; border: 1px solid #ddd ; cursor: pointer;text-align:center;">${label}</td>`
      + `<td></td>${populateRightPropertiesString(
        group2,
        label
      )}</tr>`;

    return row;
  });
  return finalProduct.join('');
};

const populateLinks = (
  group1Name: string,
  group2Name: string,
  links: VisualizationTypes.Link[]
) => {
  let finalProduct = '';

  const foundLink = links.find((link) => (
    (link.source === group1Name && link.target === group2Name)
    || (link.target === group1Name && link.source === group2Name)
  ));
  if (foundLink) {
    finalProduct += constructPropertiesMatrix(
      'td',
      foundLink.value,
      foundLink.properties,
      ['right-sortable-items', 'left-sortable-items']
    );
  } else {
    finalProduct += constructPropertiesMatrix('td', '', undefined, [
      'right-sortable-items',
      'left-sortable-items'
    ]);
  }

  return finalProduct;
};

const createLeftPropertiesString = (
  group1: VisualizationTypes.Node[],
  group2: VisualizationTypes.Node[],
  links: VisualizationTypes.Link[],
  labels: string[]
) => {
  let finalProduct = '';
  group1.forEach((g1) => {
    const row = '<tr class = "sortus">'
      + `<td style = "font-weight:bold;width: 10%;text-align:center;border: 1px solid #ddd ; ">${g1.name}</td>`;
    finalProduct += row;
    labels.forEach((label) => {
      const foundLabel = g1.labels?.find(
        (groupLabel) => groupLabel.name === label
      );

      if (foundLabel) {
        finalProduct += constructPropertiesMatrix(
          'td',
          foundLabel.value,
          foundLabel.properties,
          ['left-sortable-items']
        );
      } else {
        finalProduct += constructPropertiesMatrix('td', '', undefined, [
          'left-sortable-items'
        ]);
      }
    });
    group2.forEach((g2) => {
      finalProduct += populateLinks(g1.name, g2.name, links);
    });
    finalProduct += '</tr>';
  });
  return finalProduct;
};

const createHeadersAndPropertiesString = (
  group1: VisualizationTypes.Node[],
  group2: VisualizationTypes.Node[],
  links: VisualizationTypes.Link[]
) => {
  const uniqueLabelNamesGroup1 = [
    ...new Set(
      group1.flatMap((node) => node.labels?.map((label) => label.name) || [])
    )
  ];
  const uniqueLabelNamesGroup2 = [
    ...new Set(
      group2.flatMap((node) => node.labels?.map((label) => label.name) || [])
    )
  ];

  const rightHeader: string = createRightHeaderString(
    uniqueLabelNamesGroup1.length,
    group2
  );
  const rightProperties: string = createRightPropertiesString(
    uniqueLabelNamesGroup1.length,
    uniqueLabelNamesGroup2,
    group2
  );
  const leftHeader = createLeftHeaderString(uniqueLabelNamesGroup1);
  const leftProperties = createLeftPropertiesString(
    group1,
    group2,
    links,
    uniqueLabelNamesGroup1
  );
  const tableString: string = `<thead>${rightHeader
  }</thead>`
    + `<tbody>${rightProperties
    }${leftHeader
    }${leftProperties
    }</tbody>`;
  return tableString;
};

export {
  computeCategoriesSankey,
  computeNodesSankey,
  computeLinksSankey,
  sortColumns,
  sortRows,
  addStyleTooltipWithHover,
  createHeadersAndPropertiesString,
  computeCategoriesFLGOrHEB,
  computeNodesHEB,
  computeLinksFLGOrHEB,
  computeNodesFLG,
  categoryMap
};
