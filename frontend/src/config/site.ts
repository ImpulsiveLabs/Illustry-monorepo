import { VisualizationTypes } from '@illustry/types';
import { v4 as randomUUID } from 'uuid';

const siteConfig = {
  name: 'Illustry',
  description: 'An open source visualization hub',
  mainNav: [
    {
      title: 'Projects',
      href: '/projects',
      description: 'All projects',
      items: [],
      clickableNoActiveProject: true
    },
    {
      title: 'Visualizations',
      href: '/visualizations',
      description: 'All visualizations',
      items: [],
      clickableNoActiveProject: false
    },
    {
      title: 'Dashboards',
      href: '/dashboards',
      description: 'All dashboards',
      items: [],
      clickableNoActiveProject: false
    },
    {
      title: 'Playground',
      href: '/playground',
      description: 'Playground ',
      items: [],
      clickableNoActiveProject: true
    }
  ],
  nodeLink: {
    nodes: [
      {
        name: 'Data1',
        category: '1'
      },
      {
        name: 'Data2',
        category: '1'
      },
      {
        name: 'Data3',
        category: '2'
      },
      {
        name: 'Data4',
        category: '2'
      },
      {
        name: 'Data5',
        category: '3'
      },
      {
        name: 'Data6',
        category: '3'
      },
      {
        name: 'Data7',
        category: '4'
      }
    ],
    links: [
      {
        source: 'Data1',
        target: 'Data3',
        value: 5
      },
      {
        source: 'Data2',
        target: 'Data3',
        value: 10
      },
      {
        source: 'Data3',
        target: 'Data4',
        value: 10
      },
      {
        source: 'Data3',
        target: 'Data5',
        value: 30
      },
      {
        source: 'Data5',
        target: 'Data6',
        value: 4
      },
      {
        source: 'Data6',
        target: 'Data7',
        value: 16
      }
    ]
  },
  matrix: {
    nodes: [
      {
        category: '1',
        name: 'Node1',
        labels: [
          {
            name: 'Label1',
            value: 1,
            properties: {
              style: {
                'font-weight': 'bold',
                'background-color': '#541690',
                'background-color1': '541690'
              }
            }
          },
          {
            name: 'Label2',
            value: 0,
            properties: [
              {
                style: {
                  'font-weight': 'bold',
                  'background-color': '#541690',
                  'background-color1': '541690'
                }
              }
            ]
          }
        ]
      },
      {
        category: '2',
        name: 'Node2',
        labels: [
          {
            name: 'Label3',
            value: 1,
            properties: {
              style: {
                'font-weight': 'bold',
                'background-color': '#541690',
                'background-color1': '541690'
              }
            }
          },
          {
            name: 'Label4',
            value: 0,
            properties: [
              {
                style: {
                  'font-weight': 'bold',
                  'background-color': '#541690',
                  'background-color1': '541690'
                }
              }
            ]
          }
        ]
      }
    ],
    links: [
      {
        source: 'Node1',
        target: 'Node2',
        value: 1,
        properties: {
          style: {
            'font-weight': 'bold',
            'background-color': '#541690',
            'background-color1': '541690'
          },
          a: 'b'
        }
      },
      {
        source: 'Node2',
        target: 'Node1',
        value: 1,
        properties: {
          style: {
            'font-weight': 'bold',
            'background-color': '#541690',
            'background-color1': '541690'
          },
          a: 'b'
        }
      }
    ]
  },
  timeline: {
    '2023-10-07': {
      summary: {
        title: 'Sample Timeline'
      },
      events: [
        {
          summary: 'Event 1',
          date: '08:00:00',
          type: 'Type A',
          author: 'Author 1',
          tags: [{ name: 'Tag A' }],
          description: 'Description of Event 1'
        },
        {
          summary: 'Event 2',
          date: '09:00:00',
          type: 'Type B',
          author: 'Author 2'
        }
      ]
    },
    '2023-10-10': {
      summary: {
        title: 'Sample Timeline'
      },
      events: [
        {
          summary: 'Event 3',
          date: '09:00:00',
          type: 'Type C',
          author: 'Author 3'
        },
        {
          summary: 'Event 4',
          date: '10:00:00',
          type: 'Type D',
          author: 'Author 4'
        },
        {
          summary: 'Event 5',
          date: '10:00:00',
          type: 'Type E',
          author: 'Author 5'
        }
      ]
    },
    '2023-10-08': {
      summary: {
        title: 'Sample Timeline'
      },
      events: [
        {
          summary: 'Event 6',
          date: '11:00:00',
          type: 'Type F',
          author: 'Author 6'
        },
        {
          summary: 'Event 7',
          date: '11:00:00',
          type: 'Type G',
          author: 'Author 7'
        },
        {
          summary: 'Event 8',
          date: '12:00:00',
          type: 'Type H',
          author: 'Author 8'
        }
      ]
    },
    '2023-10-06 ': {
      summary: {
        title: 'Sample Timeline'
      },
      events: [
        {
          summary: 'Event 9',
          date: '12:00:00',
          type: 'Type I',
          author: 'Author 9'
        },
        {
          summary: 'Event 10',
          date: '13:00:00',
          type: 'Type J',
          author: 'Author 10'
        }
      ]
    }
  },
  words: [
    {
      name: 'Word1',
      value: 390
    },
    {
      name: 'Word2',
      value: 275
    },
    {
      name: 'Word3',
      value: 100
    },
    {
      name: 'Word4',
      value: 1000
    },
    {
      name: 'Word5',
      value: 600
    },
    {
      name: 'Word6',
      value: 146
    },
    {
      name: 'Word7',
      value: 712
    }
  ],
  calendar: [
    {
      date: '1939-09-02',
      value: 1,
      category: '1'
    },
    {
      date: '1939-09-07',
      value: 1,
      category: '2'
    },
    {
      date: '1939-09-17',
      value: 1,
      category: '3'
    },
    {
      date: '1939-10-06',
      value: 1,
      category: '1'
    },
    {
      date: '1939-10-07',
      value: 1,
      category: '1'
    },
    {
      date: '1939-10-14',
      value: 1,
      category: '5'
    },
    {
      date: '1939-10-17',
      value: 1,
      category: '1'
    },
    {
      date: '1939-10-22',
      value: 1,
      category: '6'
    },
    {
      date: '1939-10-28',
      value: 1,
      category: '1'
    },
    {
      date: '1939-11-04',
      value: 1,
      category: '7'
    },
    {
      date: '1939-11-28',
      value: 1,
      category: '3'
    },
    {
      date: '1939-12-05',
      value: 1,
      category: '3'
    },
    {
      date: '1939-12-11',
      value: 1,
      category: '2'
    },
    {
      date: '1939-12-16',
      value: 1,
      category: '2'
    },
    {
      date: '1939-12-23',
      value: 1,
      category: '1'
    }
  ],
  axisChart: {
    headers: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    values: {
      'Statistic 1': [120, 132, 101, 134, 90, 230, 210],
      'Statistic 2': [220, 182, 191, 234, 290, 330, 310],
      'Statistic 3': [150, 232, 201, 154, 190, 330, 410],
      'Statistic 4': [320, 332, 301, 334, 390, 330, 320]
    }
  },
  pieChart: {
    values: {
      'Statistic 1': 122,
      'Statistic 2': 222,
      'Statistic 3': 510,
      'Statistic 4': 320
    }
  },
  funnel: {
    values: {
      'Statistic 1': 122,
      'Statistic 2': 222,
      'Statistic 3': 510,
      'Statistic 4': 320
    }
  },
  scatter: {
    points: [
      { value: [3.275154, 2.957587], category: '3' },
      { value: [-3.344465, 2.603513], category: '2' },
      { value: [0.355083, -3.376585], category: '2' },
      { value: [1.852435, 3.547351], category: '1' },
      { value: [-2.078973, 2.552013], category: '1' }
    ]
  },
  hierarchy: {
    nodes: [
      {
        name: 'Node Group 1',
        value: 100,
        category: '1',
        children: [
          {
            name: 'Node 1',
            value: 40,
            category: '2',
            children: [
              {
                name: 'Node 1.1',
                value: 20,
                category: '3'
              },
              {
                name: 'Node 1.2',
                value: 10,
                category: '4'
              }
            ]
          },
          {
            name: 'Node 1.1',
            value: 30,
            category: '2',
            children: [
              {
                name: 'Node 1.1.1',
                value: 15,
                category: '5'
              }
            ]
          }
        ]
      },
      {
        name: 'Node group 2',
        value: 50,
        category: '6',
        children: [
          {
            name: 'Node 2',
            value: 25,
            category: '7',
            children: [
              {
                name: 'Node 2.2',
                value: 12,
                category: '8'
              }
            ]
          }
        ]
      }
    ]
  },
  visualizations: [
    {
      name: VisualizationTypes.VisualizationTypesEnum.BAR_CHART,
      id: randomUUID()
    },
    {
      name: VisualizationTypes.VisualizationTypesEnum.CALENDAR,
      id: randomUUID()
    },
    {
      name: VisualizationTypes.VisualizationTypesEnum.FORCE_DIRECTED_GRAPH,
      id: randomUUID()
    },
    {
      name: VisualizationTypes.VisualizationTypesEnum.FUNNEL,
      id: randomUUID()
    },
    {
      name: VisualizationTypes.VisualizationTypesEnum.HIERARCHICAL_EDGE_BUNDLING,
      id: randomUUID()
    },
    {
      name: VisualizationTypes.VisualizationTypesEnum.LINE_CHART,
      id: randomUUID()
    },
    {
      name: VisualizationTypes.VisualizationTypesEnum.MATRIX,
      id: randomUUID()
    },
    {
      name: VisualizationTypes.VisualizationTypesEnum.PIE_CHART,
      id: randomUUID()
    },
    {
      name: VisualizationTypes.VisualizationTypesEnum.SANKEY,
      id: randomUUID()
    },
    {
      name: VisualizationTypes.VisualizationTypesEnum.SCATTER,
      id: randomUUID()
    },
    {
      name: VisualizationTypes.VisualizationTypesEnum.SUNBURST,
      id: randomUUID()
    },
    {
      name: VisualizationTypes.VisualizationTypesEnum.TIMELINE,
      id: randomUUID()
    },
    {
      name: VisualizationTypes.VisualizationTypesEnum.TREEMAP,
      id: randomUUID()
    },
    {
      name: VisualizationTypes.VisualizationTypesEnum.WORD_CLOUD,
      id: randomUUID()
    }
  ],
  colorPallets: {
    FreshMeadow: [
      '#5DBE6E',
      '#4C8BF5',
      '#F0AC40',
      '#D73D6C',
      '#1D7A8A',
      '#B65911',
      '#84BA5B'
    ],
    OceanBreeze: [
      '#348AA7',
      '#54968F',
      '#8AB8A8',
      '#EFC050',
      '#45B29D',
      '#F07A18',
      '#D9544D'
    ],
    SunsetVibes: [
      '#FF6B6B',
      '#FFE66D',
      '#6B5B95',
      '#70C1B3',
      '#F9A03F',
      '#F7CAC9',
      '#92A8D1'
    ],
    EnchantedForest: [
      '#00539C',
      '#89BD9E',
      '#5DBE6E',
      '#FF9933',
      '#EFC88B',
      '#5A7247',
      '#360745'
    ],
    CityLights: [
      '#F6D55C',
      '#3CAEA3',
      '#ED553B',
      '#20639B',
      '#173F5F',
      '#3B5998',
      '#F05D23'
    ],
    VintageHues: [
      '#DE8A5A',
      '#9A8B4F',
      '#005792',
      '#3C1053',
      '#7A306C',
      '#8D5B4C',
      '#C98344'
    ],
    DreamyPastels: [
      '#FFD700',
      '#FF9A8B',
      '#87CEFA',
      '#D4AF37',
      '#98FB98',
      '#B19CD9',
      '#FFC0CB'
    ],
    TropicalParadise: [
      '#F2AA4C',
      '#0077B6',
      '#90BE6D',
      '#DA627D',
      '#5E60CE',
      '#577590',
      '#6A0572'
    ],
    MidnightMagic: [
      '#23022E',
      '#65187A',
      '#8A3B6B',
      '#2C5F2D',
      '#1D262A',
      '#4C2C69',
      '#51344D'
    ],
    EarthyTones: [
      '#BC8B66',
      '#393D3F',
      '#63707D',
      '#48484A',
      '#6B4226',
      '#C4C8C5',
      '#3A3D40'
    ]
  }
};
type SiteConfig = typeof siteConfig;

export default siteConfig;
export type { SiteConfig };
