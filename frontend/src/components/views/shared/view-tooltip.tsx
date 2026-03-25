'use client';

import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { useLocale } from '@/components/providers/locale-provider';

type ViewTooltipProps = {
  text: string;
};

const ViewTooltip = ({ text }: ViewTooltipProps) => {
  const { t } = useLocale();
  return (
    <TooltipProvider delayDuration={120}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={t('tooltip.visualizationInfo')}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-border/70
              bg-background/90 text-muted-foreground shadow-sm transition-colors hover:text-foreground"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-[220px] text-[11px]">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ViewTooltip;
