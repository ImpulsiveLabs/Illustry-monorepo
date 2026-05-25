import React from 'react';
import { cn } from '@/lib/utils';

type AppPageProps = {
  children: React.ReactNode;
  className?: string;
};

type AppPageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
};

const AppPage = ({ children, className }: AppPageProps) => (
  <div className={cn('mx-auto w-full max-w-7xl px-4 pb-12 pt-6 md:px-8 md:pt-8', className)}>
    {children}
  </div>
);

const AppPageHeader = ({
  title,
  description,
  actions,
  className
}: AppPageHeaderProps) => (
  <header className={cn('mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between', className)}>
    <div className="space-y-1.5">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{title}</h1>
      {description && (
        <p className="max-w-2xl text-sm text-muted-foreground md:text-base">{description}</p>
      )}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
  </header>
);

const PageSection = ({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <section
    className={cn(
      'rounded-xl border border-border/60 bg-card text-card-foreground shadow-sm',
      className
    )}
  >
    {children}
  </section>
);

export { AppPage, AppPageHeader, PageSection };
