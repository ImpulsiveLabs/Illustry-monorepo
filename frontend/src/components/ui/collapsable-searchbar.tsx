'use client';

import React from 'react';
import { VisualizationTypes } from '@illustry/types';
import parseFilter from '@/lib/filter';
import { axisWords } from '@/lib/filter/axis';
import { catchError } from '@/lib/utils';
import { calendarWords } from '@/lib/filter/calendar';
import { AllVisualizationsShell } from '@/lib/types/utils';
import { nodeLinksWords } from '@/lib/filter/nodeLink';
import { funnelPieWords } from '@/lib/filter/funnelPie';
import { wordCloudWords } from '@/lib/filter/wordcloud';
import { scatterWords } from '@/lib/filter/scatter';
import { timelineWords } from '@/lib/filter/timeline';
import { hierarchyWords } from '@/lib/filter/hierarchy';
import { useLocale } from '@/components/providers/locale-provider';
import HintTooltip from '@/components/ui/hint-tooltip';
import { Button } from './button';

type CollapsableSearchBarProps<T> = {
  data: T;
  setFilteredData: React.Dispatch<React.SetStateAction<T>>;
  type: VisualizationTypes.VisualizationTypesEnum;
}

const CollapsableSearchBar = <
  T extends AllVisualizationsShell
>({
    data,
    setFilteredData,
    type
  }: CollapsableSearchBarProps<T>) => {
  const { t } = useLocale();
  const [initialData] = React.useState(() => data);
  const [searchValue, setSearchValue] = React.useState('');
  const [isInputClicked, setIsInputClicked] = React.useState(false);

  const getAcceptedWords = () => {
    switch (type) {
      case VisualizationTypes.VisualizationTypesEnum.LINE_CHART:
      case VisualizationTypes.VisualizationTypesEnum.BAR_CHART:
        return ['headers', 'values'];
      case VisualizationTypes.VisualizationTypesEnum.CALENDAR:
        return ['categories', 'dates'];
      case VisualizationTypes.VisualizationTypesEnum.FUNNEL:
      case VisualizationTypes.VisualizationTypesEnum.PIE_CHART:
        return ['values'];
      case VisualizationTypes.VisualizationTypesEnum.TREEMAP:
      case VisualizationTypes.VisualizationTypesEnum.SUNBURST:
        return ['values', 'categories'];
      case VisualizationTypes.VisualizationTypesEnum.FORCE_DIRECTED_GRAPH:
      case VisualizationTypes.VisualizationTypesEnum.HIERARCHICAL_EDGE_BUNDLING:
      case VisualizationTypes.VisualizationTypesEnum.SANKEY:
        return ['values', 'categories', 'targets', 'names'];
      case VisualizationTypes.VisualizationTypesEnum.SCATTER:
        return ['categories', 'xCoord', 'yCoord'];
      case VisualizationTypes.VisualizationTypesEnum.TIMELINE:
        return ['types', 'dates', 'authors'];
      case VisualizationTypes.VisualizationTypesEnum.WORD_CLOUD:
        return ['values'];
      default:
        return [];
    }
  };

  const filterHelpText = [
    'Constructions: >, <, =, >=, <=, !=',
    'Combine expressions with &&',
    `Accepted words: ${getAcceptedWords().join(', ') || '-'}`
  ].join('\n');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    if (!isInputClicked) {
      setIsInputClicked(true);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    let words: string[] = [];
    switch (type) {
      case VisualizationTypes.VisualizationTypesEnum.LINE_CHART:
      case VisualizationTypes.VisualizationTypesEnum.BAR_CHART:
        words = axisWords;
        break;
      case VisualizationTypes.VisualizationTypesEnum.CALENDAR:
        words = calendarWords;
        break;
      case VisualizationTypes.VisualizationTypesEnum.FORCE_DIRECTED_GRAPH:
      case VisualizationTypes.VisualizationTypesEnum.MATRIX:
      case VisualizationTypes.VisualizationTypesEnum.HIERARCHICAL_EDGE_BUNDLING:
      case VisualizationTypes.VisualizationTypesEnum.SANKEY:
        words = nodeLinksWords;
        break;
      case VisualizationTypes.VisualizationTypesEnum.FUNNEL:
      case VisualizationTypes.VisualizationTypesEnum.PIE_CHART:
        words = funnelPieWords;
        break;
      case VisualizationTypes.VisualizationTypesEnum.WORD_CLOUD:
        words = wordCloudWords;
        break;
      case VisualizationTypes.VisualizationTypesEnum.SCATTER:
        words = scatterWords;
        break;
      case VisualizationTypes.VisualizationTypesEnum.TIMELINE:
        words = timelineWords;
        break;
      case VisualizationTypes.VisualizationTypesEnum.TREEMAP:
      case VisualizationTypes.VisualizationTypesEnum.SUNBURST:
        words = hierarchyWords;
        break;
      default:
        words = [];
        break;
    }
    try {
      setFilteredData(parseFilter(searchValue, data, words, type) as T);
    } catch (error) {
      catchError(error);
    }
  };

  const handleRefresh = () => {
    setSearchValue('');
    setIsInputClicked(false);
    setFilteredData(initialData);
  };

  return (
    <form
      action=""
      className="relative mx-auto mt-4 w-full max-w-3xl"
      onSubmit={handleSearch}
    >
      <div className="relative mx-auto flex w-full items-center justify-center gap-2">
        <input
          type="search"
          value={searchValue}
          placeholder={t('table.filterPlaceholder')}
          title={filterHelpText}
          onChange={handleInputChange}
          className="relative z-10 h-11 w-full rounded-full border border-[hsl(var(--illustry-input-border)/0.78)] bg-[hsl(var(--illustry-input-background)/0.78)] px-4 text-sm text-[hsl(var(--illustry-input-foreground))] shadow-sm outline-none backdrop-blur transition-all duration-300 placeholder:text-muted-foreground focus:border-[hsl(var(--ring)/0.6)] focus:ring-4 focus:ring-ring/15"
        />
        <HintTooltip text={filterHelpText} side="bottom">
          <button
            type="button"
            aria-label={filterHelpText}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-input bg-background/70 text-sm font-semibold text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15"
          >
            ?
          </button>
        </HintTooltip>
        {isInputClicked && searchValue.trim() !== '' && (
          <Button
            type="submit"
            variant="default"
            size="default"
            className="ml-2"
          >
            {t('common.filter')}
          </Button>
        )}
        {isInputClicked && (
          <Button
            type="button"
            onClick={handleRefresh}
            variant="default"
            size="default"
            className="ml-2"
          >
            {t('common.refresh')}
          </Button>
        )}
      </div>
    </form>
  );
};

export default CollapsableSearchBar;
