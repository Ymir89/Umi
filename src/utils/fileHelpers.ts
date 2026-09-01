import { ReferenceImage } from '../types';

export const SUPPORTED_FORMAT_CATEGORIES = [
  { name: 'Standard Formats', extensions: 'JPG, JPEG, PNG, WEBP, GIF, SVG, AVIF, BMP, ICO' },
  { name: 'Apple & Modern', extensions: 'HEIC, HEIF, HIF, APNG' },
  { name: 'Camera RAW Formats', extensions: 'CR2, CR3, NEF, ARW, DNG, ORF, RW2, RAF, PEF' },
  { name: 'Art & Design Formats', extensions: 'PSD, PSB, TIFF, TIF, TGA, HDR, EXR, DDS, EPS' },
];

/**
 * Universal supported image extensions for drawing reference photos.
 * Includes all standard raster, vector, modern formats, RAW, Apple HEIC, PSD, etc.
 */
const IMAGE_EXTENSION_REGEX = /\.(jpe?g|png|webp|gif|svg|avif|bmp|tiff?|tif|jfif|pjp|pjpeg|heic|heif|hif|ico|cur|apng|raw|cr2|cr3|nef|arw|dng|orf|rw2|pef|raf|srw|dcr|kdc|mrw|psd|psb|tga|hdr|exr|pct|pict|dds|xcf|eps|ai|jp2|j2k|jpf|jpx|jpm|mj2)$/i;

// Non-image file extensions that must always be skipped
const NON_IMAGE_EXTENSION_REGEX = /\.(txt|pdf|docx?|xlsx?|pptx?|zip|rar|7z|tar|gz|bz2|iso|mp4|mov|avi|mkv|webm|wmv|m4v|flv|mp3|wav|ogg|flac|m4a|aac|wma|json|js|ts|tsx|jsx|html|htm|css|scss|sass|py|cpp|c|h|hpp|java|class|cs|php|rb|go|rs|swift|kt|exe|dll|dylib|so|dmg|bin|apk|ipa|env|log|md|yml|yaml|xml|csv|tsv|sql|db|sqlite|bak|ini|cfg|conf|sh|bat|cmd)$/i;

export function isImageFile(file: { name: string; type?: string; size?: number }): boolean {
  if (!file || !file.name) return false;
  const name = file.name.trim();

  // Filter out OS system / metadata / hidden files
  if (
    name.startsWith('.') ||
    name.startsWith('__MACOSX') ||
    name.toLowerCase() === 'thumbs.db' ||
    name.toLowerCase() === 'desktop.ini' ||
    name.toLowerCase() === '.ds_store'
  ) {
    return false;
  }

  // Filter out known non-image documents, media, code, and archive files
  if (NON_IMAGE_EXTENSION_REGEX.test(name)) {
    return false;
  }

  // If browser reports image MIME type
  if (file.type && file.type.startsWith('image/')) {
    return true;
  }

  // Check known image extensions
  if (IMAGE_EXTENSION_REGEX.test(name)) {
    return true;
  }

  // If the file has no extension (likely a folder or unknown directory), return false
  if (!name.includes('.')) {
    return false;
  }

  return false;
}

/**
 * Optimizes/resizes large photo files to max 2400px (retina quality for drawing)
 * to avoid blowing up IndexedDB storage quota. Falls back cleanly to FileReader DataURL.
 * Always resolves with a durable Data URL (base64 string), NEVER a temporary blob URL.
 */
