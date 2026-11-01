export type FormatCategory = 'document' | 'spreadsheet' | 'image' | 'presentation' | 'data' | 'archive';

export interface FileFormat {
  id: string;
  ext: string;
  name: string;
  mime: string;
  category: FormatCategory;
  badge?: string;
  description: string;
}

export const SUPPORTED_FORMATS: Record<string, FileFormat> = {
  // Documents
  pdf: { id: 'pdf', ext: 'pdf', name: 'Portable Document Format', mime: 'application/pdf', category: 'document', badge: 'Standard', description: 'ISO 32000 standard document format.' },
  docx: { id: 'docx', ext: 'docx', name: 'Microsoft Word Document', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', category: 'document', badge: 'Office', description: 'Modern OpenXML Microsoft Word document.' },
  doc: { id: 'doc', ext: 'doc', name: 'Legacy Word Document', mime: 'application/msword', category: 'document', description: 'Legacy binary Microsoft Word document.' },
  txt: { id: 'txt', ext: 'txt', name: 'Plain Text Document', mime: 'text/plain', category: 'document', description: 'Raw unformatted text file with UTF-8 encoding.' },
  md: { id: 'md', ext: 'md', name: 'Markdown Document', mime: 'text/markdown', category: 'document', description: 'Lightweight markup language with plain-text formatting.' },
  html: { id: 'html', ext: 'html', name: 'HyperText Markup File', mime: 'text/html', category: 'document', description: 'Standard markup for documents displayed in a browser.' },
  pptx: { id: 'pptx', ext: 'pptx', name: 'PowerPoint Presentation', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', category: 'presentation', badge: 'Office', description: 'Microsoft PowerPoint presentation.' },

  // Spreadsheets
  xlsx: { id: 'xlsx', ext: 'xlsx', name: 'Microsoft Excel Spreadsheet', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', category: 'spreadsheet', badge: 'Office', description: 'OpenXML spreadsheet with tabular data.' },
  xls: { id: 'xls', ext: 'xls', name: 'Legacy Excel Spreadsheet', mime: 'application/vnd.ms-excel', category: 'spreadsheet', description: 'Legacy binary Microsoft Excel spreadsheet.' },
  csv: { id: 'csv', ext: 'csv', name: 'Comma-Separated Values', mime: 'text/csv', category: 'spreadsheet', badge: 'Data', description: 'Delimited text file using commas to separate values.' },
  tsv: { id: 'tsv', ext: 'tsv', name: 'Tab-Separated Values', mime: 'text/tab-separated-values', category: 'spreadsheet', description: 'Delimited text file using tabs to separate values.' },
  ods: { id: 'ods', ext: 'ods', name: 'OpenDocument Spreadsheet', mime: 'application/vnd.oasis.opendocument.spreadsheet', category: 'spreadsheet', description: 'Open format spreadsheet used in LibreOffice.' },

  // Images
  jpg: { id: 'jpg', ext: 'jpg', name: 'JPEG Image', mime: 'image/jpeg', category: 'image', badge: 'Lossy', description: 'Joint Photographic Experts Group raster photo format.' },
  jpeg: { id: 'jpeg', ext: 'jpeg', name: 'JPEG Image', mime: 'image/jpeg', category: 'image', description: 'Standard raster photo image format.' },
  png: { id: 'png', ext: 'png', name: 'PNG Image', mime: 'image/png', category: 'image', badge: 'Lossless', description: 'Portable Network Graphics with alpha transparency.' },
  webp: { id: 'webp', ext: 'webp', name: 'WebP Image', mime: 'image/webp', category: 'image', badge: 'Modern', description: 'Next-gen high compression image format for web.' },
  bmp: { id: 'bmp', ext: 'bmp', name: 'Bitmap Image', mime: 'image/bmp', category: 'image', description: 'Uncompressed raster graphics format.' },
  gif: { id: 'gif', ext: 'gif', name: 'GIF Animation / Image', mime: 'image/gif', category: 'image', description: 'Graphics Interchange Format raster graphic.' },
  svg: { id: 'svg', ext: 'svg', name: 'Scalable Vector Graphics', mime: 'image/svg+xml', category: 'image', badge: 'Vector', description: 'XML-based two-dimensional vector graphic.' },
  ico: { id: 'ico', ext: 'ico', name: 'Icon Format', mime: 'image/x-icon', category: 'image', description: 'Computer icon file format for favicon and app icons.' },

  // Data & Structured
  json: { id: 'json', ext: 'json', name: 'JavaScript Object Notation', mime: 'application/json', category: 'data', badge: 'API', description: 'Standard human-readable structured data interchange format.' },
  xml: { id: 'xml', ext: 'xml', name: 'Extensible Markup Language', mime: 'application/xml', category: 'data', description: 'Text-based format for representing structured information.' },
  yaml: { id: 'yaml', ext: 'yaml', name: 'YAML Data File', mime: 'text/yaml', category: 'data', description: 'Human-friendly data serialization standard.' },
  yml: { id: 'yml', ext: 'yml', name: 'YAML Data File', mime: 'text/yaml', category: 'data', description: 'YAML formatted configuration file.' },

  // Archives
  zip: { id: 'zip', ext: 'zip', name: 'ZIP Archive', mime: 'application/zip', category: 'archive', badge: 'Bundle', description: 'Compressed archive container supporting multiple files.' }
};

/**
 * Genuine client-side conversion target matrix.
 * Every single conversion pair listed below is backed by real parsing and compilation.
 * No fake conversions, no mock delays.
 */
export const CONVERSION_MATRIX: Record<string, string[]> = {
  // Images
  jpg: ['png', 'webp', 'bmp', 'ico', 'pdf', 'svg'],
  jpeg: ['png', 'webp', 'bmp', 'ico', 'pdf', 'svg'],
  png: ['jpg', 'webp', 'bmp', 'ico', 'pdf', 'svg'],
  webp: ['png', 'jpg', 'bmp', 'ico', 'pdf', 'svg'],
  bmp: ['png', 'jpg', 'webp', 'ico', 'pdf'],
  gif: ['png', 'jpg', 'webp', 'pdf'],
  svg: ['png', 'jpg', 'webp', 'pdf'],
  ico: ['png', 'jpg', 'webp', 'pdf'],

  // Spreadsheets
  xlsx: ['csv', 'tsv', 'json', 'html', 'pdf', 'txt'],
  xls: ['xlsx', 'csv', 'tsv', 'json', 'html', 'pdf'],
  csv: ['xlsx', 'tsv', 'json', 'html', 'pdf', 'txt'],
  tsv: ['xlsx', 'csv', 'json', 'html', 'pdf', 'txt'],
  ods: ['xlsx', 'csv', 'json', 'html', 'pdf'],

  // Documents
  pdf: ['docx', 'txt', 'jpg', 'png', 'webp', 'html'],
  docx: ['pdf', 'txt', 'html'],
  doc: ['pdf', 'txt'],
  txt: ['pdf', 'docx', 'html', 'md', 'json'],
  md: ['pdf', 'docx', 'html', 'txt'],
  html: ['pdf', 'docx', 'txt', 'md'],
  pptx: ['pdf', 'txt', 'html', 'docx'],

  // Data
  json: ['csv', 'tsv', 'xlsx', 'xml', 'yaml', 'txt'],
  xml: ['json', 'csv', 'txt'],
  yaml: ['json', 'csv', 'txt'],
  yml: ['json', 'csv', 'txt'],

  // Archives
  zip: ['extract-all', 'txt']
};

/**
 * Detect format from file name and MIME type.
 */
export function detectFileFormat(file: File): FileFormat | null {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (SUPPORTED_FORMATS[ext]) {
    return SUPPORTED_FORMATS[ext];
  }

  // Fallback check against MIME
  const mime = file.type.toLowerCase();
  for (const key of Object.keys(SUPPORTED_FORMATS)) {
    if (SUPPORTED_FORMATS[key].mime === mime) {
      return SUPPORTED_FORMATS[key];
    }
  }

  // Generic text fallback
  if (mime.startsWith('text/')) {
    return SUPPORTED_FORMATS.txt;
  }

  // Generic image fallback
  if (mime.startsWith('image/')) {
    return SUPPORTED_FORMATS.png;
  }

  return null;
}

/**
 * Get list of valid target formats for a given source extension.
 */
export function getCompatibleTargets(sourceExt: string): FileFormat[] {
  const normExt = sourceExt.toLowerCase().replace(/^\./, '');
  const targetExts = CONVERSION_MATRIX[normExt] || [];

  return targetExts
    .map((ext) => {
      if (ext === 'extract-all') {
        return {
          id: 'extract-all',
          ext: 'extract-all',
          name: 'Extract All Files (Folder/Unzip)',
          mime: 'application/octet-stream',
          category: 'archive' as FormatCategory,
          badge: 'Unpack',
          description: 'Extract all individual files from this archive.'
        };
      }
      return SUPPORTED_FORMATS[ext];
    })
    .filter((f): f is FileFormat => Boolean(f));
}

/**
 * Check if a conversion pair is supported.
 */
export function isConversionSupported(fromExt: string, toExt: string): boolean {
  const normFrom = fromExt.toLowerCase().replace(/^\./, '');
  const normTo = toExt.toLowerCase().replace(/^\./, '');
  const targets = CONVERSION_MATRIX[normFrom];
  return targets ? targets.includes(normTo) : false;
}
