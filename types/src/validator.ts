import { VisualizationTypesEnum } from './visualization';
import { z } from 'zod';
import { ErrorMessageOptions, generateErrorMessage } from 'zod-error';
import { FileTypes } from '.';

const dateSchema = z.instanceof(Date);
const numberSchema = z.number();
const stringSchema = z.string();
const booleanSchema = z.boolean();

const withOptionalIdSchema = z.object({
    _id: stringSchema.optional()
});
const withIdSchema = z.object({
    _id: stringSchema
});
const withOptionalVersionSchema = z.object({
    __v: numberSchema.optional()
});

// Word-cloud
const wordTypeSchema = z.object({
    name: stringSchema,
    value: numberSchema,
    properties: z.union([z.any(), z.array(z.any()), z.string()]).optional()
});

const wordCloudDataSchema = z.object({
    words: z.array(wordTypeSchema)
});

// Calendar
const calendarTypeSchema = z.object({
    date: stringSchema,
    value: numberSchema,
    category: stringSchema,
    properties: z.union([z.any(), z.array(z.any()), z.string()]).optional()
});

const calendarDataSchema = z.object({
    calendar: z.array(calendarTypeSchema)
});

// Node-Link (force-directed-graph, sankey, hierarchical-edge-bundling)
const labelSchema = z.object({
    name: stringSchema,
    value: numberSchema,
    properties: z.union([z.any(), z.array(z.any()), z.string()]).optional()
});

const nodeSchema = z.object({
    name: stringSchema,
    category: stringSchema,
    labels: z.array(labelSchema).optional(),
    properties: z.union([z.any(), z.array(z.any()), z.string()]).optional()
});

const linkSchema = z.object({
    source: stringSchema,
    target: stringSchema,
    value: numberSchema,
    properties: z.union([z.any(), z.array(z.any()), z.string()]).optional()
});

const nodeLinkDataSchema = z.object({
    nodes: z.array(nodeSchema),
    links: z.array(linkSchema)
});

// AxisChart
const axisChartDataSchema = z.object({
    headers: z.array(stringSchema),
    values: z.record(z.array(z.number()).min(1))
});

// Scatter
const scatterDataSchema = z.object({
    points: z.array(
        z.object({
            value: z.tuple([z.number(), z.number()]),
            category: z.string()
        })
    )
});

// PieChart/Funnel
const pieChartFunnelDataSchema = z.object({
    values: z.record(z.number()),
    properties: z.union([z.any(), z.array(z.any()), z.string()]).optional()
});

// TreeMap/Sunburst
const hierarchyNode: z.ZodTypeAny = z.object({
    name: z.string(),
    value: z.number(),
    category: z.string(),
    properties: z.union([z.any(), z.array(z.any()), z.string()]).optional(),
    children: z.array(z.lazy(() => hierarchyNode)).optional()
});

const hierarchySchema = z.object({
    nodes: z.array(hierarchyNode)
});

// TimeLine

const timelineEventTagSchema = z.object({
    name: z.string()
});

const timelineEventSchema = z.object({
    summary: z.string(),
    date: z.string(),
    type: z.string(),
    author: z.string(),
    tags: z.array(timelineEventTagSchema).optional(),
    description: z.string().optional()
});

const timelineDataSchema = z.record(
    z.object({
        summary: z
            .object({
                title: z.string().optional()
            })
            .optional(),
        events: z.array(timelineEventSchema)
    })
);

