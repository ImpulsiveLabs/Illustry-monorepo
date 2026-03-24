'use client';

import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useTransition } from 'react';
import { ProjectTypes, ValidatorSchemas } from '@illustry/types';
import { catchError } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import Input from '@/components/ui/input';
import Textarea from '@/components/ui/textarea';
import Icons from '@/components/icons';
import { createProject } from '@/app/_actions/project';
import { useLocale } from '@/components/providers/locale-provider';
import Checkbox from '../ui/checkbox';

const AddProjectForm = () => {
  const { t } = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<ProjectTypes.ProjectCreate>({
    resolver: zodResolver(ValidatorSchemas.projectCreateSchema),
    defaultValues: {
      name: '',
      description: '',
      isActive: false
    }
  });

  const onSubmit = (data: ProjectTypes.ProjectCreate) => {
    startTransition(async () => {
      try {
        await createProject({ ...data });

        toast.success(t('toast.projectAdded'));
        router.push('/projects');
        form.reset();

      } catch (err) {
        catchError(err);
      }
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{t('form.project.addTitle')}</h2>
      <Form {...form}>
        <form
          className="grid w-full max-w-xl gap-5"
          // eslint-disable-next-line no-void
          onSubmit={(...args) => void form.handleSubmit(onSubmit)(...args)}
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('common.name')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('form.project.namePlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('common.description')}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t('form.project.descriptionPlaceholder')}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
                <FormLabel>{t('form.project.makeActive')}</FormLabel>
              </FormItem>
            )}
          />
          <Button type="submit" className="w-fit" disabled={isPending}>
            {isPending && (
              <Icons.spinner
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            )}
            {t('form.project.addAction')}
            <span className="sr-only">{t('form.project.addAction')}</span>
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default AddProjectForm;
