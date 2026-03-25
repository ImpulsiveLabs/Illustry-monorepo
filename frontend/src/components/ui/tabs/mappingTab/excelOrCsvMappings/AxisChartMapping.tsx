import { UseFormReturn } from 'react-hook-form';
import { useLocale } from '@/components/providers/locale-provider';
import Input from '@/components/ui/input';
import { Inputs } from '@/components/form/types';

type ExcelOrCsvAxisChartMappingProps = {
  form: UseFormReturn<Inputs>;
}

const ExcelOrCsvAxisChartMapping = ({
  form
}: ExcelOrCsvAxisChartMappingProps) => {
  const { t } = useLocale();
  return (
    <>
      <div className="flex items-center space-x-4">
        <div className="w-20">{t('mapping.data')}:</div>
        <div className="flex-grow">
          <Input
            placeholder={t('mapping.placeholder.columnNumbers')}
            defaultValue={form.getValues('mapping.data') || ''}
            onChange={(e) => {
              setTimeout(() => {
                const { value } = e.target;
                form.setValue('mapping.data', value);
              }, 100);
            }}
          />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="w-20">{t('mapping.headers')}:</div>
        <div className="flex-grow">
          <Input
            placeholder={t('mapping.placeholder.columnNumber')}
            defaultValue={form.getValues('mapping.headers') || ''}
            onChange={(e) => {
              const { value } = e.target;
              form.setValue('mapping.headers', value);
            }}
          />
        </div>
      </div>
    </>
  );
};

export default ExcelOrCsvAxisChartMapping;
