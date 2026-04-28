import {
  with_optional_id,
  with_optional_version,
  with_id,
  DeepPartial,
} from "./utils";

type ProjectData = {
  userId?: string;
  name: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
  isActive?: boolean;
};

type ProjectCreate =
  ProjectData &
  with_optional_id &
  with_optional_version;

type ProjectType =
  ProjectData &
  with_id &
  with_optional_version;

type ExtendedProjectType = {
  projects?: ProjectType[];
  pagination?: {
    count: number;
    pageCount: number;
  };
};

type ProjectUpdate = DeepPartial<ProjectType>;

type ProjectFilter = {
  userId?: string;
  name?: string;
  text?: string;
  page?: number;
  per_page?: number;
  isActive?: boolean;
  sort?: {
    element: string;
    sortOrder: string | number;
  };
};

export { ProjectFilter, ProjectUpdate, ExtendedProjectType, ProjectType, ProjectCreate }
