import {
  AlignmentType,
  Document,
  ImageRun,
  Packer,
  PageBreak,
  Paragraph
} from 'docx';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import PptxGenJS from 'pptxgenjs';
import JSZip from 'jszip';
import { Builder, Parser } from 'xml2js';

type DocumentPlacement = 'top-left' | 'top-center' | 'top-right'
| 'middle-left' | 'middle-center' | 'middle-right'
| 'bottom-left' | 'bottom-center' | 'bottom-right';

type DocumentExportOptions = {
  page?: number;
  width?: number;
  height?: number;
  placement?: DocumentPlacement | string;
  templateFile?: DocumentTemplateFile;
  templateFiles?: Partial<Record<'excel' | 'pdf' | 'word' | 'ppt', DocumentTemplateFile>>;
};

type DocumentTemplateFile = {
  buffer: Buffer;
  originalname?: string;
  mimetype?: string;
};

type DocumentExportInput = {
  title: string;
  image: Buffer;
  options?: DocumentExportOptions;
};

type ExportedDocument = {
  buffer: Buffer;
  filename: string;
  mimeType: string;
};

const toZipBytes = (buffer: Buffer) => new Uint8Array(buffer);

const PDF_MIME = 'application/pdf';
const WORD_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const PPT_MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
const DEFAULT_PAGE = 1;
const DEFAULT_WIDTH = 960;
const DEFAULT_HEIGHT = 540;
const MIN_SIZE = 120;
const MAX_SIZE = 2400;
const PDF_PAGE_WIDTH = 612;
const PDF_PAGE_HEIGHT = 792;
const PDF_MARGIN = 36;
const WORD_PAGE_WIDTH = 816;
const WORD_PAGE_HEIGHT = 1056;
const WORD_VERTICAL_MARGIN = 96;
const PPT_SLIDE_WIDTH_EMU = 12192000;
const PPT_SLIDE_HEIGHT_EMU = 6858000;
const EMU_PER_INCH = 914400;

const sanitizeFilename = (value: string) => value
  .trim()
  .replace(/[/\\?%*:|"<>]/g, '-')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '')
  || 'illustry-export';

const hasExtension = (file: DocumentExportOptions['templateFile'], extension: string) => (
  typeof file?.originalname === 'string' && file.originalname.toLowerCase().endsWith(extension)
);

const normalizeNumber = (value: unknown, fallback: number, min: number, max: number) => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, Math.round(numberValue)));
};

const normalizePlacement = (value: unknown): DocumentPlacement => {
  const placements = new Set<DocumentPlacement>([
    'top-left',
    'top-center',
    'top-right',
    'middle-left',
    'middle-center',
    'middle-right',
    'bottom-left',
    'bottom-center',
    'bottom-right'
  ]);
  return typeof value === 'string' && placements.has(value as DocumentPlacement)
    ? value as DocumentPlacement
    : 'middle-center';
};

const normalizeOptions = (options?: DocumentExportOptions) => ({
  page: normalizeNumber(options?.page, DEFAULT_PAGE, 1, 200),
  width: normalizeNumber(options?.width, DEFAULT_WIDTH, MIN_SIZE, MAX_SIZE),
  height: normalizeNumber(options?.height, DEFAULT_HEIGHT, MIN_SIZE, MAX_SIZE),
  placement: normalizePlacement(options?.placement),
  templateFile: options?.templateFile
});

const scaleToBounds = ({
  width,
  height,
  maxWidth,
  maxHeight
}: {
  width: number;
  height: number;
  maxWidth: number;
  maxHeight: number;
}) => {
  const scale = Math.min(1, maxWidth / width, maxHeight / height);
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale)
  };
};

const getHorizontal = (placement: DocumentPlacement) => {
  if (placement.endsWith('left')) {
    return 'left';
  }
  if (placement.endsWith('right')) {
    return 'right';
  }
  return 'center';
};

