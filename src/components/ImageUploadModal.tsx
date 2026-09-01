import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, 
  FolderUp, 
  Image as ImageIcon, 
  Trash2, 
  X, 
  Check, 
  Link as LinkIcon, 
  Sparkles, 
  CheckSquare, 
  Square, 
  Folder,
  Layers,
  FileCheck2
} from 'lucide-react';
import { ReferenceImage, ReferenceCategory } from '../types';
import { saveMultipleCustomImages } from '../utils/indexedDB';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImagesUploaded: (newImages: ReferenceImage[]) => void;
}

interface PendingItem {
  id: string;
  url: string;
  title: string;
  folderName?: string;
  file?: File;
}

export const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  isOpen,
  onClose,
  onImagesUploaded,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [pendingImages, setPendingImages] = useState<PendingItem[]>([]);
  const [selectedPendingIds, setSelectedPendingIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedFolderCount, setDetectedFolderCount] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Set webkitdirectory on folderInputRef dynamically
  useEffect(() => {
    if (folderInputRef.current) {
      folderInputRef.current.setAttribute('webkitdirectory', '');
      folderInputRef.current.setAttribute('directory', '');
    }
  }, [isOpen]);

  // Keep selectedPendingIds in sync with newly added pending images
  useEffect(() => {
    setSelectedPendingIds(pendingImages.map((img) => img.id));
  }, [pendingImages.length]);

  if (!isOpen) return null;

  const isImageFile = (file: File | { name: string; type?: string }) => {
    if (file.type && file.type.startsWith('image/')) return true;
    return /\.(jpg|jpeg|png|webp|gif|svg|avif|bmp|tiff)$/i.test(file.name);
  };

  const processFileList = (files: FileList | File[]) => {
    const newPending: PendingItem[] = [];
    const folders = new Set<string>();

    Array.from(files).forEach((file) => {
      if (isImageFile(file)) {
        const url = URL.createObjectURL(file);
        const relativePath = (file as any).webkitRelativePath || '';
        let folderName = '';
        let title = file.name.replace(/\.[^/.]+$/, '');

        if (relativePath && relativePath.includes('/')) {
          const parts = relativePath.split('/');
          folderName = parts[0];
          folders.add(folderName);
          // Include subfolder in title if distinct
          if (parts.length > 2) {
            title = `${parts.slice(0, parts.length - 1).join(' / ')} - ${title}`;
          }
        }

        newPending.push({
          id: `custom-img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          url,
          title,
          folderName: folderName || undefined,
          file,
        });
      }
    });

    if (folders.size > 0) {
      setDetectedFolderCount((prev) => prev + folders.size);
    }

    setPendingImages((prev) => [...prev, ...newPending]);
  };

  // Traverse dropped folders recursively
  const traverseDirectoryEntry = async (entry: any): Promise<File[]> => {
    const files: File[] = [];
    if (entry.isFile) {
      const file: File = await new Promise((resolve, reject) => {
        entry.file(resolve, reject);
      });
      if (isImageFile(file)) {
        files.push(file);
      }
    } else if (entry.isDirectory) {
      const dirReader = entry.createReader();
      const readAllEntries = async (): Promise<any[]> => {
        const entries: any[] = [];
        let batch: any[] = await new Promise((resolve, reject) => {
          dirReader.readEntries(resolve, reject);
        });
        while (batch.length > 0) {
          entries.push(...batch);
          batch = await new Promise((resolve, reject) => {
            dirReader.readEntries(resolve, reject);
          });
        }
        return entries;
      };

      const subEntries = await readAllEntries();
      for (const subEntry of subEntries) {
        const subFiles = await traverseDirectoryEntry(subEntry);
        files.push(...subFiles);
      }
    }
    return files;
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const items = e.dataTransfer.items;
    if (items && items.length > 0 && (items[0] as any).webkitGetAsEntry) {
      setIsProcessing(true);
      const allFiles: File[] = [];
      let folderFound = false;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const entry = (item as any).webkitGetAsEntry();
          if (entry) {
            if (entry.isDirectory) {
              folderFound = true;
            }
            const filesFromEntry = await traverseDirectoryEntry(entry);
            allFiles.push(...filesFromEntry);
          }
        }
      }
      setIsProcessing(false);
      if (folderFound) {
        setDetectedFolderCount((prev) => prev + 1);
      }
      processFileList(allFiles);
    } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFileList(e.dataTransfer.files);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    const url = urlInput.trim();
    const newId = `custom-url-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setPendingImages((prev) => [
      ...prev,
      {
        id: newId,
        url,
        title: `Online Reference ${prev.length + 1}`,
      },
    ]);
    setSelectedPendingIds((prev) => [...prev, newId]);
    setUrlInput('');
  };

  const toggleSelectImage = (id: string) => {
    setSelectedPendingIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedPendingIds.length === pendingImages.length) {
      // Deselect all
      setSelectedPendingIds([]);
    } else {
      // Select all
      setSelectedPendingIds(pendingImages.map((img) => img.id));
    }
  };

  const removePending = (id: string) => {
    setPendingImages((prev) => prev.filter((img) => img.id !== id));
    setSelectedPendingIds((prev) => prev.filter((item) => item !== id));
  };

  const removeSelectedPending = () => {
    setPendingImages((prev) => prev.filter((img) => !selectedPendingIds.includes(img.id)));
    setSelectedPendingIds([]);
  };

  // Convert files to base64 DataURL or store in IndexedDB
  const handleSaveToLibrary = async (saveOnlySelected = false) => {
    const imagesToSave = saveOnlySelected
      ? pendingImages.filter((img) => selectedPendingIds.includes(img.id))
      : pendingImages;

    if (imagesToSave.length === 0) return;
    setIsProcessing(true);

    try {
      const finalImages: ReferenceImage[] = [];

      for (const item of imagesToSave) {
        let finalUrl = item.url;

        // If it's a file, convert to base64 DataURL for durable offline persistence
        if (item.file) {
          finalUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(item.file!);
          });
        }

        const tags = ['custom'];
        if (item.folderName) {
          tags.push(item.folderName);
        }

        finalImages.push({
          id: item.id,
          url: finalUrl,
          title: item.title,
          category: 'custom',
          tags,
          isCustom: true,
          dateAdded: Date.now(),
        });
      }

      await saveMultipleCustomImages(finalImages);
      onImagesUploaded(finalImages);
      setPendingImages([]);
      setSelectedPendingIds([]);
      onClose();
    } catch (err) {
      console.error('Failed to save uploaded images', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const allSelected = pendingImages.length > 0 && selectedPendingIds.length === pendingImages.length;
  const someSelected = selectedPendingIds.length > 0 && selectedPendingIds.length < pendingImages.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-3xl backdrop-blur-2xl bg-[#0c0c10]/95 border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl text-neutral-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-inner">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                Upload Reference Photos & Folders
              </h2>
              <p className="text-xs text-neutral-400">
                Upload entire folders or individual photos from your device into local offline storage
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Buttons & Drag Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all flex flex-col items-center justify-center ${
            dragActive
              ? 'border-emerald-400 bg-emerald-500/10'
              : 'border-white/15 hover:border-white/30 bg-white/[0.02] hover:bg-white/[0.04]'
          }`}
        >
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => {
              if (e.target.files) processFileList(e.target.files);
            }}
            className="hidden"
          />

          {/* Hidden Folder Input */}
          <input
            ref={folderInputRef}
            type="file"
            multiple
            onChange={(e) => {
              if (e.target.files) processFileList(e.target.files);
            }}
            className="hidden"
          />

          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 shadow-inner">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400 shadow-inner">
              <FolderUp className="w-6 h-6" />
            </div>
          </div>

          <p className="text-sm font-semibold text-neutral-200 mb-1">
            Drag & drop whole folders or image files here
          </p>
          <p className="text-xs text-neutral-400 mb-4 max-w-md">
            Automatically scans nested subdirectories and imports JPG, PNG, WEBP, and GIF reference files safely into local browser storage.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              id="btn-select-files"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-100 text-xs font-semibold border border-white/15 backdrop-blur-md transition-all flex items-center gap-2"
            >
              <ImageIcon className="w-4 h-4 text-emerald-400" />
              Select Image Files
            </button>
            <button
              id="btn-select-folder"
              type="button"
              onClick={() => folderInputRef.current?.click()}
              className="px-4 py-2.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 text-xs font-semibold border border-indigo-500/40 backdrop-blur-md transition-all flex items-center gap-2"
            >
              <FolderUp className="w-4 h-4 text-indigo-400" />
              Upload Entire Folder
            </button>
          </div>
        </div>

        {/* Or Paste Direct Image URL */}
        <form onSubmit={handleAddUrl} className="flex items-center gap-2 mt-4">
          <div className="relative flex-1">
            <LinkIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Or paste direct image URL (e.g. https://...)"
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            type="submit"
            disabled={!urlInput.trim()}
            className="px-4 py-2 rounded-xl backdrop-blur-md bg-white/10 hover:bg-white/20 text-neutral-200 text-xs font-semibold border border-white/15 disabled:opacity-40 transition-colors"
          >
            Add URL
          </button>
        </form>

        {/* Preview & Select All Option for Image Files */}
        {pendingImages.length > 0 && (
          <div className="mt-5 space-y-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2.5 text-xs font-semibold">
              <div className="flex items-center gap-3">
                {/* Select All Checkbox Button */}
                <button
                  id="btn-select-all-pending"
                  type="button"
                  onClick={handleSelectAll}
                  className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors font-bold"
                >
                  {allSelected ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                  ) : someSelected ? (
                    <div className="w-4 h-4 rounded border border-emerald-400 bg-emerald-500/30 flex items-center justify-center text-[10px] font-mono leading-none">
                      -
                    </div>
                  ) : (
                    <Square className="w-4 h-4 text-neutral-400" />
                  )}
                  <span>{allSelected ? 'Deselect All' : `Select All (${pendingImages.length})`}</span>
                </button>

                <span className="text-neutral-500">|</span>
                <span className="text-neutral-300">
                  {selectedPendingIds.length} of {pendingImages.length} selected
                </span>
              </div>

              <div className="flex items-center gap-2">
                {selectedPendingIds.length > 0 && (
                  <button
                    type="button"
                    onClick={removeSelectedPending}
                    className="flex items-center gap-1 text-rose-400 hover:text-rose-300 text-[11px] transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete Selected ({selectedPendingIds.length})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setPendingImages([]);
                    setSelectedPendingIds([]);
                  }}
                  className="text-neutral-400 hover:text-neutral-200 text-[11px] ml-2"
                >
                  Clear all
                </button>
              </div>
            </div>

            {/* Thumbnail Grid with Checkboxes */}
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2.5 max-h-52 overflow-y-auto p-1 pr-2 no-scrollbar">
              {pendingImages.map((img) => {
                const isSelected = selectedPendingIds.includes(img.id);
                return (
                  <div
                    key={img.id}
                    onClick={() => toggleSelectImage(img.id)}
                    className={`relative group aspect-square rounded-xl overflow-hidden bg-neutral-900 border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-emerald-400/80 ring-2 ring-emerald-500/40'
                        : 'border-white/10 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                    
                    {/* Checkbox indicator */}
                    <div className="absolute top-1.5 left-1.5 z-10">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-emerald-500 text-black shadow-md'
                            : 'bg-black/60 backdrop-blur-md border border-white/30 text-transparent'
                        }`}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    </div>

                    {/* Folder tag if present */}
                    {img.folderName && (
                      <div className="absolute bottom-1 left-1 right-1 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md border border-white/10 text-[9px] text-neutral-300 truncate">
                        📁 {img.folderName}
                      </div>
                    )}

                    {/* Delete single button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removePending(img.id);
                      }}
                      className="absolute top-1 right-1 p-1 rounded-md bg-black/80 text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-950"
                      title="Remove image"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-white/10">
          <div className="text-xs text-neutral-400">
            {pendingImages.length > 0 && (
              <span>Ready: <strong>{selectedPendingIds.length}</strong> photos will be added to Studio</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              id="btn-confirm-upload"
              type="button"
              onClick={() => handleSaveToLibrary(selectedPendingIds.length > 0 && selectedPendingIds.length < pendingImages.length)}
              disabled={pendingImages.length === 0 || isProcessing || (selectedPendingIds.length === 0)}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2 disabled:opacity-40"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              {isProcessing
                ? 'Importing...'
                : `Save ${selectedPendingIds.length} Photos to Studio`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
