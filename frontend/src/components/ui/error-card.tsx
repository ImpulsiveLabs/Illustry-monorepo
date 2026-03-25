'use client';

import Link from 'next/link';
import React from 'react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { useLocale } from '@/components/providers/locale-provider';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import Icons from '@/components/icons';

type ErrorCardProps = {
  icon?: keyof typeof Icons
  title: string
  description: string
  retryLink?: string
  retryLinkText?: string
} & React.ComponentPropsWithoutRef<typeof Card>;

const ErrorCard = ({
  icon,
  title,
  description,
  retryLink,
  retryLinkText,
  className,
  ...props
}: ErrorCardProps) => {
  const { t } = useLocale();
  const Icon = Icons[icon ?? 'warning'];
  const resolvedRetryLinkText = retryLinkText ?? t('error.goBack');

  return (
    <Card className={cn('grid place-items-center', className)} {...props}>
      <CardHeader>
        <div className="grid h-20 w-20 place-items-center rounded-full bg-muted">
          <Icon data-testid = 'img' className="h-10 w-10" aria-hidden="true" />
        </div>
      </CardHeader>
      <CardContent className="flex min-h-[176px] flex-col items-center justify-center space-y-4 text-center">
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardContent>
      {retryLink ? (
        <CardFooter>
          <Link href={retryLink}>
            <div
              className={cn(
                buttonVariants({
                  variant: 'ghost'
                })
              )}
            >
              {resolvedRetryLinkText}
              <span className="sr-only">{resolvedRetryLinkText}</span>
            </div>
          </Link>
        </CardFooter>
      ) : null}
    </Card>
  );
};

export default ErrorCard;
