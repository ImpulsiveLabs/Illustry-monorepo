'use client';

import { ReactNode, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import type { ThemeTypes } from '@illustry/types';

type ThemeRouteScopeProps = {
  children: ReactNode;
};

const resolvePageIdFromPath = (pathname: string): ThemeTypes.ThemePageId => {
  if (pathname === '/' || pathname === '') {
    return 'home';
  }
  if (pathname.startsWith('/projects/new')) {
    return 'projectCreate';
  }
  if (pathname.startsWith('/projects/') && pathname !== '/projects') {
    return 'projectDetail';
  }
  if (pathname.startsWith('/projects')) {
    return 'projects';
  }
  if (pathname.startsWith('/visualizations/new')) {
    return 'visualizationCreate';
  }
  if (pathname.startsWith('/visualizationhub')) {
    return 'visualizationHub';
  }
  if (pathname.startsWith('/visualizations')) {
    return 'visualizations';
  }
  if (pathname.startsWith('/dashboards/new')) {
    return 'dashboardCreate';
  }
  if (pathname.startsWith('/dashboards/') && pathname !== '/dashboards') {
    return 'dashboardDetail';
  }
  if (pathname.startsWith('/dashboardhub')) {
    return 'dashboardDetail';
  }
  if (pathname.startsWith('/dashboards')) {
    return 'dashboards';
  }
  if (pathname.startsWith('/account/edit')) {
    return 'accountEdit';
  }
  if (pathname.startsWith('/account')) {
    return 'account';
  }
  if (pathname.startsWith('/theme')) {
    return 'themes';
  }
  if (pathname.startsWith('/playground')) {
    return 'playground';
  }
  if (
    pathname.startsWith('/login')
    || pathname.startsWith('/register')
    || pathname.startsWith('/forgot-password')
    || pathname.startsWith('/reset-password')
    || pathname.startsWith('/verify-email')
    || pathname.startsWith('/logout')
  ) {
    return 'auth';
  }
  if (pathname.startsWith('/share')) {
    return 'share';
  }

  return 'notFound';
};

const ThemeRouteScope = ({ children }: ThemeRouteScopeProps) => {
  const pathname = usePathname() || '/';
  const pageId = useMemo(() => resolvePageIdFromPath(pathname), [pathname]);

  return (
    <div
      data-illustry-page={pageId}
      data-illustry-page-path={pathname}
      className="min-h-screen bg-[hsl(var(--illustry-page-background))] text-foreground"
    >
      {children}
    </div>
  );
};

export {
  resolvePageIdFromPath
};
export default ThemeRouteScope;
