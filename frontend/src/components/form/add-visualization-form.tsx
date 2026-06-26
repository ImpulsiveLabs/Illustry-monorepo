'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { VisualizationTypes, FileTypes, ValidatorSchemas } from '@illustry/types';
import { useState, useTransition } from 'react';
import { ExtFile } from '@files-ui/react';
import { catchError } from '@/lib/utils';
import 'dotenv/config';
import { Form } from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { createOrUpdateVisualization } from '@/app/_actions/visualization';
import Icons from '@/components/icons';
import { validateBrowserFile } from '@/lib/upload-constraints';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import MappingTab from '../ui/tabs/mappingTab/mappingTab';
import TypeTab from '../ui/tabs/typeTab/typeTab';
import { useLocale } from '@/components/providers/locale-provider';
import { CSVType, ExcelType, Inputs } from './types';

const AddVisualizationForm = () => {
  const { t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [files, setFiles] = useState<ExtFile[]>([]);
  const [isOpen, setIsOpen] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [selectedFileType, setSelectedFileType] = useState<string>(
    FileTypes.FileType.JSON
  );

  const updateFiles = (incomingFiles: ExtFile[]) => {
    setFiles(incomingFiles);
  };

  const removeFile = (id: string | number | undefined) => {
    setFiles(files.filter((x) => x.id !== id));
  };

  const form = useForm<Inputs>({
    resolver: zodResolver(ValidatorSchemas.visualizationFileSchema),
    mode: 'onChange',
    defaultValues: {
      fileType: FileTypes.FileType.JSON
    }
  });
  const watchedFullDetails = form.watch('fullDetails');
  const watchedMapping = form.watch('mapping') as Record<string, unknown> | undefined;
  const watchedName = form.watch('name');
  const watchedType = form.watch('type');
  const watchedFileType = form.watch('fileType');
  const hasSelectedFile = files.some((file) => file.file instanceof File);
  const hasMappingValue = watchedMapping
    ? Object.values(watchedMapping).some((value) => String(value ?? '').trim().length > 0)
    : false;
  const mappingRequired = watchedFileType === FileTypes.FileType.CSV
    || watchedFileType === FileTypes.FileType.EXCEL;
  const canCreate = hasSelectedFile
    && (
      Boolean(watchedFullDetails)
      || (Boolean(watchedName) && Boolean(watchedType) && (!mappingRequired || hasMappingValue))
    );

  const closeModal = (options: { refresh?: boolean } = {}) => {
    setIsOpen(false);
    const params = new URLSearchParams(searchParams?.toString());
    params.delete('modal');
    const nextQuery = params.toString();
    startTransition(() => {
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
      if (options.refresh) {
        router.refresh();
      }
    });
  };

  const onSubmit = async (data: Inputs) => {
    startTransition(async () => {
      try {
        if (files.length > 0) {
          if (files.length > 10) {
            throw Error(t('form.visualization.maxFilesError'));
          }
          const invalidFile = files
            .map((f) => (f.file instanceof File ? validateBrowserFile(f.file, 'visualization-source') : 'Invalid file.'))
            .find(Boolean);
          if (invalidFile) {
            throw Error(invalidFile);
          }
          const formData = new FormData();
          const fileDetails: FileTypes.FileDetails = {
            fileType: data.fileType,
            includeHeaders: (data as ExcelType).includeHeaders,
            mapping: (data as ExcelType).mapping,
            sheets: (data as ExcelType).sheets,
            separator: (data as unknown as CSVType).separator
          };
          formData.append('fullDetails', data.fullDetails.toString());
          formData.append('fileDetails', JSON.stringify(fileDetails));
          const visualizationDetails: VisualizationTypes.VisualizationUpdate = {
            name: (data as ExcelType).name as string,
            type: (data as ExcelType).type as unknown as VisualizationTypes.VisualizationTypesEnum,
            description: (data as ExcelType).description,
            tags: (data as ExcelType).tags?.split(',')
          };
          formData.append(
            'visualizationDetails',
            JSON.stringify(visualizationDetails)
          );
          files.forEach((f) => {
            formData.append('file', f.file as File);
          });
          await createOrUpdateVisualization(formData);
          form.reset();
          setFiles([]);
          toast.success(t('toast.visualizationAdded'));
          closeModal({ refresh: true });
        } else {
          toast.error(t('form.visualization.noFilesSelected'));
        }
      } catch (err) {
        catchError(err);
      }
    });
  };

  const handleFileTypeChange = (value: string) => {
    if (value !== selectedFileType) {
      setSelectedFileType(value);
      form.reset({
        fileType: value as any,
        fullDetails: false,
        type: VisualizationTypes.VisualizationTypesEnum.WORD_CLOUD,
        name: '',
        tags: '',
        includeHeaders: false,
        description: '',
        mapping: { names: '', values: '', properties: '' }
      });
      setFiles([]); // Clear the files
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        closeModal();
      }
    }}>
      <Form {...form}>
        <form
          id="visualization-create-form"
          onSubmit={async (...args) => {
            await form.handleSubmit(onSubmit)(...args);
          }}
        >
          <DialogContent className="max-h-[calc(100vh-2rem)] max-w-4xl overflow-hidden p-0">
            <div className="flex max-h-[calc(100vh-2rem)] flex-col">
              <DialogHeader className="border-b bg-muted/20 px-6 py-5">
                <DialogTitle className="flex items-center gap-3 text-xl">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Icons.upload className="h-4 w-4" />
                  </span>
                  {t('form.visualization.addTitle')}
                </DialogTitle>
                <DialogDescription>
                  {t('form.visualization.modalDescription')}
                </DialogDescription>
              </DialogHeader>
              <div className="overflow-y-auto px-6 py-5">
                <Tabs defaultValue="type" className="w-full">
                  <TabsList className="mb-2">
                    <TabsTrigger value="type">{t('common.type')}</TabsTrigger>
                    <TabsTrigger value="mapping">{t('form.visualization.mapping')}</TabsTrigger>
                  </TabsList>
                  <MappingTab
                    selectedFileType={selectedFileType}
                    form={form}
                    router={router}
                  />
                  <TypeTab
                    form={form}
                    files={files}
                    handleFileTypeChange={handleFileTypeChange}
                    selectedFileType={selectedFileType}
                    updateFiles={updateFiles}
                    removeFile={removeFile}
                  />
                </Tabs>
              </div>
              <DialogFooter className="border-t bg-background px-6 py-4">
                <Button type="button" variant="outline" disabled={isPending} onClick={() => closeModal()}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" form="visualization-create-form" disabled={isPending || !canCreate}>
                  {isPending && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                  {t('form.visualization.addAction')}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </form>
      </Form>
    </Dialog>
  );
};

export default AddVisualizationForm;
