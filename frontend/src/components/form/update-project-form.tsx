'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import Textarea from '@/components/ui/textarea';
import Icons from '@/components/icons';
import { updateProject } from '@/app/_actions/project';
import { useLocale } from '@/components/providers/locale-provider';

import Checkbox from '../ui/checkbox';

type Inputs = z.infer<typeof ValidatorSchemas.projectUpdateSchema>;
type UpdateProjectFormProps = {
  project?: ProjectTypes.ProjectUpdate;
}
const UpdateProjectForm = ({ project }: UpdateProjectFormProps) => {
  const { t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // react-hook-form
  const form = useForm<Inputs>({
    resolver: zodResolver(ValidatorSchemas.projectUpdateSchema),
    defaultValues: {
      description: project && project.description ? project.description : '',
      isActive: project && project.isActive ? project.isActive : false
    }
  });

  const closeModal = () => {
    const params = new URLSearchParams(searchParams?.toString());
    params.delete('edit');
    const nextQuery = params.toString();
    router.push(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  };

  const onSubmit = (data: Inputs) => {
    startTransition(async () => {
      try {
        if (project && project.name) {
          await updateProject({ name: project.name, ...data } as ProjectTypes.ProjectUpdate);

          toast.success(t('toast.projectUpdated'));
          closeModal();
          form.reset();
        }
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
          id="project-update-form"
          onSubmit={(...args) => void form.handleSubmit(onSubmit)(...args)}
        >
          <DialogContent className="max-h-[calc(100vh-2rem)] max-w-2xl overflow-hidden p-0">
            <div className="flex max-h-[calc(100vh-2rem)] flex-col">
              <DialogHeader className="border-b bg-muted/20 px-6 py-5">
                <DialogTitle className="flex items-center gap-3 text-xl">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Icons.product className="h-4 w-4" />
                  </span>
                  {t('form.project.updateTitle')} {project?.name}
                </DialogTitle>
                <DialogDescription>{t('form.project.updateModalDescription')}</DialogDescription>
              </DialogHeader>
              <div className="grid w-full gap-5 overflow-y-auto px-6 py-5">
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
              </div>
              <DialogFooter className="border-t bg-background px-6 py-4">
                <Button type="button" variant="outline" disabled={isPending} onClick={closeModal}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" form="project-update-form" disabled={isPending}>
                  {isPending && (
                    <Icons.spinner
                      className="mr-2 h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                  )}
                  {t('form.project.updateAction')}
                  <span className="sr-only">{t('form.project.updateAction')}</span>
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </form>
      </Form>
    </Dialog>
  );
};

export default UpdateProjectForm;
