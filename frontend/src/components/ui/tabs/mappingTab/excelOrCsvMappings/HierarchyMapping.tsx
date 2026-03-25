import { UseFormReturn } from 'react-hook-form';
import { useLocale } from '@/components/providers/locale-provider';
import Input from '@/components/ui/input';
import { Inputs } from '@/components/form/types';

type ExcelOrCsvHierarchyMappingProps = {
  form: UseFormReturn<Inputs>;
}

const ExcelOrCsvHierarchyMapping = ({
  form
}: ExcelOrCsvHierarchyMappingProps) => {
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
              const { value } = e.target;
              form.setValue('mapping.names', value);
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
              const { value } = e.target;
              form.setValue('mapping.values', value);
            }}
          />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="w-20">{t('mapping.categories')}:</div>
        <div className="flex-grow">
          <Input
            placeholder={t('mapping.placeholder.columnNumber')}
            defaultValue={form.getValues('mapping.categories') || ''}
            onChange={(e) => {
              const { value } = e.target;
              form.setValue('mapping.categories', value);
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
      <div className="flex items-center space-x-4">
        <div className="w-20">{t('mapping.children')}:</div>
        <div className="flex-grow">
          <Input
            placeholder={t('mapping.placeholder.columnNumbers')}
            defaultValue={form.getValues('mapping.children') || ''}
            onChange={(e) => {
              setTimeout(() => {
                const { value } = e.target;
                form.setValue('mapping.children', value);
              }, 100);
            }}
          />
        </div>
      </div>

    </>
  );
};

export default ExcelOrCsvHierarchyMapping;
