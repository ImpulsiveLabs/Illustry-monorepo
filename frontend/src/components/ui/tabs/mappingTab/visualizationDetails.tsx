import { UseFormReturn } from 'react-hook-form';
import { Inputs } from '@/components/form/types';
import { useLocale } from '@/components/providers/locale-provider';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from '../../form';
import Input from '../../input';
import Textarea from '../../textarea';

type VisualizationDetailsProp = {
  form: UseFormReturn<Inputs>;
}

const VisualizationDetails = ({
  form
}: VisualizationDetailsProp) => {
  const { t } = useLocale();
  return (
  <>
    <div className="col-span-1">
      <FormField
        control={form.control}
        name="name"
        render={() => (
          <FormItem>
            <FormLabel>{t('common.name')}</FormLabel>
            <FormControl>
              <Input
                placeholder={t('mapping.namePlaceholder')}
                defaultValue={form.getValues('name') || ''}
                onChange={(e) => {
                  setTimeout(() => {
                    const { value } = e.target;
                    form.setValue('name', value);
                  }, 100);
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
    <div className="col-span-1">
      <FormField
        control={form.control}
        name="tags"
        render={() => (
          <FormItem>
            <FormLabel>{t('table.tags')}</FormLabel>
            <FormControl>
              <Input
                placeholder={t('mapping.tagsPlaceholder')}
                defaultValue={form.getValues('tags') || ''}
                onChange={(e) => {
                  setTimeout(() => {
                    const { value } = e.target;
                    form.setValue('tags', value);
                  }, 100);
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
    <div className="col-span-2">
      <FormField
        control={form.control}
        name="description"
        render={() => (
          <FormItem>
            <FormLabel>{t('common.description')}</FormLabel>
            <FormControl>
              <Textarea
                placeholder={t('mapping.descriptionPlaceholder')}
                defaultValue={form.getValues('description') || ''}
                onChange={(e) => {
                  setTimeout(() => {
                    const { value } = e.target;
                    form.setValue('description', value);
                  }, 100);
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>

  </>
  );
};

export default VisualizationDetails;