const getVertical = (placement: DocumentPlacement) => {
  if (placement.startsWith('top')) {
    return 'top';
  }
  if (placement.startsWith('bottom')) {
    return 'bottom';
  }
  return 'middle';
};

const getBaseFilename = (title: string, extension: string, templateFile?: DocumentExportOptions['templateFile']) => {
  const original = templateFile?.originalname?.replace(/\.[^.]+$/, '');
  return `${sanitizeFilename(original || title)}.${extension}`;
};

const pdfPixelsToPoints = (value: number) => value * 0.75;

const createPdfExport = async ({ title, image, options }: DocumentExportInput): Promise<ExportedDocument> => {
  const normalized = normalizeOptions(options);
  const pdfDocument = normalized.templateFile?.buffer.length && hasExtension(normalized.templateFile, '.pdf')
    ? await PDFDocument.load(normalized.templateFile.buffer)
    : await PDFDocument.create();
  const font = await pdfDocument.embedFont(StandardFonts.Helvetica);

  while (pdfDocument.getPageCount() < normalized.page) {
    pdfDocument.addPage([PDF_PAGE_WIDTH, PDF_PAGE_HEIGHT]).drawText('Illustry export spacer page', {
      x: PDF_MARGIN,
      y: PDF_PAGE_HEIGHT - PDF_MARGIN,
      size: 8,
      font,
      color: rgb(0.8, 0.82, 0.86)
    });
  }

  const page = pdfDocument.getPage(normalized.page - 1);
  const { width: pageWidth, height: pageHeight } = page.getSize();
  const embeddedImage = await pdfDocument.embedPng(image);
  const requestedWidth = pdfPixelsToPoints(normalized.width);
  const requestedHeight = pdfPixelsToPoints(normalized.height);
  const size = scaleToBounds({
    width: requestedWidth,
    height: requestedHeight,
    maxWidth: pageWidth - PDF_MARGIN * 2,
    maxHeight: pageHeight - PDF_MARGIN * 2
  });
  const horizontal = getHorizontal(normalized.placement);
  const vertical = getVertical(normalized.placement);
  const x = horizontal === 'left'
    ? PDF_MARGIN
    : horizontal === 'right'
      ? pageWidth - PDF_MARGIN - size.width
      : (pageWidth - size.width) / 2;
  const y = vertical === 'top'
    ? pageHeight - PDF_MARGIN - size.height
    : vertical === 'bottom'
      ? PDF_MARGIN
      : (pageHeight - size.height) / 2;

  page.drawImage(embeddedImage, {
    x,
    y,
    width: size.width,
    height: size.height
  });

  return {
    buffer: Buffer.from(await pdfDocument.save()),
    filename: getBaseFilename(title, 'pdf', normalized.templateFile),
    mimeType: PDF_MIME
  };
};

const wordAlignmentByPlacement: Record<
'left' | 'center' | 'right',
typeof AlignmentType.LEFT | typeof AlignmentType.CENTER | typeof AlignmentType.RIGHT
> = {
  left: AlignmentType.LEFT,
  center: AlignmentType.CENTER,
  right: AlignmentType.RIGHT
};

const pxToTwip = (value: number) => Math.round((value / 96) * 1440);
const pxToEmu = (value: number) => Math.round((value / 96) * EMU_PER_INCH);
const emuToInch = (value: number) => Number((value / EMU_PER_INCH).toFixed(4));

