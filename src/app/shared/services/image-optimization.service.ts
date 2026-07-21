import { Injectable } from '@angular/core';
import imageCompression from 'browser-image-compression';

export interface ImageOptimizationOptions {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  initialQuality: number;
  skipIfWebpUnderBytes: number;
}

const DEFAULT_OPTIONS: ImageOptimizationOptions = {
  maxSizeMB: 1, // Máximo 1MB por imagen
  maxWidthOrHeight: 1920, // Resolución máxima
  initialQuality: 0.8, // Calidad 80%
  skipIfWebpUnderBytes: 1024 * 500 // < 500KB
};

@Injectable({
  providedIn: 'root'
})
export class ImageOptimizationService {

  // Convierte imágenes a WebP y las comprime; videos y no-imágenes se devuelven sin cambios
  async optimizeImages(files: File[], options: Partial<ImageOptimizationOptions> = {}): Promise<File[]> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    const compressionOptions = {
      maxSizeMB: opts.maxSizeMB,
      maxWidthOrHeight: opts.maxWidthOrHeight,
      useWebWorker: true, // No bloquear UI
      fileType: 'image/webp', // Convertir a WebP
      initialQuality: opts.initialQuality,
      alwaysKeepResolution: false,
      preserveExif: false
    };

    const optimizationPromises = files.map(async (file) => {
      if (!file.type.includes('image')) {
        return file; // Si no es imagen, devolver sin cambios
      }

      // Si ya es WebP y es pequeño, no optimizar
      if (file.type === 'image/webp' && file.size < opts.skipIfWebpUnderBytes) {
        return file;
      }

      try {
        const compressedFile = await imageCompression(file, compressionOptions);

        // Mantener el nombre original pero cambiar extensión a .webp
        const originalName = file.name.replace(/\.[^/.]+$/, "");
        const optimizedName = `${originalName}_optimized_${crypto.randomUUID()}.webp`;

        return new File([compressedFile], optimizedName, {
          type: 'image/webp'
        });

      } catch (error) {
        console.warn(`No se pudo optimizar ${file.name}:`, error);
        return file; // Fallback al archivo original
      }
    });

    // Esperar a que todas se optimicen
    const results = await Promise.all(optimizationPromises);
    return results.filter((file): file is File => file !== null);
  }
}
