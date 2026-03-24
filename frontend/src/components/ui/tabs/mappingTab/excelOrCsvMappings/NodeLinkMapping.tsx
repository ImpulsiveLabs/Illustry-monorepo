import { UseFormReturn } from 'react-hook-form';
import { useLocale } from '@/components/providers/locale-provider';
import Input from '@/components/ui/input';
import { Inputs } from '@/components/form/types';

type ExcelOrCsvNodeLinkMappingProps = {
  form: UseFormReturn<Inputs>;
}
const ExcelOrCsvNodeLinkMapping = ({ form }: ExcelOrCsvNodeLinkMappingProps) => {
  const { t } = useLocale();
  return (
    <>
      <div className="flex items-center space-x-4">
        <div className="w-20">{t('mapping.categories')}:</div>
        <div className="flex-grow">
          <Input
            placeholder={t('mapping.placeholder.columnNumber')}
            defaultValue={form.getValues('mapping.categories') || ''}
            onChange={(e) => {
              setTimeout(() => {
                const { value } = e.target;
                form.setValue('mapping.categories', value);
              }, 100);
            }}
          />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="w-20">{t('mapping.nodes')}:</div>
        <div className="flex-grow">
          <Input
            placeholder={t('mapping.placeholder.columnNumber')}
            defaultValue={form.getValues('mapping.nodes') || ''}
            onChange={(e) => {
              setTimeout(() => {
                const { value } = e.target;
                form.setValue('mapping.nodes', value);
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
      <div className="flex items-center space-x-4">
        <div className="w-20">{t('mapping.sources')}:</div>
        <div className="flex-grow">
          <Input
            placeholder={t('mapping.placeholder.columnNumber')}
            defaultValue={form.getValues('mapping.sources') || ''}
            onChange={(e) => {
              setTimeout(() => {
                const { value } = e.target;
                form.setValue('mapping.sources', value);
              }, 100);
            }}
          />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="w-20">{t('mapping.targets')}:</div>
        <div className="flex-grow">
          <Input
            placeholder={t('mapping.placeholder.columnNumber')}
            defaultValue={form.getValues('mapping.targets') || ''}
            onChange={(e) => {
              setTimeout(() => {
                const { value } = e.target;
                form.setValue('mapping.targets', value);
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
    </>
  );
};

export default ExcelOrCsvNodeLinkMapping;