// VisualizationData
const visualizationDataSchema = z.object({
    userId: stringSchema.optional(),
    projectName: stringSchema.min(1),
    description: stringSchema.optional(),
    name: stringSchema,
    type: z.union([
        z.literal(VisualizationTypesEnum.TREEMAP),
        z.literal(VisualizationTypesEnum.SUNBURST),
        z.literal(VisualizationTypesEnum.FORCE_DIRECTED_GRAPH),
        z.literal(VisualizationTypesEnum.SANKEY),
        z.literal(VisualizationTypesEnum.HIERARCHICAL_EDGE_BUNDLING),
        z.literal(VisualizationTypesEnum.MATRIX),
        z.literal(VisualizationTypesEnum.TIMELINE),
        z.literal(VisualizationTypesEnum.LINE_CHART),
        z.literal(VisualizationTypesEnum.BAR_CHART),
        z.literal(VisualizationTypesEnum.SCATTER),
        z.literal(VisualizationTypesEnum.PIE_CHART),
        z.literal(VisualizationTypesEnum.FUNNEL),
        z.literal(VisualizationTypesEnum.CALENDAR),
        z.literal(VisualizationTypesEnum.WORD_CLOUD),
        z.array(
            z.union([
                z.literal(VisualizationTypesEnum.TREEMAP),
                z.literal(VisualizationTypesEnum.SUNBURST),
                z.literal(VisualizationTypesEnum.FORCE_DIRECTED_GRAPH),
                z.literal(VisualizationTypesEnum.SANKEY),
                z.literal(VisualizationTypesEnum.HIERARCHICAL_EDGE_BUNDLING),
                z.literal(VisualizationTypesEnum.MATRIX),
                z.literal(VisualizationTypesEnum.TIMELINE),
                z.literal(VisualizationTypesEnum.LINE_CHART),
                z.literal(VisualizationTypesEnum.BAR_CHART),
                z.literal(VisualizationTypesEnum.SCATTER),
                z.literal(VisualizationTypesEnum.PIE_CHART),
                z.literal(VisualizationTypesEnum.FUNNEL),
                z.literal(VisualizationTypesEnum.CALENDAR),
                z.literal(VisualizationTypesEnum.WORD_CLOUD),
            ])
        )
    ]),
    tags: z.union([stringSchema, z.array(stringSchema)]).optional(),
    createdAt: dateSchema.optional(),
    updatedAt: dateSchema.optional()
})
    .merge(withOptionalIdSchema)
    .merge(withOptionalVersionSchema);

const visualizationNodeLinkSchema = visualizationDataSchema.extend({
    type: z.union([
        z.literal(VisualizationTypesEnum.FORCE_DIRECTED_GRAPH),
        z.literal(VisualizationTypesEnum.SANKEY),
        z.literal(VisualizationTypesEnum.HIERARCHICAL_EDGE_BUNDLING),
        z.literal(VisualizationTypesEnum.MATRIX),
        z.array(
            z.union([
                z.literal(VisualizationTypesEnum.FORCE_DIRECTED_GRAPH),
                z.literal(VisualizationTypesEnum.SANKEY),
                z.literal(VisualizationTypesEnum.HIERARCHICAL_EDGE_BUNDLING),
                z.literal(VisualizationTypesEnum.MATRIX)
            ])
        )
    ]),
    data: nodeLinkDataSchema
});

const visualizationTimelineSchema = visualizationDataSchema.extend({
    type: z.union([
        z.literal(VisualizationTypesEnum.TIMELINE),
        z.array(z.literal(VisualizationTypesEnum.TIMELINE))
    ]),
    data: timelineDataSchema
});

const visualizationAxisChartSchema = visualizationDataSchema.extend({
    type: z.union([
        z.literal(VisualizationTypesEnum.LINE_CHART),
        z.literal(VisualizationTypesEnum.BAR_CHART),
        z.array(
            z.union([
                z.literal(VisualizationTypesEnum.LINE_CHART),
                z.literal(VisualizationTypesEnum.BAR_CHART)
            ])
        )
    ]),
    data: axisChartDataSchema
});

const visualizationScatterSchema = visualizationDataSchema.extend({
    type: z.union([
        z.literal(VisualizationTypesEnum.SCATTER),
        z.array(z.literal(VisualizationTypesEnum.SCATTER))
    ]),
    data: scatterDataSchema
});

const visualizationPieChartFunnelSchema = visualizationDataSchema.extend({
    type: z.union([
        z.literal(VisualizationTypesEnum.PIE_CHART),
        z.literal(VisualizationTypesEnum.FUNNEL),
        z.array(
            z.union([
                z.literal(VisualizationTypesEnum.PIE_CHART),
                z.literal(VisualizationTypesEnum.FUNNEL)
            ])
        )
    ]),
    data: pieChartFunnelDataSchema
});

const visualizationCalendarSchema = visualizationDataSchema.extend({
    type: z.union([
        z.literal(VisualizationTypesEnum.CALENDAR),
        z.array(z.literal(VisualizationTypesEnum.CALENDAR))
    ]),
    data: calendarDataSchema
});