const createNewWordExport = async (
  title: string,
  image: Buffer,
  normalized: ReturnType<typeof normalizeOptions>
): Promise<ExportedDocument> => {
  const size = scaleToBounds({
    width: normalized.width,
    height: normalized.height,
    maxWidth: WORD_PAGE_WIDTH - 144,
    maxHeight: WORD_PAGE_HEIGHT - WORD_VERTICAL_MARGIN * 2
  });
  const vertical = getVertical(normalized.placement);
  const topSpace = vertical === 'top'
    ? 0
    : vertical === 'bottom'
      ? WORD_PAGE_HEIGHT - WORD_VERTICAL_MARGIN * 2 - size.height
      : (WORD_PAGE_HEIGHT - WORD_VERTICAL_MARGIN * 2 - size.height) / 2;
  const children: Paragraph[] = [];

  for (let index = 1; index < normalized.page; index += 1) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
  }

  children.push(new Paragraph({
    alignment: wordAlignmentByPlacement[getHorizontal(normalized.placement)],
    spacing: { before: Math.max(0, pxToTwip(topSpace)) },
    children: [
      new ImageRun({
        data: image,
        transformation: {
          width: size.width,
          height: size.height
        },
        type: 'png'
      })
    ]
  }));

  const document = new Document({
    sections: [{ children }]
  });

  return {
    buffer: await Packer.toBuffer(document),
    filename: `${sanitizeFilename(title)}.docx`,
    mimeType: WORD_MIME
  };
};

const ensureDefaultContentType = (
  defaults: Array<{ $: { Extension: string; ContentType: string } }>,
  extension: string,
  contentType: string
) => {
  if (!defaults.some((item) => item.$.Extension === extension)) {
    defaults.push({ $: { Extension: extension, ContentType: contentType } });
  }
};

const getNextRelationshipId = (relationships: Array<{ $: { Id?: string } }>) => {
  const maxRelationshipId = relationships.reduce((maxId, relationship) => {
    const id = Number(String(relationship.$.Id || '').replace(/^rId/, ''));
    return Number.isFinite(id) ? Math.max(maxId, id) : maxId;
  }, 0);
  return `rId${maxRelationshipId + 1}`;
};

