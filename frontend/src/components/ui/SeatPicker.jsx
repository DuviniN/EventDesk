import React, { useMemo, useState } from 'react';
import Button from './Button';

const seatColor = (seat) => {
  if (seat.status === 'assigned') return 'bg-red-500/80';
  if (seat.status === 'held' && !seat.hold?.mine) return 'bg-amber-500/80';
  if (seat.status === 'held' && seat.hold?.mine) return 'bg-purple-500';

  const cat = (seat.category || 'regular').toLowerCase();
  if (cat === 'vip') return 'bg-purple-600';
  if (cat === 'premium') return 'bg-purple-400';
  return 'bg-slate-700';
};

export default function SeatPicker({ layout, seats, onConfirm, confirming = false, isDark = false }) {
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const selected = useMemo(() => {
    const ids = [...selectedIds];
    return seats.filter(s => ids.includes(s._id));
  }, [seats, selectedIds]);

  const toggle = (seat) => {
    if (!seat || seat.status === 'assigned') return;
    if (seat.status === 'held' && !seat.hold?.mine) return;

    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(seat._id)) next.delete(seat._id);
      else next.add(seat._id);
      return next;
    });
  };

  const hasLayout = Boolean(layout?.assetDataUrl);

  return (
    <div className="space-y-3">
      <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
        Select your seats, then confirm to reserve them for checkout.
      </div>

      <div className={`relative w-full aspect-[16/9] overflow-hidden rounded-xl border ${isDark ? 'border-gray-800 bg-gray-950' : 'border-slate-200 bg-slate-50'}`}>
        {hasLayout ? (
          <img
            src={layout.assetDataUrl}
            alt="Venue layout"
            className="absolute inset-0 w-full h-full object-contain"
            draggable={false}
          />
        ) : (
          <div className={`absolute inset-0 flex items-center justify-center text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
            Seating map is not configured yet.
          </div>
        )}

        {seats.map((s) => {
          const left = `${(s.x || 0) * 100}%`;
          const top = `${(s.y || 0) * 100}%`;
          const isSelected = selectedIds.has(s._id);
          const ring = isSelected ? 'ring-2 ring-white' : 'ring-0';
          const opacity = s.status === 'assigned' ? 'opacity-60' : 'opacity-100';

          return (
            <button
              key={s._id}
              type="button"
              onClick={() => toggle(s)}
              className={`absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full ${seatColor(s)} ${ring} ${opacity}`}
              style={{ left, top }}
              title={s.displayLabel || 'Seat'}
            />
          );
        })}
      </div>

      <div className={`rounded-xl border p-4 ${isDark ? 'border-gray-800 bg-gray-900/40' : 'border-slate-200 bg-white'}`}>
        <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Selected seats</div>
        <div className={`text-sm mt-2 ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
          {selected.length
            ? selected.map(s => s.displayLabel || s._id).join(', ')
            : 'No seats selected.'}
        </div>
        <div className="mt-4">
          <Button
            variant="primary"
            onClick={() => onConfirm(selected.map(s => s._id))}
            disabled={confirming || selected.length === 0}
          >
            {confirming ? 'Reserving…' : 'Reserve seats'}
          </Button>
        </div>
      </div>
    </div>
  );
}
