'use client';

import { Dispatch, SetStateAction, useState } from 'react';
import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';
import { PopoverProps } from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';
import { ShowDiagramState } from '@/components/shells/theme-shell';
import siteConfig from '@/config/site';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { Button } from '../button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem
} from '../command';

type VisualizationPresentation = {
  id: string;
  name: string;
}
type PresetSelectorProps = {
  presets: VisualizationPresentation[];
  setShowDiagram: Dispatch<SetStateAction<ShowDiagramState>>;
  setTextareaValue: Dispatch<SetStateAction<string>>;
  setIsSubmitable: Dispatch<SetStateAction<boolean>>;
} & PopoverProps

const PresetSelector = ({
  presets,
  setShowDiagram,
  setTextareaValue,
  setIsSubmitable,
  ...props
}: PresetSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<VisualizationPresentation>();
  const toShowDiagram = (name: string) => {
    switch (name) {
      case 'hierarchical-edge-bundling':
        return {
          name: 'heb',
          value: JSON.stringify(siteConfig.nodeLink, null, 2)
        };
      case 'force-directed-graph':
        return {
          name: 'flg',
          value: JSON.stringify(siteConfig.nodeLink, null, 2)
        };
      case 'sankey':
        return {
          name: 'sankey',
          value: JSON.stringify(siteConfig.nodeLink, null, 2)
        };
      case 'calendar':
        return {
          name: 'calendar',
          value: JSON.stringify({ calendar: siteConfig.calendar }, null, 2)
        };
      case 'word-cloud':
        return {
          name: 'wordCloud',
          value: JSON.stringify({ words: siteConfig.words }, null, 2)
        };
      case 'matrix':
        return {
          name: 'matrix',
          value: JSON.stringify(siteConfig.matrix, null, 2)
        };
      case 'line-chart':
        return {
          name: 'lineChart',
          value: JSON.stringify(siteConfig.axisChart, null, 2)
        };
      case 'bar-chart':
        return {
          name: 'barChart',
          value: JSON.stringify(siteConfig.axisChart, null, 2)
        };
      case 'pie-chart':
        return {
          name: 'pieChart',
          value: JSON.stringify(siteConfig.pieChart, null, 2)
        };
      case 'funnel':
        return {
          name: 'funnel',
          value: JSON.stringify(siteConfig.funnel, null, 2)
        };
      case 'scatter':
        return {
          name: 'scatter',
          value: JSON.stringify(siteConfig.scatter, null, 2)
        };
      case 'treemap':
        return {
          name: 'treeMap',
          value: JSON.stringify(siteConfig.hierarchy, null, 2)
        };
      case 'sunburst':
        return {
          name: 'sunburst',
          value: JSON.stringify(siteConfig.hierarchy, null, 2)
        };
      case 'timeline':
        return { name: 'timeline', value: JSON.stringify(siteConfig.timeline, null, 2) };
      default:
        return null;
    }
  };
  const setShowDiagramHandler = (keyToSet?: keyof ShowDiagramState) => {
    setShowDiagram((prev) => {
      // Create a new object with all keys set to false
      const newState = Object.fromEntries(
        Object.keys(prev).map((key) => [key, false])
      );
      if (keyToSet) {
        // Set the specified key to true
        newState[keyToSet] = true;
      }
      return newState as unknown as ShowDiagramState;
    });
  };
  return (
    <Popover open={open} onOpenChange={setOpen} {...props}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-label="Load a visualization..."
          aria-expanded={open}
          className="flex-1 justify-between md:max-w-[200px] lg:max-w-[300px]"
        >
          {selectedPreset ? selectedPreset.name : 'Select visualization'}
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search presets..." />
          <CommandEmpty>No presets found.</CommandEmpty>
          <CommandGroup heading="Examples">
            {presets.map((preset) => (
              <CommandItem
                key={preset.id}
                onSelect={() => {
                  const presetData = toShowDiagram(preset.name);
                  setSelectedPreset(preset);
                  setOpen(false);
                  setShowDiagramHandler(presetData?.name as keyof ShowDiagramState);
                  setTextareaValue(presetData?.value || '');
                  setIsSubmitable(false);
                }}
              >
                {preset.name}
                <CheckIcon
                  className={cn(
                    'ml-auto h-4 w-4',
                    selectedPreset?.id === preset.id
                      ? 'opacity-100'
                      : 'opacity-0'
                  )}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
export type { VisualizationPresentation };
export default PresetSelector;
