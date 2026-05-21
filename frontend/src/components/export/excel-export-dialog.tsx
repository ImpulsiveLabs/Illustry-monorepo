'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';

type ExcelExportValues = {
  sheetName: string;
  widthColumns: number;
  heightRows: number;
};

type ExcelExportDialogProps = {
  open: boolean;
  pending?: boolean;
  title: string;
  description: string;
  defaultSheetName: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ExcelExportValues) => void;
};

const normalizeNumber = (value: FormDataEntryValue | null, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const ExcelExportDialog = ({
  open,
  pending = false,
  title,
  description,
  defaultSheetName,
  onOpenChange,
  onSubmit
}: ExcelExportDialogProps) => {
  const [sheetName, setSheetName] = useState(defaultSheetName);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onSubmit({
      sheetName: sheetName.trim() || defaultSheetName,
      widthColumns: normalizeNumber(formData.get('widthColumns'), 8),
      heightRows: normalizeNumber(formData.get('heightRows'), 12)
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="excel-sheet-name">Sheet name</Label>
              <Input
                id="excel-sheet-name"
                name="sheetName"
                value={sheetName}
                maxLength={31}
                onChange={(event) => setSheetName(event.target.value)}
                placeholder="Sheet1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="excel-width-columns">Width columns</Label>
                <Input
                  id="excel-width-columns"
                  name="widthColumns"
                  type="number"
                  min={2}
                  max={60}
                  defaultValue={8}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="excel-height-rows">Height rows</Label>
                <Input
                  id="excel-height-rows"
                  name="heightRows"
                  type="number"
                  min={2}
                  max={120}
                  defaultValue={12}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Exporting' : 'Export workbook'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExcelExportDialog;
export type { ExcelExportValues };
