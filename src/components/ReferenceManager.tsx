import React, { useState, useMemo, useRef } from 'react';
import { 
  UploadCloud, 
  Bookmark, 
  Trash2, 
  Eye, 
  Plus, 
  Folder, 
  FolderUp, 
  Image as ImageIcon, 
  CheckSquare, 
  Square,
  AlertTriangle,
  X,
  Search,
  Maximize2
} from 'lucide-react';
import { ReferenceImage, ReferenceCategory } from '../types';
import { saveMultipleCustomImages } from '../utils/indexedDB';

interface ReferenceManagerProps {
  customImages: ReferenceImage[];
  onOpenUploadModal: () => void;
  onDeleteCustomImage: (id: string) => void;
  onDeleteMultipleImages?: (ids: string[]) => void;
  onDeleteFolder?: (folderName: string) => void;
  onClearAllCustomImages?: () => void;
  onImagesUploaded?: (newImages: ReferenceImage[]) => void;
  onToggleBookmark: (imageId: string) => void;
  favoriteImageIds: string[];
}

export const ReferenceManager: React.FC<ReferenceManagerProps> = ({
  customImages,
  onOpenUploadModal,
  onDeleteCustomImage,
  onDeleteMultipleImages,
  onDeleteFolder,
  onClearAllCustomImages,
  onImagesUploaded,
  onToggleBookmark,
  favoriteImageIds,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderFilter, setSelectedFolderFilter] = useState<string>('all');
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<ReferenceImage | null>(null);

  // Confirmation Modals state
  const [isConfirmingClearAll, setIsConfirmingClearAll] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);

  // Drag & drop state for inline dropzone
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingInline, setIsProcessingInline] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (folderInputRef.current) {
      folderInputRef.current.setAttribute('webkitdirectory', '');
      folderInputRef.current.setAttribute('directory', '');
    }
  }, []);

  // Compute folders list from custom images
  const folders = useMemo(() => {
    const folderMap = new Map<string, number>();
    customImages.forEach((img) => {
      const folderTag = img.tags.find(
        (t) => t !== 'custom' && t !== 'uploaded'
      );
      if (folderTag) {
        folderMap.set(folderTag, (folderMap.get(folderTag) || 0) + 1);
      }
    });

    return Array.from(folderMap.entries()).map(([name, count]) => ({ name, count }));
  }, [customImages]);

  // Filter images by folder and search query
  const filteredImages = useMemo(() => {
    return customImages.filter((img) => {
      // Folder filter
      if (selectedFolderFilter !== 'all') {
        const hasFolder = img.tags.includes(selectedFolderFilter);
        if (!hasFolder) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = img.title.toLowerCase().includes(q);
        const matchesTag = img.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesTag) return false;
      }

      return true;
    });
  }, [customImages, selectedFolderFilter, searchQuery]);

  // Helper to process uploaded files
  const handleFiles = async (files: FileList | File[]) => {
    if (!onImagesUploaded) return;
    setIsProcessingInline(true);

    try {
      const newItems: { file: File; id: string; url: string; title: string; folderName?: string }[] = [];
      const imageFiles = Array.from(files).filter(
        (f) => f.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|svg|avif|bmp|tiff)$/i.test(f.name)
      );

      for (const file of imageFiles) {
        const url = URL.createObjectURL(file);
        const relativePath = (file as any).webkitRelativePath || '';
        let folderName = '';
        let title = file.name.replace(/\.[^/.]+$/, '');

        if (relativePath && relativePath.includes('/')) {
          const parts = relativePath.split('/');
          folderName = parts[0];
          if (parts.length > 2) {
            title = `${parts.slice(0, parts.length - 1).join(' / ')} - ${title}`;
          }
        }

        newItems.push({
          file,
          id: `custom-img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          url,
          title,
          folderName: folderName || undefined,
        });
      }

      // Convert to blob/base64 & save in IndexedDB
      const dbRecords = await Promise.all(
        newItems.map(async (item) => {
          let storageUrl = item.url;
          try {
            const buffer = await item.file.arrayBuffer();
            const blob = new Blob([buffer], { type: item.file.type || 'image/jpeg' });
            storageUrl = URL.createObjectURL(blob);
          } catch (e) {
            console.warn('Blob conversion fallback', e);
          }

          const tags = ['custom', 'uploaded'];
          if (item.folderName) {
            tags.push(item.folderName);
          }

          return {
            id: item.id,
            url: storageUrl,
            title: item.title,
            category: 'custom' as ReferenceCategory,
            tags,
            isCustom: true,
            dateAdded: Date.now(),
          };
        })
      );

      await saveMultipleCustomImages(dbRecords);
      onImagesUploaded(dbRecords);
    } catch (err) {
      console.error('Failed to process uploaded images', err);
    } finally {
      setIsProcessingInline(false);
    }
  };

  const handleBatchDelete = () => {
    if (selectedImageIds.length === 0) return;
    if (onDeleteMultipleImages) {
      onDeleteMultipleImages(selectedImageIds);
    } else {
      selectedImageIds.forEach((id) => onDeleteCustomImage(id));
    }
    setSelectedImageIds([]);
  };

  return (
    <div className="space-y-5">
      {/* Hidden File / Folder Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.png,.jpg,.jpeg,.webp,.gif,.bmp,.avif"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
          }
        }}
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
          }
        }}
      />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
              <FolderUp className="w-5 h-5 text-emerald-400" />
              Custom File & Folder Uploads
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold">
              {customImages.length} {customImages.length === 1 ? 'Reference' : 'References'}
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Upload whole folders or individual image files from your computer. Stored privately and offline in your browser.
          </p>
        </div>

        {/* Upload Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-upload-files-direct"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white font-semibold border border-white/15 backdrop-blur-md transition-all shadow-sm active:scale-95"
          >
            <ImageIcon className="w-4 h-4 text-emerald-400" />
            <span>Upload Files</span>
          </button>

          <button
            id="btn-upload-folder-direct"
            type="button"
            onClick={() => folderInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-xs text-indigo-300 hover:text-indigo-200 font-semibold border border-indigo-500/40 backdrop-blur-md transition-all shadow-sm active:scale-95"
          >
            <FolderUp className="w-4 h-4 text-indigo-400" />
            <span>Upload Folder</span>
          </button>

          {customImages.length > 0 && (
            <button
              id="btn-clear-all-library"
              type="button"
              onClick={() => setIsConfirmingClearAll(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 font-semibold transition-all"
              title="Delete all uploaded reference photos"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* Inline Drag & Drop Zone (always available or prominent when empty) */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
          }
        }}
        className={`relative rounded-2xl border-2 border-dashed transition-all p-6 text-center ${
          isDragging
            ? 'border-emerald-400 bg-emerald-500/10 scale-[1.01]'
            : customImages.length === 0
            ? 'border-white/20 bg-white/[0.02] py-10'
            : 'border-white/10 bg-white/[0.01] hover:border-white/20'
        }`}
      >
        {isProcessingInline ? (
          <div className="flex flex-col items-center justify-center space-y-2 py-4">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
            <p className="text-xs text-emerald-300 font-semibold">Processing & saving reference images...</p>
          </div>
        ) : customImages.length === 0 ? (
          <div className="flex flex-col items-center justify-center space-y-3 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-inner">
              <UploadCloud className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Drag & Drop Poses or Folders Here</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Drop reference files or entire folders anywhere in this box, or choose an upload option below.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs shadow-lg transition-all flex items-center gap-2"
              >
                <ImageIcon className="w-4 h-4" />
                Select Image Files
              </button>
              <button
                type="button"
                onClick={() => folderInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2"
              >
                <FolderUp className="w-4 h-4" />
                Select Folder
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Drop more files or folders to add to library</p>
                <p className="text-[11px] text-neutral-400">Supported formats: JPG, PNG, WEBP, GIF, AVIF</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-neutral-200 font-medium border border-white/10 transition-colors"
              >
                + Add Files
              </button>
              <button
                type="button"
                onClick={() => folderInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-xs text-indigo-300 font-medium border border-indigo-500/30 transition-colors"
              >
                + Add Folder
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filters & Folders Bar (When images exist) */}
      {customImages.length > 0 && (
        <div className="space-y-3">
          {/* Folder Chips */}
          {folders.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedFolderFilter('all')}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all border ${
                  selectedFolderFilter === 'all'
                    ? 'bg-white text-black font-bold border-white shadow-md'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-300'
                }`}
              >
                All Folders ({customImages.length})
              </button>
              {folders.map((f) => (
                <div key={f.name} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setSelectedFolderFilter(f.name)}
                    className={`px-3 py-1 rounded-l-full text-xs whitespace-nowrap transition-all border-y border-l flex items-center gap-1.5 ${
                      selectedFolderFilter === f.name
                        ? 'bg-indigo-500 text-white font-bold border-indigo-500 shadow-md'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-300'
                    }`}
                  >
                    <Folder className="w-3 h-3 text-indigo-300" />
                    <span>{f.name}</span>
                    <span className="opacity-75 font-mono text-[10px]">({f.count})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFolderToDelete(f.name)}
                    className={`px-2 py-1 rounded-r-full text-xs transition-all border-y border-r hover:bg-rose-600/80 hover:text-white ${
                      selectedFolderFilter === f.name
                        ? 'bg-indigo-500 border-indigo-500 text-indigo-200'
                        : 'bg-white/5 border-white/10 text-neutral-400'
                    }`}
                    title={`Delete folder "${f.name}"`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Search and Selection Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search uploaded references..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Batch Selection Action Bar */}
            {selectedImageIds.length > 0 ? (
              <div className="flex items-center gap-2 p-1.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs">
                <span className="text-rose-300 font-semibold px-1.5">
                  {selectedImageIds.length} selected
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedImageIds([])}
                  className="text-neutral-400 hover:text-white text-[11px] px-1.5 py-0.5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBatchDelete}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete Selected
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <button
                  type="button"
                  onClick={() => setSelectedImageIds(filteredImages.map((img) => img.id))}
                  className="hover:text-white transition-colors"
                >
                  Select All
                </button>
                <span>•</span>
                <span className="font-mono text-[11px]">
                  Showing {filteredImages.length} photos
                </span>
              </div>
            )}
          </div>

          {/* Photos Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 max-h-[520px] overflow-y-auto pr-1 no-scrollbar pt-1">
            {filteredImages.map((img) => {
              const isFav = favoriteImageIds.includes(img.id);
              const isSelected = selectedImageIds.includes(img.id);
              const folderTag = img.tags.find(
                (t) => t !== 'custom' && t !== 'uploaded'
              );

              return (
                <div
                  key={img.id}
                  onClick={() => setPreviewImage(img)}
                  className={`group relative aspect-square rounded-xl overflow-hidden bg-neutral-900 border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-rose-500 ring-2 ring-rose-500/50 shadow-md'
                      : 'border-white/10 hover:border-emerald-400/60 hover:shadow-lg'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />

                  {/* Gradient Shadow */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Top Left: Select Checkbox */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isSelected) {
                        setSelectedImageIds((prev) => prev.filter((id) => id !== img.id));
                      } else {
                        setSelectedImageIds((prev) => [...prev, img.id]);
                      }
                    }}
                    className={`absolute top-1.5 left-1.5 p-1 rounded-md transition-all ${
                      isSelected
                        ? 'bg-rose-600 text-white shadow'
                        : 'bg-black/60 text-white opacity-0 group-hover:opacity-100 hover:bg-black/90'
                    }`}
                    title={isSelected ? 'Deselect photo' : 'Select photo'}
                  >
                    {isSelected ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                  </button>

                  {/* Top Right: Bookmark Favorite Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleBookmark(img.id);
                    }}
                    className={`absolute top-1.5 right-1.5 p-1 rounded-md backdrop-blur-md transition-all ${
                      isFav
                        ? 'bg-emerald-500 text-black shadow'
                        : 'bg-black/60 text-white opacity-0 group-hover:opacity-100 hover:bg-black/90'
                    }`}
                    title={isFav ? 'Favorited' : 'Bookmark as favorite'}
                  >
                    <Bookmark className="w-3 h-3 fill-current" />
                  </button>

                  {/* Bottom: Title / Folder / Delete */}
                  <div className="absolute bottom-1.5 inset-x-1.5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] text-white truncate max-w-[70%] font-medium">
                      {folderTag ? `📁 ${folderTag}` : img.title}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCustomImage(img.id);
                        setSelectedImageIds((prev) => prev.filter((id) => id !== img.id));
                      }}
                      className="p-1 rounded-md bg-rose-600/90 text-white hover:bg-rose-500 transition-colors shadow"
                      title="Delete reference photo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full Resolution Image Lightbox Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewImage.url}
              alt={previewImage.title}
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/10"
            />
            <div className="mt-3 flex items-center justify-between w-full text-xs text-neutral-300">
              <span className="font-semibold text-white">{previewImage.title}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onToggleBookmark(previewImage.id)}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                    favoriteImageIds.includes(previewImage.id)
                      ? 'bg-emerald-500 text-black font-bold'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5 fill-current" />
                  {favoriteImageIds.includes(previewImage.id) ? 'Favorited' : 'Favorite'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteCustomImage(previewImage.id);
                    setPreviewImage(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog: Clear All Photos */}
      {isConfirmingClearAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-neutral-900 border border-rose-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete All References?</h3>
                <p className="text-xs text-neutral-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Are you sure you want to permanently delete all <b className="text-white font-semibold">{customImages.length}</b> custom reference photos and folders from your browser storage?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmingClearAll(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onClearAllCustomImages) {
                    onClearAllCustomImages();
                  } else {
                    customImages.forEach((img) => onDeleteCustomImage(img.id));
                  }
                  setIsConfirmingClearAll(false);
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/25 transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Yes, Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog: Delete Folder */}
      {folderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-neutral-900 border border-rose-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Folder & Photos?</h3>
                <p className="text-xs text-neutral-400">Folder: {folderToDelete}</p>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Are you sure you want to delete all photos in folder &ldquo;{folderToDelete}&rdquo;?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFolderToDelete(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteFolder) {
                    onDeleteFolder(folderToDelete);
                  } else {
                    const imgsInFolder = customImages.filter((img) => img.tags.includes(folderToDelete));
                    imgsInFolder.forEach((img) => onDeleteCustomImage(img.id));
                  }
                  if (selectedFolderFilter === folderToDelete) {
                    setSelectedFolderFilter('all');
                  }
                  setFolderToDelete(null);
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/25 transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Folder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