export async function optimizeFileToDataUrl(file: File, maxDimension = 2400): Promise<string> {
  // If it's SVG, read as text Data URL directly
  if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
    return readFileAsDataUrl(file);
  }

  return new Promise((resolve) => {
    // If file is small (< 600KB), read directly as Data URL for maximum speed and fidelity
    if (file.size < 600 * 1024) {
      readFileAsDataUrl(file)
        .then(resolve)
        .catch(() => {
          resolve('');
        });
      return;
    }

    let objectUrl = '';
    try {
      objectUrl = URL.createObjectURL(file);
    } catch {
      readFileAsDataUrl(file).then(resolve).catch(() => resolve(''));
      return;
    }

    const img = new Image();

    img.onload = () => {
      try {
        URL.revokeObjectURL(objectUrl);
      } catch {
        // ignore
      }

      try {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          readFileAsDataUrl(file).then(resolve).catch(() => resolve(''));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const quality = 0.90;
        const dataUrl = canvas.toDataURL(mimeType, quality);
        resolve(dataUrl);
      } catch (err) {
        console.warn('Canvas optimization fallback to FileReader:', err);
        readFileAsDataUrl(file).then(resolve).catch(() => resolve(''));
      }
    };

    img.onerror = () => {
      try {
        URL.revokeObjectURL(objectUrl);
      } catch {
        // ignore
      }
      // Fallback to direct FileReader Data URL
      readFileAsDataUrl(file).then(resolve).catch(() => resolve(''));
    };

    img.src = objectUrl;
  });
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read image as Data URL'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('FileReader error'));
    reader.readAsDataURL(file);
  });
}

export interface ExtractedImageFile {
  file: File;
  id: string;
  url: string; // temporary object URL or data URL
  title: string;
  folderName?: string;
  relativePath?: string;
  folderTags?: string[];
}

/**
 * Recursively traverse a FileSystemEntry (from drag & drop items)
 */
export async function traverseFileSystemEntry(
  entry: any,
  currentPath = ''
): Promise<ExtractedImageFile[]> {
  if (!entry) return [];
  const results: ExtractedImageFile[] = [];

  if (entry.isFile) {
    try {
      const file: File = await new Promise((resolve, reject) => {
        entry.file(resolve, reject);
      });

      if (isImageFile(file)) {
        let url = '';
        try {
          url = URL.createObjectURL(file);
        } catch {
          url = '';
        }
        const title = file.name.replace(/\.[^/.]+$/, '').trim();
        
        // Extract all folder levels in the hierarchy
        const folderTags: string[] = [];
        let folderName: string | undefined = undefined;
        
        if (currentPath) {
          const parts = currentPath.split('/').map(p => p.trim()).filter(Boolean);
          if (parts.length > 0) {
            folderName = parts[parts.length - 1]; // immediate folder name
            parts.forEach(p => {
              if (!folderTags.includes(p)) folderTags.push(p);
            });
            if (parts.length > 1 && !folderTags.includes(currentPath)) {
              folderTags.push(currentPath);
            }
          }
        }

        results.push({
          file,
          id: `custom-img-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          url,
          title,
          folderName,
          folderTags,
          relativePath: currentPath ? `${currentPath}/${file.name}` : file.name,
        });
      }
    } catch (e) {
      console.warn('Could not read file entry:', entry.name, e);
    }
  } else if (entry.isDirectory) {
    const dirPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
    const dirReader = entry.createReader();

    // Read all directory batches until empty (readEntries returns in batches of 100 max)
    const readAllEntries = async (): Promise<any[]> => {
      const allEntries: any[] = [];
      let batch: any[] = [];
      do {
        batch = await new Promise<any[]>((resolve) => {
          dirReader.readEntries(
            (entries: any[]) => resolve(entries || []),
            (err: any) => {
              console.warn('Error reading directory batch:', entry.name, err);
              resolve([]);
            }
          );
        });
        if (batch && batch.length > 0) {
          allEntries.push(...batch);
        }
      } while (batch && batch.length > 0);
      return allEntries;
    };

    try {
      const entries = await readAllEntries();
      for (const subEntry of entries) {
        const subFiles = await traverseFileSystemEntry(subEntry, dirPath);
        results.push(...subFiles);
      }
    } catch (e) {
      console.warn('Could not read directory entry:', entry.name, e);
    }
  }

  return results;
}

/**
 * Extract files from Drag & Drop DataTransfer, properly resolving directories and subdirectories
 */
export async function extractFilesFromDataTransfer(
  dataTransfer: DataTransfer
): Promise<ExtractedImageFile[]> {
  const items = dataTransfer.items;

  // Modern browser FileSystemEntry traversal
  if (items && items.length > 0) {
    const promises: Promise<ExtractedImageFile[]>[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const entry = (item as any).webkitGetAsEntry?.();
        if (entry) {
          promises.push(traverseFileSystemEntry(entry, ''));
        } else {
          const file = item.getAsFile();
          if (file && isImageFile(file)) {
            promises.push(
              Promise.resolve([
                {
                  file,
                  id: `custom-img-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                  url: URL.createObjectURL(file),
                  title: file.name.replace(/\.[^/.]+$/, '').trim(),
                  folderTags: [],
                },
              ])
            );
          }
        }
      }
    }

    if (promises.length > 0) {
      const nested = await Promise.all(promises);
      const flattened = nested.flat();
      if (flattened.length > 0) {
        return flattened;
      }
    }
  }

  // Fallback to dataTransfer.files
  if (dataTransfer.files && dataTransfer.files.length > 0) {
    return extractFilesFromFileList(dataTransfer.files);
  }

  return [];
}

