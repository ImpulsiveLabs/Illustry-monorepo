import { UseFormReturn } from 'react-hook-form';
import { useLocale } from '@/components/providers/locale-provider';
import Input from '@/components/ui/input';
import { Inputs } from '@/components/form/types';

type ExcelOrCsvPieChartFunnelMappingProps = {
  form: UseFormReturn<Inputs>;
}

const ExcelOrCsvPieChartFunnelMapping = ({
  form
}: ExcelOrCsvPieChartFunnelMappingProps) => {
  const { t } = useLocale();
  return (
    <>
      <div className="flex items-center space-x-4">
        <div className="w-20">{t('mapping.names')}:</div>
        <div className="flex-grow">
          <Input
            placeholder={t('mapping.placeholder.columnNumbers')}
            defaultValue={form.getValues('mapping.names') || ''}
            onChange={(e) => {
              setTimeout(() => {
                const { value } = e.target;
                form.setValue('mapping.names', value);
              }, 100);
            }}
          />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="w-20">{t('mapping.values')}:</div>
        <div className="flex-grow">
          <Input
            placeholder={t('mapping.placeholder.columnNumbers')}
            defaultValue={form.getValues('mapping.values') || ''}
            onChange={(e) => {
              setTimeout(() => {
                const { value } = e.target;
                form.setValue('mapping.values', value);
              }, 100);
            }}
          />
        </div>
      </div>
    </>
  );
};

export default ExcelOrCsvPieChartFunnelMapping;
