/* eslint-disable @typescript-eslint/no-explicit-any */
import { UseFormReturn } from 'react-hook-form';
import { VisualizationTypes } from '@illustry/types';
import { Inputs } from '@/components/form/types';
import { useLocale } from '@/components/providers/locale-provider';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from '../../form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../select';

type VisualizationTypeProp = {
  form: UseFormReturn<Inputs>;
  router: any;
  exclude?: boolean;
}

const VisualizationType = ({
  form,
  router,
  exclude
}: VisualizationTypeProp) => {
  const { t } = useLocale();
  return (
    <>
      <div className="col-span-1">
        <FormField
          control={form.control}
          name="type"
          render={() => (
            <FormItem>
              <FormLabel>{t('common.type')}</FormLabel>
              <FormControl>
                <Select
                  value={form.getValues('type')}
                  onValueChange={(value: VisualizationTypes.VisualizationTypesEnum) => {
                    form.setValue('type', value);
                    router.refresh();
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('common.type')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={VisualizationTypes.VisualizationTypesEnum.WORD_CLOUD}>
                      {t('viz.wordCloud')}
                    </SelectItem>
                    <SelectItem
                      value={VisualizationTypes.VisualizationTypesEnum.FORCE_DIRECTED_GRAPH}
                    >
                      {t('viz.forcedLayoutGraph')}
                    </SelectItem>
                    <SelectItem value={VisualizationTypes.VisualizationTypesEnum.SANKEY}>
                      {t('viz.sankey')}
                    </SelectItem>
                    <SelectItem value={VisualizationTypes.VisualizationTypesEnum.CALENDAR}>
                      {t('viz.calendar')}
                    </SelectItem>
                    <SelectItem
                      value={VisualizationTypes.VisualizationTypesEnum.HIERARCHICAL_EDGE_BUNDLING}
                    >
                      {t('viz.hierarchicalEdgeBundling')}
                    </SelectItem>
                    {!exclude && (
                      <SelectItem value={VisualizationTypes.VisualizationTypesEnum.MATRIX}>
                        {t('viz.matrix')}
                      </SelectItem>
                    )}
                    <SelectItem value={VisualizationTypes.VisualizationTypesEnum.LINE_CHART}>
                      {t('viz.lineChart')}
                    </SelectItem>
                    <SelectItem value={VisualizationTypes.VisualizationTypesEnum.BAR_CHART}>
                      {t('viz.barChart')}
                    </SelectItem>
                    <SelectItem value={VisualizationTypes.VisualizationTypesEnum.PIE_CHART}>
                      {t('viz.pieChart')}
                    </SelectItem>
                    <SelectItem value={VisualizationTypes.VisualizationTypesEnum.SCATTER}>
                      {t('viz.scatter')}
                    </SelectItem>
                    <SelectItem value={VisualizationTypes.VisualizationTypesEnum.TREEMAP}>
                      {t('viz.treemap')}
                    </SelectItem>
                    <SelectItem value={VisualizationTypes.VisualizationTypesEnum.SUNBURST}>
                      {t('viz.sunburst')}
                    </SelectItem>
                    <SelectItem value={VisualizationTypes.VisualizationTypesEnum.FUNNEL}>
                      {t('viz.funnel')}
                    </SelectItem>
                    {!exclude && (
                      <SelectItem value={VisualizationTypes.VisualizationTypesEnum.TIMELINE}>
                        {t('viz.timeline')}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  );
};

export default VisualizationType;
