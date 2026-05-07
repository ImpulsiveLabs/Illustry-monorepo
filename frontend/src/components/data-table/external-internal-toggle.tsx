'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

type ExternalInternalToggleProps = {
  mode: 'owned' | 'external';
}

const ExternalInternalToggle = ({ mode }: ExternalInternalToggleProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const nextMode = mode === 'external' ? 'owned' : 'external';

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-8 whitespace-nowrap"
      onClick={() => {
        const nextParams = new URLSearchParams(searchParams?.toString());
        nextParams.set('scope', nextMode);
        nextParams.set('page', '1');
        router.push(`${pathname}?${nextParams.toString()}`, { scroll: false });
      }}
    >
      {mode === 'external' ? 'External' : 'Internal'}
    </Button>
  );
};

export default ExternalInternalToggle;
