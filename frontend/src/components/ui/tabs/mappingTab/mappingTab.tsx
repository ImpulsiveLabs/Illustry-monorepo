/* eslint-disable @typescript-eslint/no-explicit-any */
import { UseFormReturn } from 'react-hook-form';
import { useState } from 'react';
import { FileTypes } from '@illustry/types';
import { Inputs } from '@/components/form/types';
import Icons from '@/components/icons';
import { Button } from '../../button';
import { TabsContent } from '../../tabs';
import ExcelOrCsvMappingTab from './excelOrCsvMappingTab';
import JSONMappingTab from './jsonMappingTab';
import {
  FormField, FormItem, FormControl, FormMessage
} from '../../form';
import Checkbox from '../../checkbox';
import XMLMappingTab from './xmlMappingTab';

type MappingTabProps = {
  selectedFileType: string;
  isPending: boolean;
  form: UseFormReturn<Inputs>;
  router: any;
}

const MappingTab = ({
  selectedFileType,
  isPending,
  form,
  router
}: MappingTabProps) => {
  const [fileDetails, setFileDetails] = useState<boolean>(false);
  const handleFullDetails = (value: boolean) => {
    if (value !== fileDetails) {
      setFileDetails(value);
    }
  };
  const renderMapping = (fType: string, fDetails: boolean) => {
    if (fType) {
      switch (fType) {
        case FileTypes.FileType.JSON:
          return (
            <>
              <JSONMappingTab
                form={form}
                fileDetails={fDetails}
                router={router}
              />
              <Button className="w-fit mt-[2%]" disabled={isPending}>
                {isPending && (
                  <Icons.spinner
                    className="mr-2 h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                )}
                Add Visualizations
                <span className="sr-only">Add Visualizations</span>
              </Button>
            </>
          );
        case FileTypes.FileType.XML:
          return (
            <>
              <XMLMappingTab
                form={form}
                fileDetails={fDetails}
                router={router}
              />
              <Button className="w-fit mt-[2%]" disabled={isPending}>
                {isPending && (
                  <Icons.spinner
                    className="mr-2 h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                )}
                Add Visualizations
                <span className="sr-only">Add Visualizations</span>
              </Button>
            </>
          );
        case FileTypes.FileType.EXCEL:
        case FileTypes.FileType.CSV:
          return (
            <>
              <ExcelOrCsvMappingTab
                form={form}
                router={router}
                fileDetails={fDetails}
                selectedFileType={fType}
              />
              <Button className="w-fit mt-[2%]" disabled={isPending}>
                {isPending && (
                  <Icons.spinner
                    className="mr-2 h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                )}
                Add Visualizations
                <span className="sr-only">Add Visualizations</span>
              </Button>
            </>
          );
        default:
          return null;
      }
    }
    return null;
  };
  return (
    <TabsContent className="w-50%" value="mapping">
      <div className="col-span-2">
        <FormField
          control={form.control}
          name="fullDetails"
          render={({ field }) => (
            <>
              <FormItem>
                <FormControl>
                  <div className=" flex flex-row items-center gap-2">
                    <p className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Does your file include all the details?
                    </p>
                    <Checkbox
                      className="ml-[3%] mt-[0.5%]"
                      defaultChecked={fileDetails}
                      onCheckedChange={(isChecked) => {
                        handleFullDetails(isChecked as boolean);
                        field.onChange(isChecked);
                      }}
                    />
                  </div>
                </FormControl>
              </FormItem>
              <FormMessage />
            </>
          )}
        />
      </div>
      {renderMapping(selectedFileType, fileDetails)}
    </TabsContent>
  );
};

export default MappingTab;
