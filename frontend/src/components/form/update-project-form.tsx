'use client';

import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';
import { ProjectTypes, ValidatorSchemas } from '@illustry/types';
import { useTransition } from 'react';
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
import { updateProject } from '@/app/_actions/project';

import Checkbox from '../ui/checkbox';

type Inputs = z.infer<typeof ValidatorSchemas.projectUpdateSchema>;
type UpdateProjectFormProps = {
  project?: ProjectTypes.ProjectUpdate;
}
const UpdateProjectForm = ({ project }: UpdateProjectFormProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // react-hook-form
  const form = useForm<Inputs>({
    resolver: zodResolver(ValidatorSchemas.projectUpdateSchema),
    defaultValues: {
      description: project && project.description ? project.description : '',
      isActive: project && project.isActive ? project.isActive : false
    }
  });

  const onSubmit = (data: Inputs) => {
    startTransition(async () => {
      try {
        if (project && project.name) {
          await updateProject({ name: project.name, ...data } as ProjectTypes.ProjectUpdate);

          toast.success('Project updated successfully.');
          router.push('/projects');
          form.reset();
        }
      } catch (err) {
        catchError(err);
      }
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Update Project {project?.name}</h2>
      <Form {...form}>
        <form
          className="grid w-full max-w-xl gap-5"
          // eslint-disable-next-line no-void
          onSubmit={(...args) => void form.handleSubmit(onSubmit)(...args)}
        >
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Type project description here."
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
                <FormLabel>Make this project active</FormLabel>
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
            Update Project
            <span className="sr-only">Update Project</span>
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default UpdateProjectForm;