const createWordDrawingXml = (relationshipId: string, width: number, height: number) => {
  const cx = pxToEmu(width);
  const cy = pxToEmu(height);
  return `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${Date.now()}" name="Illustry visualization"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="0" name="illustry.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${relationshipId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
};

const updateWordTemplate = async (
  title: string,
  image: Buffer,
  normalized: ReturnType<typeof normalizeOptions>
): Promise<ExportedDocument> => {
  if (!normalized.templateFile?.buffer.length || !hasExtension(normalized.templateFile, '.docx')) {
    return createNewWordExport(title, image, normalized);
  }
  const zip = await JSZip.loadAsync(toZipBytes(normalized.templateFile.buffer));
  const documentPath = 'word/document.xml';
  const relsPath = 'word/_rels/document.xml.rels';
  const contentTypesPath = '[Content_Types].xml';
  const documentXml = await zip.file(documentPath)?.async('string');
  const relsXml = await zip.file(relsPath)?.async('string');
  const contentTypesXml = await zip.file(contentTypesPath)?.async('string');
  if (!documentXml || !relsXml || !contentTypesXml) {
    return createNewWordExport(title, image, normalized);
  }

  const parser = new Parser();
  const builder = new Builder({ headless: false, renderOpts: { pretty: false } });
  const rels = await parser.parseStringPromise(relsXml);
  const relationships = (rels.Relationships.Relationship || []) as Array<{
    $: { Id: string; Type: string; Target: string };
  }>;
  const relationshipId = getNextRelationshipId(relationships);
  const mediaName = `image${relationships.length + 1}.png`;
  relationships.push({
    $: {
      Id: relationshipId,
      Type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image',
      Target: `media/${mediaName}`
    }
  });
  rels.Relationships.Relationship = relationships;

  const contentTypes = await parser.parseStringPromise(contentTypesXml);
  const overrides = (contentTypes.Types.Override || []) as Array<{ $: { PartName: string; ContentType: string } }>;
  const defaults = (contentTypes.Types.Default || []) as Array<{ $: { Extension: string; ContentType: string } }>;
  ensureDefaultContentType(defaults, 'png', 'image/png');
  contentTypes.Types.Default = defaults;
  contentTypes.Types.Override = overrides;

  const pageBreaks = Array.from({ length: Math.max(0, normalized.page - 1) })
    .map(() => '<w:p><w:r><w:br w:type="page"/></w:r></w:p>')
    .join('');
  const drawing = pageBreaks + createWordDrawingXml(relationshipId, normalized.width, normalized.height);
  const updatedDocumentXml = documentXml.includes('<w:sectPr')
    ? documentXml.replace(/<w:sectPr[\s\S]*?<\/w:sectPr>/, `${drawing}$&`)
    : documentXml.replace('</w:body>', `${drawing}</w:body>`);

  zip.file(documentPath, updatedDocumentXml);
  zip.file(relsPath, builder.buildObject(rels));
  zip.file(contentTypesPath, builder.buildObject(contentTypes));
  zip.file(`word/media/${mediaName}`, toZipBytes(image));

  return {
    buffer: await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } }),
    filename: getBaseFilename(title, 'docx', normalized.templateFile),
    mimeType: WORD_MIME
  };
};

const createWordExport = async ({ title, image, options }: DocumentExportInput) => (
  updateWordTemplate(title, image, normalizeOptions(options))
);

const getPptSlidePaths = (zip: JSZip) => Object.keys(zip.files)
  .filter((file) => /^ppt\/slides\/slide\d+\.xml$/.test(file))
  .sort((a, b) => Number(a.match(/slide(\d+)\.xml$/)?.[1] || 0) - Number(b.match(/slide(\d+)\.xml$/)?.[1] || 0));

const createPptPictureXml = (relationshipId: string, id: number, x: number, y: number, cx: number, cy: number) => `<p:pic><p:nvPicPr><p:cNvPr id="${id}" name="Illustry visualization"/><p:cNvPicPr/><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="${relationshipId}"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`;

const getPptPlacement = (normalized: ReturnType<typeof normalizeOptions>) => {
  const size = scaleToBounds({
    width: pxToEmu(normalized.width),
    height: pxToEmu(normalized.height),
    maxWidth: PPT_SLIDE_WIDTH_EMU,
    maxHeight: PPT_SLIDE_HEIGHT_EMU
  });
  const horizontal = getHorizontal(normalized.placement);
  const vertical = getVertical(normalized.placement);
  return {
    x: horizontal === 'left'
      ? 0
      : horizontal === 'right'
        ? PPT_SLIDE_WIDTH_EMU - size.width
        : Math.round((PPT_SLIDE_WIDTH_EMU - size.width) / 2),
    y: vertical === 'top'
      ? 0
      : vertical === 'bottom'
        ? PPT_SLIDE_HEIGHT_EMU - size.height
        : Math.round((PPT_SLIDE_HEIGHT_EMU - size.height) / 2),
    cx: size.width,
    cy: size.height
  };
};

const updatePptTemplate = async (
  title: string,
  image: Buffer,
  normalized: ReturnType<typeof normalizeOptions>
): Promise<ExportedDocument | undefined> => {
  if (!normalized.templateFile?.buffer.length || !hasExtension(normalized.templateFile, '.pptx')) {
    return undefined;
  }

  const zip = await JSZip.loadAsync(toZipBytes(normalized.templateFile.buffer));
  const slidePaths = getPptSlidePaths(zip);
  const slidePath = slidePaths[Math.min(normalized.page - 1, slidePaths.length - 1)];
  if (!slidePath) {
    return undefined;
  }

  const slideNumber = Number(slidePath.match(/slide(\d+)\.xml$/)?.[1] || normalized.page);
  const relsPath = `ppt/slides/_rels/slide${slideNumber}.xml.rels`;
  const contentTypesPath = '[Content_Types].xml';
  const slideXml = await zip.file(slidePath)?.async('string');
  const relsXml = await zip.file(relsPath)?.async('string');
  const contentTypesXml = await zip.file(contentTypesPath)?.async('string');
  if (!slideXml || !relsXml || !contentTypesXml) {
    return undefined;
  }

  const parser = new Parser();
  const builder = new Builder({ headless: false, renderOpts: { pretty: false } });
  const rels = await parser.parseStringPromise(relsXml);
  const relationships = (rels.Relationships.Relationship || []) as Array<{
    $: { Id: string; Type: string; Target: string };
  }>;
  const relationshipId = getNextRelationshipId(relationships);
  const mediaName = `illustry-${Date.now()}.png`;
  relationships.push({
    $: {
      Id: relationshipId,
      Type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image',
      Target: `../media/${mediaName}`
    }
  });
  rels.Relationships.Relationship = relationships;

  const contentTypes = await parser.parseStringPromise(contentTypesXml);
  const overrides = (contentTypes.Types.Override || []) as Array<{ $: { PartName: string; ContentType: string } }>;
  const defaults = (contentTypes.Types.Default || []) as Array<{ $: { Extension: string; ContentType: string } }>;
  ensureDefaultContentType(defaults, 'png', 'image/png');
  contentTypes.Types.Default = defaults;
  contentTypes.Types.Override = overrides;

  const placement = getPptPlacement(normalized);
  const pictureXml = createPptPictureXml(
    relationshipId,
    relationships.length + 100,
    placement.x,
    placement.y,
    placement.cx,
    placement.cy
  );
  const updatedSlideXml = slideXml.replace('</p:spTree>', `${pictureXml}</p:spTree>`);

  zip.file(slidePath, updatedSlideXml);
  zip.file(relsPath, builder.buildObject(rels));
  zip.file(contentTypesPath, builder.buildObject(contentTypes));
  zip.file(`ppt/media/${mediaName}`, toZipBytes(image));

  return {
    buffer: await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } }),
    filename: getBaseFilename(title, 'pptx', normalized.templateFile),
    mimeType: PPT_MIME
  };
};

const createNewPptExport = async (title: string, image: Buffer, normalized: ReturnType<typeof normalizeOptions>) => {
  const pptx = new PptxGenJS();
  const placement = getPptPlacement(normalized);
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'Illustry';
  pptx.company = 'Illustry';
  pptx.subject = title;
  pptx.title = title;
  pptx.revision = '1';

  for (let index = 1; index <= normalized.page; index += 1) {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };
    if (index === normalized.page) {
      slide.addImage({
        data: `data:image/png;base64,${image.toString('base64')}`,
        x: emuToInch(placement.x),
        y: emuToInch(placement.y),
        w: emuToInch(placement.cx),
        h: emuToInch(placement.cy),
        altText: title
      });
    }
  }

  const output = await pptx.write({ outputType: 'nodebuffer', compression: true });
  const buffer = Buffer.isBuffer(output)
    ? output
    : Buffer.from(output as Uint8Array);

  return {
    buffer,
    filename: `${sanitizeFilename(title)}.pptx`,
    mimeType: PPT_MIME
  };
};

const createPptExport = async ({ title, image, options }: DocumentExportInput) => {
  const normalized = normalizeOptions(options);
  return await updatePptTemplate(title, image, normalized)
    || createNewPptExport(title, image, normalized);
};

const getTemplateFileKind = (file?: DocumentExportOptions['templateFile']) => {
  if (!file?.buffer.length) {
    return undefined;
  }
  if (hasExtension(file, '.xlsx')) {
    return 'excel';
  }
  if (hasExtension(file, '.pdf')) {
    return 'pdf';
  }
  if (hasExtension(file, '.docx')) {
    return 'word';
  }
  if (hasExtension(file, '.pptx')) {
    return 'ppt';
  }
  return undefined;
};

export {
  PDF_MIME,
  PPT_MIME,
  WORD_MIME,
  createPdfExport,
  createPptExport,
  createWordExport,
  getTemplateFileKind
};
export type {
  DocumentExportOptions,
  DocumentTemplateFile,
  DocumentPlacement,
  ExportedDocument
};
