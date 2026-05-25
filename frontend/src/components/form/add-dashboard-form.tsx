'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useTransition } from 'react';
import { DashboardTypes, ValidatorSchemas } from '@illustry/types';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import Input from '@/components/ui/input';
import Textarea from '@/components/ui/textarea';
import Icons from '@/components/icons';
import { createDashboard } from '@/app/_actions/dashboard';
import { useLocale } from '@/components/providers/locale-provider';
import MultiSelect from '../ui/multi-select';

const DASHBOARD_VISUALIZATION_LIMIT = 6;

type AddDashboardFormProps = {
  visualizations: Record<string, string>
}

const AddDashboardForm = ({ visualizations }: AddDashboardFormProps) => {
  const { t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const form = useForm<DashboardTypes.DashboardCreate>({
    resolver: zodResolver(ValidatorSchemas.dashboardUpdateSchema),
    defaultValues: {
      name: '',
      description: '',
      visualizations: {}
    }
  });
  const safeVisualizations = visualizations ?? {};
  const visualizationOptions = Object.keys(safeVisualizations)
    .map((key) => ({
      label: safeVisualizations[key] as string,
      value: safeVisualizations[key] as string
    }));

  const closeModal = () => {
    const params = new URLSearchParams(searchParams?.toString());
    params.delete('modal');
    const nextQuery = params.toString();
    router.push(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  };

  const onSubmit = (data: DashboardTypes.DashboardCreate) => {
    const finalData = { ...data, visualizations: form.getValues('visualizations') };
    startTransition(async () => {
      try {
        const created = await createDashboard({ ...finalData });
        if (!created) {
          throw new Error(t('form.dashboard.createError'));
        }
        form.reset();
        toast.success(t('toast.dashboardAdded'));
        closeModal();
      } catch (err) {
        catchError(err);
      }
    });
  };

  return (
    <Dialog open onOpenChange={(open) => {
      if (!open) {
        closeModal();
      }
    }}>
      <Form {...form}>
        <form
          id="dashboard-create-form"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <DialogContent className="max-h-[calc(100vh-2rem)] max-w-3xl overflow-hidden p-0">
            <div className="flex max-h-[calc(100vh-2rem)] flex-col">
              <DialogHeader className="border-b bg-muted/20 px-6 py-5">
                <DialogTitle className="flex items-center gap-3 text-xl">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Icons.chart className="h-4 w-4" />
                  </span>
                  {t('form.dashboard.addTitle')}
                </DialogTitle>
                <DialogDescription>
                  {t('form.dashboard.modalDescription')}
                </DialogDescription>
              </DialogHeader>
              <div className="grid w-full gap-5 overflow-y-auto px-6 py-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('common.name')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('form.dashboard.namePlaceholder')} {...field} />
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
                          placeholder={t('form.dashboard.descriptionPlaceholder')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="visualizations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.dashboard.visualizations')}</FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={visualizationOptions}
                          onValueChange={(selectedValues) => {
                            const formattedVisualizations = selectedValues
                              .slice(0, DASHBOARD_VISUALIZATION_LIMIT)
                              .reduce(
                                (acc, value) => {
                                  const name = value.match(/^[^(]+/)?.[0];
                                  const type = value.match(/\(([^)]+)\)/)?.[1];
                                  if (name && type) {
                                    acc[`${name}_${type}`] = type;
                                  }
                                  return acc;
                                },
                                {} as Record<string, string>
                              );
                            field.onChange(formattedVisualizations);
                            form.setValue('visualizations', formattedVisualizations);
                          }}
                          placeholder={t('form.dashboard.selectVisualizations')}
                          maxCount={DASHBOARD_VISUALIZATION_LIMIT}
                          selectionLimit={DASHBOARD_VISUALIZATION_LIMIT}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter className="border-t bg-background px-6 py-4">
                <Button type="button" variant="outline" disabled={isPending} onClick={closeModal}>
                  {t('common.cancel')}
                </Button>
                <Button disabled={isPending} type="submit" form="dashboard-create-form">
                  {isPending && (
                    <Icons.spinner
                      className="mr-2 h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                  )}
                  {t('form.dashboard.addAction')}
                  <span className="sr-only">{t('form.dashboard.addAction')}</span>
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </form>
      </Form>
    </Dialog>
  );
};

export default AddDashboardForm;
