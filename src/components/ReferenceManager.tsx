import React, { useState } from 'react';
import { 
  Check, 
  Layers, 
  UploadCloud, 
  Bookmark, 
  Sparkles, 
  Filter, 
  Trash2, 
  Eye,
  Plus
} from 'lucide-react';
import { ReferencePack, ReferenceCategory, ReferenceImage } from '../types';

interface ReferenceManagerProps {
  packs: ReferencePack[];
  customImages: ReferenceImage[];
  selectedPackIds: string[];
  onTogglePack: (packId: string) => void;
  onSelectAllPacks: () => void;
  onDeselectAllPacks: () => void;
  onOpenUploadModal: () => void;
  onDeleteCustomImage: (id: string) => void;
  onToggleBookmark: (imageId: string) => void;
  favoriteImageIds: string[];
}

export const ReferenceManager: React.FC<ReferenceManagerProps> = ({
  packs,
  customImages,
  selectedPackIds,
  onTogglePack,
  onSelectAllPacks,
  onDeselectAllPacks,
  onOpenUploadModal,
  onDeleteCustomImage,
  onToggleBookmark,
  favoriteImageIds,
}) => {
  const [activePreviewPack, setActivePreviewPack] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Sets' },
    { id: 'figures', label: 'Figures' },
    { id: 'action', label: 'Action & Dance' },
    { id: 'hands_feet', label: 'Hands/Feet' },
    { id: 'portraits', label: 'Portraits' },
    { id: 'animals', label: 'Animals' },
    { id: 'drapery', label: 'Drapery' },
    { id: 'custom', label: `Custom (${customImages.length})` },
  ];

  // Combine default packs with custom uploads pack
  const allDisplayPacks: ReferencePack[] = [
    ...packs,
    ...(customImages.length > 0
      ? [
          {
            id: 'pack-custom',
            name: 'Personal Uploads & My Models',
            description: 'Custom reference photos and life drawing class albums uploaded to local storage.',
            category: 'custom' as ReferenceCategory,
            coverUrl: customImages[0]?.url || '',
            images: customImages,
            isDefault: false,
          },
        ]
      : []),
  ];

  const filteredPacks = allDisplayPacks.filter((p) => {
    if (filterCategory === 'all') return true;
    return p.category === filterCategory;
  });

  const totalSelectedImages = allDisplayPacks
    .filter((p) => selectedPackIds.includes(p.id))
    .reduce((acc, p) => acc + p.images.length, 0);

  return (
    <div className="space-y-4">
      {/* Packs Selection Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            Diverse Reference Image Sets
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/10 border border-white/10 text-neutral-200 font-mono">
              {totalSelectedImages} active references
            </span>
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Select one or multiple curated reference sets for your drawing practice
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSelectAllPacks}
            className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-semibold"
          >
            Select All
          </button>
          <span className="text-neutral-600">•</span>
          <button
            type="button"
            onClick={onDeselectAllPacks}
            className="text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            Clear
          </button>
          <span className="text-neutral-600">•</span>
          <button
            id="btn-add-photos-inline"
            type="button"
            onClick={onOpenUploadModal}
            className="flex items-center gap-1 text-xs text-indigo-300 hover:text-indigo-200 font-semibold transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            Upload Photos
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setFilterCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap transition-all backdrop-blur-md border ${
              filterCategory === cat.id
                ? 'bg-white text-black font-bold border-white shadow-md shadow-white/10'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-300 hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Packs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredPacks.map((pack) => {
          const isSelected = selectedPackIds.includes(pack.id);
          const isCustom = pack.id === 'pack-custom';

          return (
            <div
              key={pack.id}
              onClick={() => onTogglePack(pack.id)}
              className={`group relative rounded-2xl overflow-hidden border cursor-pointer transition-all flex flex-col justify-between backdrop-blur-md ${
                isSelected
                  ? 'border-emerald-500/70 bg-emerald-500/[0.08] shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/40'
                  : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
              }`}
            >
              {/* Cover Image Banner */}
              <div className="relative h-28 w-full overflow-hidden bg-black/40">
                {pack.coverUrl ? (
                  <img
                    src={pack.coverUrl}
                    alt={pack.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-75 group-hover:opacity-90"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-600">
                    <Layers className="w-8 h-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e12] via-[#0e0e12]/40 to-transparent" />

                {/* Selection Checkbox Pill */}
                <div className="absolute top-2.5 right-2.5">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/30 scale-105'
                        : 'bg-black/60 backdrop-blur-md border border-white/20 text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </div>

                {/* Count Badge */}
                <div className="absolute bottom-2 left-2.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono text-neutral-200">
                  {pack.images.length} photos
                </div>

                {isCustom && (
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-indigo-950/80 backdrop-blur-md border border-indigo-500/50 text-[10px] font-semibold text-indigo-300">
                    My Uploads
                  </div>
                )}
              </div>

              {/* Pack Info */}
              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-neutral-100 group-hover:text-emerald-300 transition-colors">
                    {pack.name}
                  </h4>
                  <p className="text-[11px] text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
                    {pack.description}
                  </p>
                </div>

                {/* Preview Trigger */}
                <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-white/10 text-[11px]">
                  <span className={`font-semibold ${isSelected ? 'text-emerald-400' : 'text-neutral-500'}`}>
                    {isSelected ? '✓ Active in Session' : 'Click to Include'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePreviewPack(activePreviewPack === pack.id ? null : pack.id);
                    }}
                    className="text-neutral-400 hover:text-white flex items-center gap-1 hover:underline"
                  >
                    <Eye className="w-3 h-3" />
                    {activePreviewPack === pack.id ? 'Hide' : 'Preview'}
                  </button>
                </div>
              </div>

              {/* Expansion Preview Drawer */}
              {activePreviewPack === pack.id && (
                <div
                  className="p-3.5 bg-black/70 backdrop-blur-xl border-t border-white/10 space-y-2.5 animate-fade-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between text-[11px] text-neutral-300 font-semibold border-b border-white/10 pb-2">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-400" />
                      Set Gallery ({pack.images.length} photos)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          // Toggle bookmark for all images in pack
                          const allFavorited = pack.images.every((img) => favoriteImageIds.includes(img.id));
                          pack.images.forEach((img) => {
                            const isFav = favoriteImageIds.includes(img.id);
                            if (allFavorited && isFav) {
                              onToggleBookmark(img.id);
                            } else if (!allFavorited && !isFav) {
                              onToggleBookmark(img.id);
                            }
                          });
                        }}
                        className="text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
                      >
                        <Bookmark className="w-3 h-3" />
                        {pack.images.every((img) => favoriteImageIds.includes(img.id))
                          ? 'Unfavorite All'
                          : 'Favorite All Photos'}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-40 overflow-y-auto pr-1 no-scrollbar">
                    {pack.images.map((img) => {
                      const isFav = favoriteImageIds.includes(img.id);
                      return (
                        <div
                          key={img.id}
                          className="relative aspect-square rounded-lg overflow-hidden bg-neutral-900 border border-white/10 group/img shadow-sm"
                        >
                          <img src={img.url} alt={img.title} className="w-full h-full object-cover" loading="lazy" />
                          <button
                            type="button"
                            onClick={() => onToggleBookmark(img.id)}
                            className={`absolute top-1 right-1 p-1 rounded-md backdrop-blur-md transition-all ${
                              isFav ? 'bg-emerald-500 text-black shadow' : 'bg-black/70 text-white opacity-0 group-hover/img:opacity-100'
                            }`}
                            title={isFav ? 'Remove favorite' : 'Add to favorites'}
                          >
                            <Bookmark className="w-3 h-3 fill-current" />
                          </button>
                          {img.isCustom && (
                            <button
                              type="button"
                              onClick={() => onDeleteCustomImage(img.id)}
                              className="absolute bottom-1 right-1 p-1 rounded-md bg-rose-900/90 text-rose-200 opacity-0 group-hover/img:opacity-100 hover:bg-rose-800 transition-opacity"
                              title="Delete photo"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* If No custom photos yet, show inviting CTA */}
      {customImages.length === 0 && (
        <div className="p-4 rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-neutral-200 block">
                Have your own life drawing reference photos?
              </span>
              <span className="text-neutral-400">
                Upload custom poses directly into your browser storage to practice with your own reference sets.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenUploadModal}
            className="shrink-0 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-indigo-300 hover:text-white font-semibold border border-white/15 backdrop-blur-md transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Upload My Photos
          </button>
        </div>
      )}
    </div>
  );
};
