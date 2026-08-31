import React, { useState, useRef } from 'react';
import { UploadCloud, Plus, Image as ImageIcon, Trash2, X, Check, Link as LinkIcon, Sparkles } from 'lucide-react';
import { ReferenceImage, ReferenceCategory } from '../types';
import { saveMultipleCustomImages } from '../utils/indexedDB';

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
  const [selectedCategory, setSelectedCategory] = useState<ReferenceCategory>('custom');
  const [urlInput, setUrlInput] = useState('');
  const [pendingImages, setPendingImages] = useState<{ id: string; url: string; title: string; file?: File }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newPending: { id: string; url: string; title: string; file: File }[] = [];
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        const title = file.name.replace(/\.[^/.]+$/, '');
        newPending.push({
          id: `custom-img-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          url,
          title,
          file,
        });
      }
    });

    setPendingImages((prev) => [...prev, ...newPending]);
  };

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    const url = urlInput.trim();
    setPendingImages((prev) => [
      ...prev,
      {
        id: `custom-url-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        url,
        title: `Online Reference ${prev.length + 1}`,
      },
    ]);
    setUrlInput('');
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removePending = (id: string) => {
    setPendingImages((prev) => prev.filter((img) => img.id !== id));
  };

  // Convert files to base64 DataURL or store Blobs in IndexedDB
  const handleSaveToLibrary = async () => {
    if (pendingImages.length === 0) return;
    setIsProcessing(true);

    try {
      const finalImages: ReferenceImage[] = [];

      for (const item of pendingImages) {
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

        finalImages.push({
          id: item.id,
          url: finalUrl,
          title: item.title,
          category: selectedCategory,
          tags: ['custom', selectedCategory, 'uploaded'],
          isCustom: true,
          dateAdded: Date.now(),
        });
      }

      await saveMultipleCustomImages(finalImages);
      onImagesUploaded(finalImages);
      setPendingImages([]);
      onClose();
    } catch (err) {
      console.error('Failed to save uploaded images', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl backdrop-blur-2xl bg-[#0c0c10]/95 border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl text-neutral-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Upload Artist Reference Photos</h2>
              <p className="text-xs text-neutral-400">Add personal life drawing photos, anatomical poses, or character models</p>
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

        {/* Drag & Drop Upload Box */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
            dragActive
              ? 'border-emerald-400 bg-emerald-500/10'
              : 'border-white/15 hover:border-white/30 bg-white/[0.02] hover:bg-white/[0.05]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 mb-3 shadow-inner">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-neutral-200 mb-1">
            Click to upload photos or drag & drop here
          </p>
          <p className="text-xs text-neutral-400">
            Supports multiple JPG, PNG, WEBP files. Stored securely in your local browser library.
          </p>
        </div>

        {/* Or Paste Image URL */}
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

        {/* Category Selection for Uploaded Set */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between flex-wrap gap-2 text-xs">
          <span className="font-semibold text-neutral-300">Assign Category:</span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'custom', label: 'Custom' },
              { id: 'figures', label: 'Figures' },
              { id: 'action', label: 'Action & Dance' },
              { id: 'hands_feet', label: 'Hands/Feet' },
              { id: 'portraits', label: 'Portraits' },
              { id: 'animals', label: 'Animals' },
              { id: 'drapery', label: 'Drapery' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id as ReferenceCategory)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                    : 'bg-white/5 text-neutral-400 hover:text-neutral-200 border border-transparent'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preview of Pending Uploads */}
        {pendingImages.length > 0 && (
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-300">
              <span>Ready to Import ({pendingImages.length} images)</span>
              <button
                type="button"
                onClick={() => setPendingImages([])}
                className="text-rose-400 hover:text-rose-300 text-[11px]"
              >
                Clear all
              </button>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 max-h-48 overflow-y-auto p-1">
              {pendingImages.map((img) => (
                <div
                  key={img.id}
                  className="relative group aspect-square rounded-xl overflow-hidden bg-neutral-900 border border-white/10 shadow-sm"
                >
                  <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePending(img.id)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-950"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-white/10">
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
            onClick={handleSaveToLibrary}
            disabled={pendingImages.length === 0 || isProcessing}
            className="px-6 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs shadow-lg transition-all flex items-center gap-2 disabled:opacity-40"
          >
            <Check className="w-4 h-4" />
            {isProcessing ? 'Saving to Library...' : `Save ${pendingImages.length} Photos to Studio`}
          </button>
        </div>
      </div>
    </div>
  );
};
