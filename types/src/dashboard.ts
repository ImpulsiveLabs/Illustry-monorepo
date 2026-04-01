import { VisualizationTypes } from ".";
import {
    with_optional_id,
    with_optional_version,
    with_id,
    DeepPartial,
} from "./utils";

type Layout = {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW: number;
    minH: number;
};

type DashboardData = {
    userId?: string;
    name: string;
    projectName: string;
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
    visualizations?: {
        [name: string]: string;
    } | VisualizationTypes.VisualizationType[];
    layouts?: Layout[];
};

type DashboardCreate =
    DashboardData &
    with_optional_id &
    with_optional_version;

type DashboardType =
    DashboardData &
    with_id &
    with_optional_version;

type ExtendedDashboardType = {
    dashboards?: DashboardType[];
    pagination?: {
        count: number;
        pageCount: number;
    };
};

type DashboardUpdate = DeepPartial<DashboardType>;

type DashboardFilter = {
    userId?: string;
    name?: string;
    projectName?: string;
    visualizationName?: string;
    visualizationType?: string;
    text?: string;
    page?: number;
    per_page?: number;
    isActive?: boolean;
    sort?: {
        element: string;
        sortOrder: string | number;
    };
};

export { DashboardFilter, DashboardUpdate, ExtendedDashboardType, DashboardType, DashboardCreate, Layout }