/**
 * Extract files from an HTML File input (with webkitdirectory or multiple files)
 */
export function extractFilesFromFileList(
  files: FileList | File[]
): ExtractedImageFile[] {
  const results: ExtractedImageFile[] = [];
  const fileArray = Array.from(files);

  for (let i = 0; i < fileArray.length; i++) {
    const file = fileArray[i];
    if (!isImageFile(file)) continue;

    const rawPath = (file as any).webkitRelativePath || (file as any).fullPath || '';
    const cleanPath = rawPath.replace(/\\/g, '/').replace(/^\/+/, '').trim();
    let folderName: string | undefined = undefined;
    const folderTags: string[] = [];
    let title = file.name.replace(/\.[^/.]+$/, '').trim();

    if (cleanPath && cleanPath.includes('/')) {
      const parts = cleanPath.split('/').map(p => p.trim()).filter(Boolean);
      // All directories leading up to the file
      const dirParts = parts.slice(0, -1);
      if (dirParts.length > 0) {
        // Immediate parent folder
        folderName = dirParts[dirParts.length - 1];
        // Add all folder levels as tags
        dirParts.forEach(p => {
          if (!folderTags.includes(p)) folderTags.push(p);
        });
        // If there are multiple folder levels (e.g. MyPoses/Standing), also add the combined folder hierarchy tag
        if (dirParts.length > 1) {
          const joined = dirParts.join(' / ');
          if (!folderTags.includes(joined)) folderTags.push(joined);
        }
      }
    }

    let url = '';
    try {
      url = URL.createObjectURL(file);
    } catch {
      url = '';
    }

    results.push({
      file,
      id: `custom-img-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 9)}`,
      url,
      title: title || file.name || `Photo ${i + 1}`,
      folderName: folderName || undefined,
      folderTags,
      relativePath: cleanPath || file.name,
    });
  }

  return results;
}

/**
 * Convert ExtractedImageFiles to durable base64 ReferenceImages for IndexedDB persistence
 */
export async function convertToDurableReferenceImages(
  items: ExtractedImageFile[],
  onProgress?: (processed: number, total: number) => void
): Promise<ReferenceImage[]> {
  const finalImages: ReferenceImage[] = [];
  let completed = 0;

  // Process in small batches for smooth UI responsiveness and memory safety
  const batchSize = 6;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (item) => {
        let finalUrl = item.url;
        if (item.file) {
          try {
            const dataUrl = await optimizeFileToDataUrl(item.file);
            if (dataUrl && dataUrl.length > 0) {
              finalUrl = dataUrl;
            }
          } catch (e) {
            console.warn('Failed to optimize image file to Data URL, using fallback:', e);
          }
        }

        const tags: string[] = ['custom'];
        if (item.folderTags && item.folderTags.length > 0) {
          item.folderTags.forEach(t => {
            if (!tags.includes(t)) tags.push(t);
          });
        } else if (item.folderName) {
          if (!tags.includes(item.folderName)) tags.push(item.folderName);
        }

        return {
          id: item.id || `custom-img-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          url: finalUrl,
          title: item.title || 'Custom Photo Reference',
          category: 'custom' as const,
          tags,
          isCustom: true,
          dateAdded: Date.now(),
        };
      })
    );

    finalImages.push(...batchResults);
    completed += batch.length;
    if (onProgress) {
      onProgress(Math.min(completed, items.length), items.length);
    }
  }

  return finalImages;
}
