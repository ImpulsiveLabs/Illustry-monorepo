/* eslint-disable no-unused-vars */
import { UseFormReturn } from 'react-hook-form';
import { ExtFile } from '@files-ui/react';
import { FileTypes } from '@illustry/types';
import { Inputs } from '@/components/form/types';
import { useLocale } from '@/components/providers/locale-provider';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from '../../form';
import ExcelFileFormatter from './excelFileFormatFormItem';
import JsonFileFormatter from './jsonFileFormatFormItem';
import { TabsContent } from '../../tabs';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../select';
import CSVFileFormatter from './csvFileFormatFormItem';
import XMLFileFormatter from './xmlFileFormatFormItem';

type TypeTabProps = {
  form: UseFormReturn<Inputs>;
  handleFileTypeChange: (value: string) => void;
  selectedFileType: string;
  files: ExtFile[];
  updateFiles: (files: ExtFile[]) => void;
  removeFile: (id: string | number | undefined) => void;
}

const TypeTab = ({
  form,
  handleFileTypeChange,
  selectedFileType,
  files,
  updateFiles,
  removeFile
}: TypeTabProps) => {
  const { t } = useLocale();
  const renderFiles = (fileType: string) => {
    if (fileType) {
      switch (fileType) {
        case FileTypes.FileType.JSON:
          return (
            <JsonFileFormatter
              acceptedFiles={files}
              updateFiles={updateFiles}
              removeFile={removeFile}
              form={form}
            />
          );
        case FileTypes.FileType.EXCEL:
          return (
            <ExcelFileFormatter
              acceptedFiles={files}
              updateFiles={updateFiles}
              removeFile={removeFile}
              form={form}
            />
          );
        case FileTypes.FileType.CSV:
          return (
            <CSVFileFormatter
              acceptedFiles={files}
              updateFiles={updateFiles}
              removeFile={removeFile}
              form={form}
            />
          );
        case FileTypes.FileType.XML:
          return (
            <XMLFileFormatter
              acceptedFiles={files}
              updateFiles={updateFiles}
              removeFile={removeFile}
              form={form}
            />
          );
        default:
          return null;
      }
    }
    return null;
  };
  return (
    <TabsContent className="w-50%" value="type">
      <div className="flex flex-col items-start gap-6 sm:flex-row">
        <FormField
          control={form.control}
          name="fileType"
          render={({ field }) => (
            <FormItem className="w-full mb-[5%]">
              <FormLabel>{t('common.fileType')}</FormLabel>
              <FormControl>
                <Select
                  value={field.value?.toString()}
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleFileTypeChange(value); // Call the handler when file type changes
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('typeTab.selectFileType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {[FileTypes.FileType.JSON, FileTypes.FileType.CSV, FileTypes.FileType.EXCEL, FileTypes.FileType.XML].map(
                        (option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        )
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {renderFiles(selectedFileType)}
    </TabsContent>
  );
};

export default TypeTab;
