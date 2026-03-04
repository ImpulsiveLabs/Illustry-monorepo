'use client';

import { useRouter } from 'next/navigation';
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
import Textarea from '@/components/ui/textarea';
import Icons from '@/components/icons';
import { updateDashboard } from '@/app/_actions/dashboard';
import MultiSelect from '../ui/multi-select';

type UpdateDashboardFormProps = {
  dashboard: DashboardTypes.DashboardUpdate | null;
  visualizations: Record<string, string>
}

const UpdateDashboardForm = ({ dashboard, visualizations }: UpdateDashboardFormProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const predefinedOptions: string[] = [];
  const visualizationOptions = Object.keys(visualizations).map((key) => {
    const value = visualizations[key] as string;
    const transformedKey = key.replace(/[()]/g, '_').replace(/_+$/, '');

    if (dashboard && dashboard.visualizations && (dashboard.visualizations as Record<string, string>)[transformedKey]) {
      predefinedOptions.push(value);
    }

    return {
      label: value,
      value
    };
  });
  const form = useForm<DashboardTypes.DashboardUpdate>({
    resolver: zodResolver(ValidatorSchemas.dashboardUpdateSchema),
    defaultValues: {
      description: (dashboard && dashboard.description) || '',
      visualizations: {}
    }
  });

  const onSubmit = (data: DashboardTypes.DashboardUpdate) => {
    const finalData = { ...data, visualizations: form.getValues('visualizations') };
    startTransition(async () => {
      try {
        await updateDashboard({ ...finalData });
        form.reset();
        toast.success('Dashboard updated successfully.');
        router.push('/dashboards');
      } catch (err) {
        catchError(err);
      }
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Update Dashboard {dashboard?.name}</h2>
      <Form {...form}>
        <form
          className="grid w-full max-w-xl gap-5"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Type Dashboard description here."
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
                <FormLabel>Visualizations</FormLabel>
                <FormControl>
                  <MultiSelect
                    options={visualizationOptions}
                    defaultValue={predefinedOptions}
                    onValueChange={(selectedValues) => {
                      const formattedVisualizations = selectedValues.reduce(
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
                    placeholder="Select visualizations"
                    maxCount={5}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button className="w-fit" disabled={isPending} type="submit">
            {isPending && (
              <Icons.spinner
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            )}
            Update Dashboard
            <span className="sr-only">Update Dashboard</span>
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default UpdateDashboardForm;
