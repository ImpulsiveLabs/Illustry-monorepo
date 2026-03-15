/* eslint-disable no-unused-vars */
import * as url from 'url';
import * as fs from 'fs';
import * as path from 'path';
import { TransformerTypes, FileTypes } from '@illustry/types';
import logger from '../config/logger';

const returnResponse = (
  res: FileTypes.Response,
  err: Error | null,
  data: unknown,
  next: (error: string | Error) => void
): void => {
  if (res?.req?.probe) {
    const urlParts = url.parse(res.req.originalUrl || '');
    res.req.probe.stop(`Send response${urlParts.pathname}`);
  }
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  if (!err) {
    res.status(200);
    res.send(data);
  } else {
    res.send({ error: err.message });
    next(err.message);
  }
};

const toStringWithDefault = (value: unknown): string => {
  if (value === undefined || value === null) {
    return '';
  }
  return String(value);
};

const visualizationDetailsExtractor = (
  mapping: {
    [key: string]: string;
  },
  values: (string | number)[]
) => {
  const getValue = (key: string): string | string[] | undefined => {
    const index = +mapping[key];
    const value = values[index];
    return typeof value === 'string' && value.trim() !== '' ? value : undefined;
  };

  return {
    visualizationName: getValue('visualizationName') as string,
    visualizationDescription: getValue('visualizationDescription') as string,
    visualizationTags: getValue('visualizationTags')
  };
};

const visualizationPropertiesExtractor = (
  arr: TransformerTypes.RowType[]
) => {
  let name: string = '';
  let description: string = '';
  let tags: string[] = [];
  const sanitizedArr = arr.map((item) => {
    const newItem = { ...item } as TransformerTypes.FullCalendarDetails;
    if (newItem.visualizationName) {
      name = newItem.visualizationName as string;
      delete newItem.visualizationName;
    }
    if (newItem.visualizationDescription) {
      description = newItem.visualizationDescription as string;
      delete newItem.visualizationDescription;
    }
    if (newItem.visualizationTags) {
      tags = newItem.visualizationTags as string[];
      delete newItem.visualizationTags;
    }
    return newItem;
  });
  return {
    data: sanitizedArr.filter(Boolean),
    name: name || undefined,
    description,
    tags
  };
};

const copyDirectory = async (src: string, dest: string): Promise<void> => {
  try {
    await fs.promises.mkdir(dest, { recursive: true });
    const files = await fs.promises.readdir(src);

    await Promise.all(files.map(async (file) => {
      const srcPath = path.join(src, file);
      const destPath = path.join(dest, file);
      const stats = await fs.promises.stat(srcPath);

      if (stats.isDirectory()) {
        await copyDirectory(srcPath, destPath);
      } else {
        await fs.promises.copyFile(srcPath, destPath);
      }
    }));
  } catch (error) {
    logger.error('Error copying directory:', error);
    throw error;
  }
};

const deleteDirectory = async (directoryPath: string): Promise<void> => {
  try {
    const files = await fs.promises.readdir(directoryPath);
    await Promise.all(files.map(async (file) => {
      const filePath = path.join(directoryPath, file);
      const stats = await fs.promises.stat(filePath);

      if (stats.isDirectory()) {
        await deleteDirectory(filePath);
      } else {
        await fs.promises.unlink(filePath);
      }
    }));
    await fs.promises.rmdir(directoryPath);
  } catch (error) {
    logger.error('Error deleting directory:', error);
    throw error;
  }
};

const removeNullValues = (obj: unknown): unknown | undefined => {
  if (obj === null) {
    return undefined;
  }

  if (Array.isArray(obj)) {
    return obj
      .map(removeNullValues)
      .filter((item) => item !== undefined);
  }

  if (typeof obj === 'object' && obj !== null) {
    return Object.fromEntries(
      Object.entries(obj)
        .map(([key, value]) => [key, removeNullValues(value)])
        .filter(([, value]) => value !== undefined)
    );
  }
  return undefined;
};

export {
  returnResponse,
  toStringWithDefault,
  visualizationDetailsExtractor,
  visualizationPropertiesExtractor,
  copyDirectory,
  deleteDirectory,
  removeNullValues
};
