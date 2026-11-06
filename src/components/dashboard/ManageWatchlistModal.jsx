import { useState } from 'react';
import { X, Pencil, Trash2, Plus, Check } from 'lucide-react';

/**
 * ManageWatchlistModal (Figma 1:1 Match - Node 6480:9284)
 * ---------------------------------------------------------------------------
 * Matches the user specification from Figma & screenshots:
 * - Modal header: "Manage Watchlist" with top-right Close (X) button
 * - List of watchlists with:
 *   - Drag handle icon (3 horizontal lines)
 *   - Watchlist Name & item count (e.g. "10 items")
 *   - Rename action (Pencil icon)
 *   - Delete action (Red Trash icon)
 * - Pinned Bottom Action:
 *   - "Create New Watchlist +" pill button (in signature light orange pill bg)
 */
export const ManageWatchlistModal = ({
  isOpen,
  onClose,
  watchlists = {},
  onCreateWatchlist,
  onRenameWatchlist,
  onDeleteWatchlist,
}) => {
  const [editingTab, setEditingTab] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const watchlistNames = Object.keys(watchlists);

  const handleStartRename = (name) => {
    setEditingTab(name);
    setRenameValue(name);
    setErrorMsg('');
  };

  const handleSaveRename = (oldName) => {
    const trimmed = renameValue.trim();
    if (!trimmed) {
      setErrorMsg('Name cannot be empty');
      return;
    }
    if (trimmed !== oldName && watchlists[trimmed]) {
      setErrorMsg('A watchlist with this name already exists');
      return;
    }
    if (onRenameWatchlist) {
      onRenameWatchlist(oldName, trimmed);
    }
    setEditingTab(null);
    setErrorMsg('');
  };

  const handleCreateSubmit = (e) => {
    e?.preventDefault();
    const trimmed = newWatchlistName.trim();
    if (!trimmed) {
      setErrorMsg('Watchlist name cannot be empty');
      return;
    }
    if (watchlists[trimmed]) {
      setErrorMsg('A watchlist with this name already exists');
      return;
    }
    if (onCreateWatchlist) {
      onCreateWatchlist(trimmed);
    }
    setNewWatchlistName('');
    setIsCreatingNew(false);
    setErrorMsg('');
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150 select-none font-['Poppins',sans-serif]"
    >
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
            Manage Watchlist
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message banner */}
        {errorMsg && (
          <div className="px-6 py-2 bg-red-50 border-b border-red-100 text-xs text-[#F72F53] font-medium flex items-center justify-between">
            <span>{errorMsg}</span>
            <button
              type="button"
              onClick={() => setErrorMsg('')}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        )}

        {/* Watchlist Items List */}
        <div className="px-6 py-3 divide-y divide-gray-100 max-h-[380px] overflow-y-auto no-scrollbar">
          {watchlistNames.map((name) => {
            const count = Array.isArray(watchlists[name]) ? watchlists[name].length : 0;
            const isEditing = editingTab === name;

            return (
              <div
                key={name}
                className="py-3.5 flex items-center justify-between gap-3 group transition-colors"
              >
                {/* Left: Drag Handle (3 horizontal lines) & Watchlist Name/Count */}
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  {/* 3 Horizontal Lines Drag Handle matching Image 2 */}
                  <div
                    className="cursor-grab text-gray-400 hover:text-gray-600 flex flex-col justify-center gap-[3px] py-1 select-none shrink-0"
                    title="Drag to reorder"
                  >
                    <span className="w-4 h-[1.8px] bg-gray-400 rounded-full" />
                    <span className="w-4 h-[1.8px] bg-gray-400 rounded-full" />
                    <span className="w-4 h-[1.8px] bg-gray-400 rounded-full" />
                  </div>

                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(name);
                          if (e.key === 'Escape') setEditingTab(null);
                        }}
                        className="px-2.5 py-1 text-sm font-semibold text-gray-900 border border-[#603DC8] rounded-lg outline-none w-full max-w-[220px]"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveRename(name)}
                        className="px-2.5 py-1 bg-[#603DC8] text-white text-xs font-semibold rounded-lg hover:bg-[#5030B0] transition-colors cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingTab(null)}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm leading-snug">
                        {name}
                      </h4>
                      <span className="text-xs text-gray-400 font-normal block mt-0.5">
                        {count} {count === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Right Actions: Edit Pencil & Red Trash Can */}
                {!isEditing && (
                  <div className="flex items-center gap-3 shrink-0">
                    {/* Rename Pencil */}
                    <button
                      type="button"
                      onClick={() => handleStartRename(name)}
                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                      title="Rename Watchlist"
                    >
                      <Pencil className="w-4 h-4 stroke-[1.8]" />
                    </button>

                    {/* Red Trash Delete Button matching Image 2 */}
                    <button
                      type="button"
                      onClick={() => {
                        if (watchlistNames.length <= 1) {
                          setErrorMsg('You must have at least one watchlist');
                          return;
                        }
                        if (onDeleteWatchlist) {
                          onDeleteWatchlist(name);
                        }
                      }}
                      disabled={watchlistNames.length <= 1}
                      className={`p-1.5 rounded-lg transition-colors ${
                        watchlistNames.length <= 1
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-[#F72F53] hover:text-red-700 hover:bg-red-50 cursor-pointer'
                      }`}
                      title={watchlistNames.length <= 1 ? 'Cannot delete last remaining watchlist' : 'Delete Watchlist'}
                    >
                      <Trash2 className="w-4 h-4 stroke-[1.8]" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer / Create New Watchlist CTA */}
        <div className="px-6 py-4 border-t border-gray-100 bg-white">
          {isCreatingNew ? (
            <form onSubmit={handleCreateSubmit} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Enter watchlist name..."
                value={newWatchlistName}
                onChange={(e) => setNewWatchlistName(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs sm:text-sm border border-[#FF7A00] rounded-xl outline-none font-medium"
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#FF7A00] hover:bg-[#E06C00] text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingNew(false);
                  setNewWatchlistName('');
                  setErrorMsg('');
                }}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm font-medium rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsCreatingNew(true);
                setErrorMsg('');
              }}
              className="bg-[#FFF6ED] hover:bg-[#FFEAD8] text-[#FF7A00] font-semibold text-xs sm:text-sm px-4.5 py-2.5 rounded-full flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs active:scale-98"
            >
              <span>Create New Watchlist</span>
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageWatchlistModal;

