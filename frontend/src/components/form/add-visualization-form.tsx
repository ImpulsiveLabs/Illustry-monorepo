/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { VisualizationTypes, FileTypes, ValidatorSchemas } from '@illustry/types';
import { useState, useTransition } from 'react';
import { ExtFile } from '@files-ui/react';
import { catchError } from '@/lib/utils';
import 'dotenv/config';
import { Form } from '@/components/ui/form';
import { createOrUpdateVisualization } from '@/app/_actions/visualization';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import MappingTab from '../ui/tabs/mappingTab/mappingTab';
import TypeTab from '../ui/tabs/typeTab/typeTab';
import { useLocale } from '@/components/providers/locale-provider';
import { CSVType, ExcelType, Inputs } from './types';

const AddVisualizationForm = () => {
  const { t } = useLocale();
  const router = useRouter();
  const [files, setFiles] = useState<ExtFile[]>([]);
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
    defaultValues: {
      fileType: FileTypes.FileType.JSON
    }
  });

  const onSubmit = async (data: Inputs) => {
    startTransition(async () => {
      try {
        if (files.length > 0) {
          if (files.length > 10) {
            throw Error(t('form.visualization.maxFilesError'));
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
          router.push('/visualizations');
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
    <div>
      <h2 className="text-2xl font-bold mb-4">{t('form.visualization.addTitle')}</h2>
      <Form {...form}>
        <form
          className="grid w-full max-w-xl gap-5"
          onSubmit={async (...args) => {
            await form.handleSubmit(onSubmit)(...args);
          }}
        >
          <Tabs defaultValue="type" className="w-[100%]">
            <TabsList>
              <TabsTrigger value="type">{t('common.type')}</TabsTrigger>
              <TabsTrigger value="mapping">{t('form.visualization.mapping')}</TabsTrigger>
            </TabsList>
            <MappingTab
              selectedFileType={selectedFileType}
              isPending={isPending}
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
        </form>
      </Form>
    </div>
  );
};

export default AddVisualizationForm;