const visualizationWordCloudSchema = visualizationDataSchema.extend({
    type: z.union([
        z.literal(VisualizationTypesEnum.WORD_CLOUD),
        z.array(z.literal(VisualizationTypesEnum.WORD_CLOUD))
    ]),
    data: wordCloudDataSchema
});

const visualizationHierarchySchema = visualizationDataSchema.extend({
    type: z.union([
        z.literal(VisualizationTypesEnum.TREEMAP),
        z.literal(VisualizationTypesEnum.SUNBURST),
        z.array(
            z.union([
                z.literal(VisualizationTypesEnum.TREEMAP),
                z.literal(VisualizationTypesEnum.SUNBURST)
            ])
        )
    ]),
    data: hierarchySchema
});

const visualizationTypeSchema = z.union([
    visualizationNodeLinkSchema,
    visualizationCalendarSchema,
    visualizationWordCloudSchema,
    visualizationAxisChartSchema,
    visualizationScatterSchema,
    visualizationPieChartFunnelSchema,
    visualizationHierarchySchema,
    visualizationTimelineSchema
]);

const visualizationFilterSchema = z.object({
    userId: stringSchema.optional(),
    projectName: stringSchema.optional(),
    name: stringSchema.optional(),
    text: stringSchema.optional(),
    page: numberSchema.optional(),
    per_page: numberSchema.optional(),
    sort: z
        .object({
            element: stringSchema,
            sortOrder: z.union([stringSchema, numberSchema])
        })
        .optional()
});

const visualizationExtendedTypeSchema = z.object({
    projects: z.array(visualizationTypeSchema).optional(),
    pagination: z
        .object({
            count: numberSchema,
            pageCount: numberSchema
        })
        .optional()
});

const projectDataSchema = z.object({
    userId: stringSchema.optional(),
    name: stringSchema,
    description: stringSchema.optional(),
    createdAt: dateSchema.optional(),
    updatedAt: dateSchema.optional(),
    isActive: booleanSchema.optional()
});

const projectCreateSchema = projectDataSchema
    .merge(withOptionalIdSchema)
    .merge(withOptionalVersionSchema);

const projectTypeSchema = projectDataSchema
    .merge(withIdSchema)
    .merge(withOptionalVersionSchema);

const projectExtendedTypeSchema = z.object({
    projects: z.array(projectTypeSchema).optional(),
    pagination: z
        .object({
            count: numberSchema,
            pageCount: numberSchema
        })
        .optional()
});

const projectUpdateSchema = z.object({
    name: stringSchema.optional(),
    description: stringSchema.optional(),
    createdAt: dateSchema.optional(),
    updatedAt: dateSchema.optional(),
    isActive: booleanSchema.optional()
});

const projectFilterSchema = z.object({
    userId: stringSchema.optional(),
    name: stringSchema.optional(),
    text: stringSchema.optional(),
    page: numberSchema.optional(),
    per_page: numberSchema.optional(),
    isActive: booleanSchema.optional(),
    sort: z
        .object({
            element: stringSchema,
            sortOrder: z.union([stringSchema, numberSchema])
        })
        .optional()
});

const layoutSchema = z.object({
    i: stringSchema,
    x: numberSchema,
    y: numberSchema,
    w: numberSchema,
    h: numberSchema,
    minW: numberSchema,
    minH: numberSchema
});

const dashboardDataSchema = z.object({
    userId: stringSchema.optional(),
    name: stringSchema,
    projectName: stringSchema,
    description: stringSchema.optional(),
    createdAt: dateSchema.optional(),
    updatedAt: dateSchema.optional(),
    visualizations: z.record(z.string()).optional(),
    layouts: z.array(layoutSchema).optional()
});

const dashboardCreateSchema = dashboardDataSchema
    .merge(withOptionalIdSchema)
    .merge(withOptionalVersionSchema);

const dashboardTypeSchema = dashboardDataSchema
    .merge(withIdSchema)
    .merge(withOptionalVersionSchema);

const dashboardExtendedTypeSchema = z.object({
    dashboards: z.array(dashboardTypeSchema).optional(),
    pagination: z
        .object({
            count: numberSchema,
            pageCount: numberSchema
        })
        .optional()
});

const dashboardUpdateSchema = z.object({
    userId: stringSchema.optional(),
    name: stringSchema.optional(),
    projectName: stringSchema.optional(),
    description: stringSchema.optional(),
    createdAt: dateSchema.optional(),
    updatedAt: dateSchema.optional(),
    isActive: booleanSchema.optional()
});

