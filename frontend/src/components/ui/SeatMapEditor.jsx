import React, { useMemo, useRef, useState } from 'react';
import Button from './Button';
import Input from './Input';

const clamp01 = (n) => Math.max(0, Math.min(1, n));

export default function SeatMapEditor({
  layout,
  initialSeats,
  onUploadAsset,
  onSaveSeats,
  saving = false,
  isDark = false
}) {
  const containerRef = useRef(null);
  const [seats, setSeats] = useState(() => initialSeats || []);
  const [selectedIndex, setSelectedIndex] = useState(null);

  const selected = selectedIndex != null ? seats[selectedIndex] : null;

  const hasLayout = Boolean(layout?.assetDataUrl);

  const handlePickFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const type = file.type || '';
    const isSvg = type.includes('svg') || file.name.toLowerCase().endsWith('.svg');
    const isImage = type.startsWith('image/');

    if (!isSvg && !isImage) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const assetDataUrl = reader.result || '';
      await onUploadAsset({
        assetType: isSvg ? 'svg' : 'image',
        assetDataUrl,
        publish: false
      });
    };
    reader.readAsDataURL(file);
  };

  const handleClickCanvas = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clamp01((e.clientX - rect.left) / rect.width);
    const y = clamp01((e.clientY - rect.top) / rect.height);

    setSeats(prev => {
      const next = [...prev, { x, y, category: 'regular', label: { section: '', row: '', number: '' }, isActive: true }];
      setSelectedIndex(next.length - 1);
      return next;
    });
  };

  const updateSelected = (patch) => {
    if (selectedIndex == null) return;
    setSeats(prev => {
      const next = [...prev];
      next[selectedIndex] = {
        ...next[selectedIndex],
        ...patch,
        label: {
          ...(next[selectedIndex].label || {}),
          ...(patch.label || {})
        }
      };
      return next;
    });
  };

  const removeSelected = () => {
    if (selectedIndex == null) return;
    setSeats(prev => {
      const next = prev.filter((_, i) => i !== selectedIndex);
      setSelectedIndex(null);
      return next;
    });
  };

  const legend = useMemo(() => ([
    { key: 'vip', label: 'VIP' },
    { key: 'premium', label: 'Premium' },
    { key: 'regular', label: 'Regular' }
  ]), []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
          Upload a venue map (SVG preferred). Click on the map to add seats. Select a seat to edit its label and category.
        </div>
        <label className="inline-flex items-center">
          <input
            type="file"
            accept="image/*,.svg"
            onChange={handlePickFile}
            className="hidden"
          />
          <span className={`px-4 py-2 rounded-lg cursor-pointer ${isDark ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white text-slate-900 border border-slate-200'} hover:border-purple-400`}>
            Upload map
          </span>
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div
            ref={containerRef}
            onClick={hasLayout ? handleClickCanvas : undefined}
            className={`relative w-full aspect-[16/9] overflow-hidden rounded-xl border ${isDark ? 'border-gray-800 bg-gray-950' : 'border-slate-200 bg-slate-50'} ${hasLayout ? 'cursor-crosshair' : 'cursor-not-allowed'}`}
          >
            {hasLayout ? (
              layout.assetType === 'svg' ? (
                <img
                  src={layout.assetDataUrl}
                  alt="Venue layout"
                  className="absolute inset-0 w-full h-full object-contain"
                  draggable={false}
                />
              ) : (
                <img
                  src={layout.assetDataUrl}
                  alt="Venue layout"
                  className="absolute inset-0 w-full h-full object-contain"
                  draggable={false}
                />
              )
            ) : (
              <div className={`absolute inset-0 flex items-center justify-center text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                Upload a venue map to start placing seats.
              </div>
            )}

            {seats.map((s, idx) => {
              const left = `${(s.x || 0) * 100}%`;
              const top = `${(s.y || 0) * 100}%`;
              const isSelected = idx === selectedIndex;
              const cat = (s.category || 'regular').toLowerCase();
              const ring = isSelected ? 'ring-2 ring-purple-500' : 'ring-0';
              const bg = cat === 'vip' ? 'bg-purple-600' : cat === 'premium' ? 'bg-purple-400' : 'bg-slate-700';
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={(ev) => { ev.stopPropagation(); setSelectedIndex(idx); }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full ${bg} ${ring}`}
                  style={{ left, top }}
                  title="Seat"
                />
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Legend:</div>
            {legend.map(l => (
              <div key={l.key} className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${l.key === 'vip' ? 'bg-purple-600' : l.key === 'premium' ? 'bg-purple-400' : 'bg-slate-700'}`} />
                <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`rounded-xl border p-4 ${isDark ? 'border-gray-800 bg-gray-900/40' : 'border-slate-200 bg-white'}`}>
          <div className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>Seat details</div>

          {selected ? (
            <div className="space-y-3">
              <Input
                label="Section"
                type="text"
                value={selected.label?.section || ''}
                onChange={(e) => updateSelected({ label: { section: e.target.value } })}
              />
              <Input
                label="Row"
                type="text"
                value={selected.label?.row || ''}
                onChange={(e) => updateSelected({ label: { row: e.target.value } })}
              />
              <Input
                label="Seat Number"
                type="text"
                value={selected.label?.number || ''}
                onChange={(e) => updateSelected({ label: { number: e.target.value } })}
              />

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
                  Category
                </label>
                <select
                  value={selected.category || 'regular'}
                  onChange={(e) => updateSelected({ category: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors ${isDark ? 'bg-gray-800 border border-gray-700 text-white' : 'bg-white border border-slate-200 text-slate-900'}`}
                >
                  <option value="vip">VIP</option>
                  <option value="premium">Premium</option>
                  <option value="regular">Regular</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Button type="button" variant="secondary" onClick={removeSelected}>Remove seat</Button>
              </div>
            </div>
          ) : (
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              Click a seat to edit it.
            </div>
          )}

          <div className="mt-6 space-y-2">
            <Button
              type="button"
              variant="primary"
              onClick={() => onSaveSeats(seats)}
              disabled={saving || !hasLayout}
            >
              {saving ? 'Saving…' : 'Save seats'}
            </Button>
            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              Tip: Keep the event in draft while editing seating.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
