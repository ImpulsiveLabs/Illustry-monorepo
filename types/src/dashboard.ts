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

type DashboardSharePermission = 'viewer' | 'editor';
type DashboardShareStatus = 'pending' | 'accepted' | 'rejected';
type DashboardShareScope = 'owned' | 'external' | 'all';

type DashboardSharedUser = {
    userId: string;
    email?: string;
    name?: string;
    permission: DashboardSharePermission;
    status?: DashboardShareStatus;
    inviteToken?: string;
    inviteExpiresAt?: Date;
    respondedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
};

type DashboardData = {
    userId?: string;
    ownerEmail?: string;
    ownerName?: string;
    currentUserRole?: DashboardSharePermission | 'owner';
    shareStatus?: DashboardShareStatus;
    isExternal?: boolean;
    shareId?: string;
    sharedWith?: DashboardSharedUser[];
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
    shareId?: string;
    sharedWithUserId?: string;
    sharedScope?: DashboardShareScope;
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

type DashboardShareRequest = {
    name?: string;
    shareId?: string;
    collaborators: Array<{
        email: string;
        permission?: DashboardSharePermission;
    }>;
};

type DashboardShareInviteDecision = {
    token: string;
    decision: 'accept' | 'reject';
};

export {
    DashboardFilter,
    DashboardUpdate,
    ExtendedDashboardType,
    DashboardType,
    DashboardCreate,
    Layout,
    DashboardSharePermission,
    DashboardShareStatus,
    DashboardShareScope,
    DashboardSharedUser,
    DashboardShareRequest,
    DashboardShareInviteDecision
}