const dashboardFilterSchema = z.object({
    userId: stringSchema.optional(),
    name: stringSchema.optional(),
    text: stringSchema.optional(),
    projectName: stringSchema.optional(),
    visualizationType: stringSchema.optional(),
    visualizationName: stringSchema.optional(),
    page: numberSchema.optional(),
    per_page: numberSchema.optional(),
    sort: z
        .object({
            element: stringSchema,
            sortOrder: z.union([stringSchema, numberSchema])
        })
        .optional()
});

const commonFileSchema = z.object({
    fullDetails: z.boolean().default(false),
    fileType: z.string(),
    files: z
        .unknown()
        .refine((val) => {
            if (!Array.isArray(val)) return false;
            if (val.some((file) => !(file instanceof File))) return false;
            return true;
        }, 'Must be an array of File')
        .nullable()
        .default(null)
});

const jsonFileSchema = commonFileSchema.extend({
    fileType: z.literal(FileTypes.FileType.JSON),
    name: z
        .string()
        .optional(),
    type: z
        .union([
            z.literal(VisualizationTypesEnum.WORD_CLOUD),
            z.literal(VisualizationTypesEnum.FORCE_DIRECTED_GRAPH),
            z.literal(VisualizationTypesEnum.SANKEY),
            z.literal(VisualizationTypesEnum.CALENDAR),
            z.literal(VisualizationTypesEnum.HIERARCHICAL_EDGE_BUNDLING),
            z.literal(VisualizationTypesEnum.MATRIX),
            z.literal(VisualizationTypesEnum.LINE_CHART),
            z.literal(VisualizationTypesEnum.BAR_CHART),
            z.literal(VisualizationTypesEnum.PIE_CHART),
            z.literal(VisualizationTypesEnum.SCATTER),
            z.literal(VisualizationTypesEnum.TREEMAP),
            z.literal(VisualizationTypesEnum.SUNBURST),
            z.literal(VisualizationTypesEnum.FUNNEL),
            z.literal(VisualizationTypesEnum.TIMELINE)
        ])
        .optional(),
    tags: z.string().optional(),
    description: z.string().max(50).optional()
});

const xmlFileSchema = commonFileSchema.extend({
    fileType: z.literal(FileTypes.FileType.XML),
    name: z
        .string()
        .optional(),
    type: z
        .union([
            z.literal(VisualizationTypesEnum.WORD_CLOUD),
            z.literal(VisualizationTypesEnum.FORCE_DIRECTED_GRAPH),
            z.literal(VisualizationTypesEnum.SANKEY),
            z.literal(VisualizationTypesEnum.CALENDAR),
            z.literal(VisualizationTypesEnum.HIERARCHICAL_EDGE_BUNDLING),
            z.literal(VisualizationTypesEnum.MATRIX),
            z.literal(VisualizationTypesEnum.LINE_CHART),
            z.literal(VisualizationTypesEnum.BAR_CHART),
            z.literal(VisualizationTypesEnum.PIE_CHART),
            z.literal(VisualizationTypesEnum.SCATTER),
            z.literal(VisualizationTypesEnum.TREEMAP),
            z.literal(VisualizationTypesEnum.SUNBURST),
            z.literal(VisualizationTypesEnum.FUNNEL),
            z.literal(VisualizationTypesEnum.TIMELINE)
        ])
        .optional(),
    tags: z.string().optional(),
    description: z.string().max(50).optional()
});

const excelFileSchema = commonFileSchema.extend({
    fileType: z.literal(FileTypes.FileType.EXCEL),
    name: z
        .string()
        .optional(),
    type: z
        .union([
            z.literal(VisualizationTypesEnum.WORD_CLOUD),
            z.literal(VisualizationTypesEnum.FORCE_DIRECTED_GRAPH),
            z.literal(VisualizationTypesEnum.SANKEY),
            z.literal(VisualizationTypesEnum.CALENDAR),
            z.literal(VisualizationTypesEnum.HIERARCHICAL_EDGE_BUNDLING),
            z.literal(VisualizationTypesEnum.MATRIX),
            z.literal(VisualizationTypesEnum.LINE_CHART),
            z.literal(VisualizationTypesEnum.BAR_CHART),
            z.literal(VisualizationTypesEnum.PIE_CHART),
            z.literal(VisualizationTypesEnum.SCATTER),
            z.literal(VisualizationTypesEnum.TREEMAP),
            z.literal(VisualizationTypesEnum.SUNBURST),
            z.literal(VisualizationTypesEnum.FUNNEL),
            z.literal(VisualizationTypesEnum.TIMELINE)
        ])
        .optional(),
    tags: z.string().optional(),
    description: z.string().max(50).optional(),
    includeHeaders: z.boolean().default(false),
    sheets: z.string().default('1'),
    mapping: z.any()
});

