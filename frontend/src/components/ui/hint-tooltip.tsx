'use client';

import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

type HintTooltipProps = {
  text: string;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
};

const HintTooltip = ({
  text,
  children,
  side = 'top'
}: HintTooltipProps) => (
  <TooltipProvider delayDuration={120}>
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{children}</span>
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-[220px] text-[11px]">
        {text}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export default HintTooltip;
