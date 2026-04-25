import React, { useMemo } from 'react';

function buildGoogleMapsEmbedUrl(query) {
  const q = encodeURIComponent(query || '');
  return `https://www.google.com/maps?q=${q}&output=embed`;
}

function buildGoogleMapsLink(query) {
  const q = encodeURIComponent(query || '');
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export default function GoogleMapEmbed({ venue, height = 220, isDark = false }) {
  const query = useMemo(() => {
    if (!venue) return '';
    if (typeof venue === 'string') return venue;
    return [venue.name, venue.address, venue.city].filter(Boolean).join(', ');
  }, [venue]);

  if (!query) return null;

  const embedUrl = buildGoogleMapsEmbedUrl(query);
  const linkUrl = buildGoogleMapsLink(query);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <div className={`text-sm break-words ${isDark ? 'text-gray-300' : 'text-slate-500'}`}>{query}</div>
        <a
          href={linkUrl}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-purple-600 hover:text-purple-500 whitespace-nowrap"
        >
          Open in Google Maps
        </a>
      </div>
      <div className={`w-full overflow-hidden rounded-xl border ${isDark ? 'border-gray-800' : 'border-slate-200'}`}>
        <iframe
          title="Event location"
          src={embedUrl}
          width="100%"
          height={height}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          style={{ border: 0 }}
        />
      </div>
    </div>
  );
}