const csvFileSchema = commonFileSchema.extend({
    fileType: z.literal(FileTypes.FileType.CSV),
    name: z
        .string()
        .optional(),
    type: z
        .union([
            z.literal(VisualizationTypesEnum.WORD_CLOUD),
            z.literal(VisualizationTypesEnum.FORCE_DIRECTED_GRAPH),
            z.literal(VisualizationTypesEnum.SANKEY),
            z.literal(VisualizationTypesEnum.CALENDAR),
            z.literal(VisualizationTypesEnum.HIERARCHICAL_EDGE_BUNDLING),
            z.literal(VisualizationTypesEnum.MATRIX),
            z.literal(VisualizationTypesEnum.LINE_CHART),
            z.literal(VisualizationTypesEnum.BAR_CHART),
            z.literal(VisualizationTypesEnum.PIE_CHART),
            z.literal(VisualizationTypesEnum.SCATTER),
            z.literal(VisualizationTypesEnum.TREEMAP),
            z.literal(VisualizationTypesEnum.SUNBURST),
            z.literal(VisualizationTypesEnum.FUNNEL),
            z.literal(VisualizationTypesEnum.TIMELINE)
        ])
        .optional(),
    tags: z.string().optional(),
    description: z.string().max(50).optional(),
    includeHeaders: z.boolean().default(false),
    separator: z.string().default(','),
    mapping: z.any()
});

const visualizationFileSchema = z.union([
    jsonFileSchema,
    excelFileSchema,
    csvFileSchema,
    xmlFileSchema
]);


const prettifyZodError = (): ErrorMessageOptions => {
    const options: ErrorMessageOptions = {
        delimiter: {
            error: ' '
        },
        transform: ({ errorMessage, index }) => `Error #${index + 1}: ${errorMessage}`
    };
    return options;
};

const validateWithSchema = <T>(
    schema: z.ZodSchema<T>,
    data: T
): void => {
    const result = schema.safeParse(data);

    if (!result.success) {
        const errorMessage = generateErrorMessage(
            (result.error as any).issues,
            prettifyZodError()
        );
        throw new Error(errorMessage);
    }
};

export {
    dateSchema,
    numberSchema,
    stringSchema,
    booleanSchema,
    withOptionalIdSchema,
    withIdSchema,
    withOptionalVersionSchema,
    wordTypeSchema,
    wordCloudDataSchema,
    calendarTypeSchema,
    calendarDataSchema,
    labelSchema,
    nodeSchema,
    linkSchema,
    nodeLinkDataSchema,
    axisChartDataSchema,
    scatterDataSchema,
    pieChartFunnelDataSchema,
    hierarchyNode,
    hierarchySchema,
    timelineEventTagSchema,
    timelineEventSchema,
    timelineDataSchema,
    visualizationDataSchema,
    visualizationNodeLinkSchema,
    visualizationTimelineSchema,
    visualizationAxisChartSchema,
    visualizationScatterSchema,
    visualizationPieChartFunnelSchema,
    visualizationCalendarSchema,
    visualizationWordCloudSchema,
    visualizationHierarchySchema,
    projectDataSchema,
    dashboardDataSchema,
    visualizationTypeSchema,
    visualizationFilterSchema,
    visualizationExtendedTypeSchema,
    projectCreateSchema,
    projectTypeSchema,
    projectExtendedTypeSchema,
    projectUpdateSchema,
    projectFilterSchema,
    dashboardCreateSchema,
    dashboardTypeSchema,
    dashboardExtendedTypeSchema,
    dashboardUpdateSchema,
    dashboardFilterSchema,
    commonFileSchema,
    jsonFileSchema,
    xmlFileSchema,
    excelFileSchema,
    csvFileSchema,
    visualizationFileSchema,
    prettifyZodError,
    validateWithSchema
};
