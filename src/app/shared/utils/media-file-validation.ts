export enum MediaCategory {
  IMAGE = 'image',
  VIDEO = 'video',
  DOC = 'pdf'
}

export const MAX_LENGTH_NAME_FILE = 45; // Max caracteres en el nombre

export enum MediaValidationErrorType {
  INVALID_TYPE = 'INVALID_TYPE',
  NAME_TOO_LONG = 'NAME_TOO_LONG',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
}

export interface MediaValidationResult {
  isValid: boolean;
  errorType?: MediaValidationErrorType;
  errorMessage?: string;
  invalidFile?: File;
}

export type MediaValidationMessage = string | ((file: File, options: MediaValidationOptions) => string);

export interface MediaValidationOptions {
  /** Categorías por prefijo MIME, ej: [IMAGE] o [IMAGE, VIDEO] */
  allowedCategories?: MediaCategory[];
  /** Whitelist exacta de MIME types (tiene prioridad sobre allowedCategories), ej: ['application/pdf'] */
  allowedMimeTypes?: string[];
  /** Longitud máxima del nombre; si se omite, no se valida */
  maxLengthFileName?: number;
  /** Tamaño máximo en bytes; si se omite, no se valida */
  maxFileSizeBytes?: number;
  /** Mensajes personalizados por tipo de error (string fijo o función para interpolar datos del archivo) */
  messages?: Partial<Record<MediaValidationErrorType, MediaValidationMessage>>;
}

const DEFAULT_MESSAGES: Record<MediaValidationErrorType, MediaValidationMessage> = {
  [MediaValidationErrorType.INVALID_TYPE]: 'Por favor, seleccione un archivo válido',
  [MediaValidationErrorType.NAME_TOO_LONG]: (_file, options) =>
    `El nombre del archivo es muy largo, máximo ${options.maxLengthFileName} caracteres`,
  [MediaValidationErrorType.FILE_TOO_LARGE]: (file, options) =>
    `El archivo ${file.name} es demasiado grande. Máximo permitido: ${formatMB(options.maxFileSizeBytes)}MB.`,
};

function formatMB(bytes?: number): string {
  return bytes ? (bytes / (1024 * 1024)).toFixed(0) : '';
}

function resolveMessage(
  errorType: MediaValidationErrorType,
  file: File,
  options: MediaValidationOptions
): string {
  const message = options.messages?.[errorType] ?? DEFAULT_MESSAGES[errorType];
  return typeof message === 'function' ? message(file, options) : message;
}

function isFileTypeValid(file: File, options: MediaValidationOptions): boolean {
  if (options.allowedMimeTypes?.length) {
    return options.allowedMimeTypes.includes(file.type);
  }
  if (options.allowedCategories?.length) {
    return options.allowedCategories.some(category => file.type.startsWith(`${category}/`));
  }
  return true;
}

function isFileNameLengthValid(file: File, maxLength?: number): boolean {
  return !maxLength || file.name.length <= maxLength;
}

function isFileSizeValid(file: File, maxSizeBytes?: number): boolean {
  return !maxSizeBytes || file.size <= maxSizeBytes;
}

function buildErrorResult(
  errorType: MediaValidationErrorType,
  file: File,
  options: MediaValidationOptions
): MediaValidationResult {
  return {
    isValid: false,
    errorType,
    errorMessage: resolveMessage(errorType, file, options),
    invalidFile: file,
  };
}

/** Valida un único archivo (logo, banner) */
export function validateMediaFile(
  file: File,
  options: MediaValidationOptions = {}
): MediaValidationResult {
  if (!isFileTypeValid(file, options)) {
    return buildErrorResult(MediaValidationErrorType.INVALID_TYPE, file, options);
  }
  if (!isFileNameLengthValid(file, options.maxLengthFileName)) {
    return buildErrorResult(MediaValidationErrorType.NAME_TOO_LONG, file, options);
  }
  if (!isFileSizeValid(file, options.maxFileSizeBytes)) {
    return buildErrorResult(MediaValidationErrorType.FILE_TOO_LARGE, file, options);
  }
  return { isValid: true };
}

/** Valida un conjunto de archivos (imágenes de artículo, imágenes/videos de post, PDFs) */
export function validateMediaFiles(
  files: File[],
  options: MediaValidationOptions = {}
): MediaValidationResult {
  for (const file of files) {
    const result = validateMediaFile(file, options);
    if (!result.isValid) return result; // corta en el primer archivo inválido
  }
  return { isValid: true };
}

/** Extrae archivos tanto de un <input type="file"> como de un evento drag & drop */
export function extractFilesFromEvent(event: Event | DragEvent): File[] | null {
  if (event instanceof DragEvent && event.dataTransfer?.files?.length) {
    return Array.from(event.dataTransfer.files);
  }
  if (event.target instanceof HTMLInputElement && event.target.files?.length) {
    return Array.from(event.target.files);
  }
  return null;
}