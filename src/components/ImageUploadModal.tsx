import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, 
  FolderUp, 
  Image as ImageIcon, 
  Trash2, 
  X, 
  Check, 
  Link as LinkIcon, 
  CheckSquare, 
  Square, 
  Folder,
  AlertCircle,
  CheckCheck
} from 'lucide-react';
import { ReferenceImage } from '../types';
import { saveMultipleCustomImages } from '../utils/indexedDB';
import { 
  ExtractedImageFile, 
  extractFilesFromDataTransfer, 
  extractFilesFromFileList, 
  convertToDurableReferenceImages
} from '../utils/fileHelpers';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImagesUploaded: (newImages: ReferenceImage[]) => void;
}

export const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  isOpen,
  onClose,
  onImagesUploaded,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [pendingImages, setPendingImages] = useState<ExtractedImageFile[]>([]);
  const [selectedPendingIds, setSelectedPendingIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Auto-select all newly added pending images by default
  useEffect(() => {
    if (pendingImages.length > 0) {
      setSelectedPendingIds(pendingImages.map((img) => img.id));
    }
  }, [pendingImages.length]);

  if (!isOpen) return null;

  const handleAddExtractedFiles = (extracted: ExtractedImageFile[]) => {
    if (extracted.length === 0) {
      setErrorMessage('No image files found in the selected folder/files. Supported: JPG, PNG, WEBP, GIF, AVIF, BMP, TIFF, HEIC, RAW, PSD, SVG, and all standard photo formats.');
      return;
    }
    setErrorMessage(null);
    setPendingImages((prev) => [...prev, ...extracted]);
  };

  const handleSelectFolder = () => {
    if (folderInputRef.current) {
      folderInputRef.current.click();
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setIsProcessing(true);
    setProcessProgress('Scanning dropped files & folders...');

    try {
      const extracted = await extractFilesFromDataTransfer(e.dataTransfer);
      handleAddExtractedFiles(extracted);
    } catch (err) {
      console.error('Error reading dropped files:', err);
      setErrorMessage('Failed to read some dropped files.');
    } finally {
      setIsProcessing(false);
      setProcessProgress('');
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
    const newPending: ExtractedImageFile = {
      id: newId,
      url,
      title: `Online Reference ${pendingImages.length + 1}`,
      file: undefined as any,
    };
    setPendingImages((prev) => [...prev, newPending]);
    setSelectedPendingIds((prev) => [...prev, newId]);
    setUrlInput('');
    setErrorMessage(null);
  };

  const toggleSelectImage = (id: string) => {
    setSelectedPendingIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedPendingIds.length === pendingImages.length) {
      // If all are selected, deselect all
      setSelectedPendingIds([]);
    } else {
      // Select all
      setSelectedPendingIds(pendingImages.map((img) => img.id));
    }
  };

  const handleSelectOnlyFolder = (folderName: string) => {
    const folderImageIds = pendingImages
      .filter((img) => img.folderName === folderName)
      .map((img) => img.id);
    setSelectedPendingIds(folderImageIds);
  };

  const removePending = (id: string) => {
    setPendingImages((prev) => prev.filter((img) => img.id !== id));
    setSelectedPendingIds((prev) => prev.filter((item) => item !== id));
  };

  const removeSelectedPending = () => {
    setPendingImages((prev) => prev.filter((img) => !selectedPendingIds.includes(img.id)));
    setSelectedPendingIds([]);
  };

  // Convert files to base64 DataURL and store in IndexedDB
  const handleSaveToLibrary = async (saveOnlySelected = false) => {
    const itemsToSave = saveOnlySelected
      ? pendingImages.filter((img) => selectedPendingIds.includes(img.id))
      : pendingImages;

    if (itemsToSave.length === 0) return;
    setIsProcessing(true);
    setProcessProgress(`Importing 0 of ${itemsToSave.length} references...`);

    try {
      const finalImages = await convertToDurableReferenceImages(
        itemsToSave,
        (current, total) => {
          setProcessProgress(`Importing ${current} of ${total} references...`);
        }
      );

      await saveMultipleCustomImages(finalImages);
      onImagesUploaded(finalImages);
      setPendingImages([]);
      setSelectedPendingIds([]);
      onClose();
    } catch (err) {
      console.error('Failed to save uploaded images', err);
      setErrorMessage('Failed to save references into browser storage. Please try a smaller batch.');
    } finally {
      setIsProcessing(false);
      setProcessProgress('');
    }
  };

  const allSelected = pendingImages.length > 0 && selectedPendingIds.length === pendingImages.length;
  const someSelected = selectedPendingIds.length > 0 && selectedPendingIds.length < pendingImages.length;
  const noneSelected = selectedPendingIds.length === 0;

  // Detected unique folders
  const detectedFolders = Array.from(
    new Set(pendingImages.map((img) => img.folderName).filter(Boolean) as string[])
  );

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
                Import whole folders or individual photos from your device into local offline storage
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
          className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-7 text-center transition-all flex flex-col items-center justify-center ${
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
            accept="image/*,.png,.jpg,.jpeg,.webp,.gif,.svg,.avif,.bmp,.tiff,.tif,.jfif,.pjp,.pjpeg,.heic,.heif,.hif,.ico,.cur,.apng,.raw,.cr2,.cr3,.nef,.arw,.dng,.orf,.rw2,.pef,.raf,.srw,.dcr,.kdc,.mrw,.psd,.psb,.tga,.hdr,.exr,.*"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                const extracted = extractFilesFromFileList(e.target.files);
                handleAddExtractedFiles(extracted);
                e.target.value = '';
              }
            }}
            className="hidden"
          />

          {/* Hidden Folder Input with direct webkitdirectory attributes */}
          <input
            ref={folderInputRef}
            type="file"
            multiple
            {...({ webkitdirectory: '', directory: '', mozdirectory: '' } as any)}
            onChange={(e) => {
              try {
                if (e.target.files && e.target.files.length > 0) {
                  const extracted = extractFilesFromFileList(e.target.files);
                  handleAddExtractedFiles(extracted);
                }
              } catch (err) {
                console.error('Error reading files from folder:', err);
                setErrorMessage('Failed to read files from the selected folder.');
              } finally {
                e.target.value = '';
              }
            }}
            className="hidden"
          />

          <div className="flex items-center gap-3 mb-2.5">
            <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 shadow-inner">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400 shadow-inner">
              <FolderUp className="w-5 h-5" />
            </div>
          </div>

          <p className="text-sm font-semibold text-neutral-200 mb-1">
            Drag & drop whole folders or image files from your device
          </p>
          <p className="text-xs text-neutral-400 mb-3.5 max-w-lg">
            Supports any image format (JPG, PNG, WEBP, GIF, SVG, AVIF, BMP, TIFF, HEIC, RAW, PSD). Folders and subdirectories are automatically indexed with folder tags.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              id="btn-select-files"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-100 text-xs font-semibold border border-white/15 backdrop-blur-md transition-all flex items-center gap-2 active:scale-95"
            >
              <ImageIcon className="w-4 h-4 text-emerald-400" />
              Select Image Files
            </button>
            <button
              id="btn-select-folder"
              type="button"
              onClick={handleSelectFolder}
              className="px-4 py-2.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 text-xs font-semibold border border-indigo-500/40 backdrop-blur-md transition-all flex items-center gap-2 active:scale-95 shadow-md"
            >
              <FolderUp className="w-4 h-4 text-indigo-400" />
              Add Folder from Device
            </button>
          </div>
        </div>

        {/* Error message if any */}
        {errorMessage && (
          <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Or Paste Direct Image URL */}
        <form onSubmit={handleAddUrl} className="flex items-center gap-2 mt-3.5">
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

        {/* Detected Folder Summary Bar if folders exist */}
        {detectedFolders.length > 0 && (
          <div className="mt-3 flex items-center gap-2 flex-wrap text-xs text-neutral-300">
            <span className="font-semibold text-neutral-400">Folders:</span>
            {detectedFolders.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => handleSelectOnlyFolder(f)}
                className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 font-mono text-[11px] transition-colors"
                title={`Click to select only photos in folder ${f}`}
              >
                <Folder className="w-3 h-3 text-indigo-400" />
                <span>{f}</span>
                <span className="opacity-75 font-sans font-bold">({pendingImages.filter((p) => p.folderName === f).length})</span>
              </button>
            ))}
          </div>
        )}

        {/* Selection Bar & Select All Option for Image Files */}
        {pendingImages.length > 0 && (
          <div className="mt-4 space-y-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
            {/* Top Selection Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-white/10 pb-3 text-xs font-semibold">
              {/* Select All / Deselect All Controls */}
              <div className="flex items-center gap-3">
                <button
                  id="btn-select-all-pending"
                  type="button"
                  onClick={handleSelectAll}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 transition-all font-bold active:scale-95 shadow-sm"
                >
                  {allSelected ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                  ) : someSelected ? (
                    <div className="w-4 h-4 rounded border border-emerald-400 bg-emerald-500/40 flex items-center justify-center text-[10px] font-mono leading-none text-emerald-200">
                      -
                    </div>
                  ) : (
                    <Square className="w-4 h-4 text-neutral-400" />
                  )}
                  <span>{allSelected ? 'Deselect All' : `Select All (${pendingImages.length})`}</span>
                </button>

                <div className="flex items-center gap-1.5 text-xs text-neutral-300">
                  <span className="font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded-md">
                    {selectedPendingIds.length}
                  </span>
                  <span className="text-neutral-400">of {pendingImages.length} selected</span>
                </div>
              </div>

              {/* Quick Bulk Action Buttons */}
              <div className="flex items-center gap-2">
                {!allSelected && (
                  <button
                    type="button"
                    onClick={() => setSelectedPendingIds(pendingImages.map((img) => img.id))}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-[11px] font-medium transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Select All
                  </button>
                )}
                {selectedPendingIds.length > 0 && (
                  <button
                    type="button"
                    onClick={removeSelectedPending}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-[11px] font-medium transition-colors border border-rose-500/20"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove Selected ({selectedPendingIds.length})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setPendingImages([]);
                    setSelectedPendingIds([]);
                  }}
                  className="text-neutral-400 hover:text-neutral-200 text-[11px] ml-1 px-1.5 py-1"
                >
                  Clear all
                </button>
              </div>
            </div>

            {/* Thumbnail Grid with Checkboxes */}
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2.5 max-h-56 overflow-y-auto p-1 pr-2 no-scrollbar">
              {pendingImages.map((img) => {
                const isSelected = selectedPendingIds.includes(img.id);
                return (
                  <div
                    key={img.id}
                    onClick={() => toggleSelectImage(img.id)}
                    className={`relative group aspect-square rounded-xl overflow-hidden bg-neutral-900 border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-emerald-400/80 ring-2 ring-emerald-500/40 shadow-md'
                        : 'border-white/10 opacity-60 hover:opacity-100 hover:border-white/30'
                    }`}
                  >
                    <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                    
                    {/* Checkbox indicator */}
                    <div className="absolute top-1.5 left-1.5 z-10">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-emerald-500 text-black shadow-md font-bold'
                            : 'bg-black/70 backdrop-blur-md border border-white/40 text-transparent'
                        }`}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    </div>

                    {/* Folder tag if present */}
                    {img.folderName && (
                      <div className="absolute bottom-1 left-1 right-1 px-1.5 py-0.5 rounded bg-black/85 backdrop-blur-md border border-white/10 text-[9px] text-neutral-300 truncate font-mono">
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
        <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t border-white/10">
          <div className="text-xs text-neutral-400">
            {isProcessing ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin inline-block" />
                {processProgress || 'Processing files...'}
              </span>
            ) : pendingImages.length > 0 ? (
              <span>
                Ready: <strong className="text-white">{selectedPendingIds.length}</strong> of {pendingImages.length} photos selected to save
              </span>
            ) : (
              <span>Select files or folder above to begin</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              id="btn-confirm-upload"
              type="button"
              onClick={() => handleSaveToLibrary(selectedPendingIds.length > 0 && selectedPendingIds.length < pendingImages.length)}
              disabled={pendingImages.length === 0 || isProcessing || (selectedPendingIds.length === 0)}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2 disabled:opacity-40 active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              {isProcessing
                ? 'Saving...'
                : noneSelected
                ? 'Select photos to save'
                : `Save ${selectedPendingIds.length} Photos to Studio`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
