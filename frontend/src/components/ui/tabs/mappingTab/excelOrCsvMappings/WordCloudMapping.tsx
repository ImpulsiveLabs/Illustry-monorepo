import { UseFormReturn } from 'react-hook-form';
import { useLocale } from '@/components/providers/locale-provider';
import Input from '@/components/ui/input';
import { Inputs } from '@/components/form/types';

type ExcelOrCsvWordCloudMappingProps = {
  form: UseFormReturn<Inputs>;
}

const ExcelOrCsvWordCloudMapping = ({
  form
}: ExcelOrCsvWordCloudMappingProps) => {
  const { t } = useLocale();
  return (
    <>
      <div className="flex items-center space-x-4">
        <div className="w-20">{t('mapping.names')}:</div>
        <div className="flex-grow">
          <Input
            placeholder={t('mapping.placeholder.columnNumber')}
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
            placeholder={t('mapping.placeholder.columnNumber')}
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
      <div className="flex items-center space-x-4">
        <div className="w-20">{t('mapping.properties')}:</div>
        <div className="flex-grow">
          <Input
            placeholder={t('mapping.placeholder.columnNumber')}
            defaultValue={form.getValues('mapping.properties') || ''}
            onChange={(e) => {
              const { value } = e.target;
              form.setValue('mapping.properties', value);
            }}
          />
        </div>
      </div>
    </>
  );
};

export default ExcelOrCsvWordCloudMapping;
