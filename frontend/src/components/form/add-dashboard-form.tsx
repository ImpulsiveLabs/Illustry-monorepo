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
import Input from '@/components/ui/input';
import Textarea from '@/components/ui/textarea';
import Icons from '@/components/icons';
import { createDashboard } from '@/app/_actions/dashboard';
import MultiSelect from '../ui/multi-select';

type AddDashboardFormProps = {
  visualizations: Record<string, string>
}

const AddDashboardForm = ({ visualizations }: AddDashboardFormProps) => {
  const router = useRouter();
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

  const onSubmit = (data: DashboardTypes.DashboardCreate) => {
    const finalData = { ...data, visualizations: form.getValues('visualizations') };
    startTransition(async () => {
      try {
        await createDashboard({ ...finalData });
        form.reset();
        toast.success('Dashboard added successfully.');
        router.push('/dashboards');
      } catch (err) {
        catchError(err);
      }
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Add a new Dashboard</h2>
      <Form {...form}>
        <form
          className="grid w-full max-w-xl gap-5"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Type Dashboard name here." {...field} />
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
            Add Dashboard
            <span className="sr-only">Add Dashboard</span>
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default AddDashboardForm;
