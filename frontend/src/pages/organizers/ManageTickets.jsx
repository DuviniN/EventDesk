import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getTicketTypes, createTicketType, updateTicketType, deleteTicketType } from '../../features/tickets/ticketsApi';
import { getEvent } from '../../features/events/eventApi';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';

const defaultTypes = ['VIP', 'Premium', 'Regular', 'Early Bird', 'Student'];

const ManageTickets = () => {
  const { id: eventId } = useParams();
  const [ticketTypes, setTicketTypes] = useState([]);
  const [eventTitle, setEventTitle] = useState('');
  const [rows, setRows] = useState(() => defaultTypes.map(label => ({
    id: null,
    label,
    price: '',
    quantityTotal: '',
    description: ''
  })));
  const [loading, setLoading] = useState(false);
  const [savingAll, setSavingAll] = useState(false);

  const slugify = useMemo(() => (value) => {
    if (!value) return 'general';
    return String(value).trim().toLowerCase().replace(/\s+/g, '-');
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [eventRes, ticketsRes] = await Promise.all([
        getEvent(eventId),
        getTicketTypes(eventId)
      ]);

      const types = ticketsRes.ticketTypes || ticketsRes.ticketTypes || [];
      setTicketTypes(types);
      setEventTitle(eventRes?.event?.title || 'Event Ticket');

      setRows(prev => {
        const existingMap = new Map();
        types.forEach(tt => {
          existingMap.set(tt.tier || slugify(tt.name), {
            id: tt._id || tt.id,
            label: tt.name?.replace(/^\s+|\s+$/g, '') || tt.tier || 'Ticket',
            price: tt.price ?? '',
            quantityTotal: tt.quantityTotal ?? '',
            description: tt.description || ''
          });
        });

        const base = defaultTypes.map(label => {
          const key = slugify(label);
          return existingMap.get(key) || { id: null, label, price: '', quantityTotal: '', description: '' };
        });

        // include any additional custom tiers not in defaults
        existingMap.forEach((val, key) => {
          const already = base.find(r => slugify(r.label) === key);
          if (!already) base.push(val);
        });

        return base;
      });
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  useEffect(() => { if (eventId) load(); }, [eventId]);

  const handleSaveAll = async () => {
    if (savingAll) return;
    setSavingAll(true);
    try {
      const jobs = [];

      rows.forEach(row => {
        const hasInput = row && (row.price !== '' || row.quantityTotal !== '' || row.description || row.label);
        if (!hasInput) return;

        const payload = {
          name: `${eventTitle || 'Event Ticket'}${row.label ? ` - ${row.label}` : ''}`,
          tier: slugify(row.label || 'ticket'),
          price: row.price === '' ? 0 : Number(row.price),
          quantityTotal: row.quantityTotal === '' ? 0 : Number(row.quantityTotal),
          description: row.description || ''
        };

        if (row.id) {
          jobs.push(updateTicketType(eventId, row.id, payload));
        } else {
          jobs.push(createTicketType(eventId, payload));
        }
      });

      await Promise.all(jobs);
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingAll(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2 bg-gradient-to-r from-purple-900/40 via-gray-900 to-gray-900 rounded-2xl border border-gray-800 px-6 py-5 shadow-xl shadow-black/30">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-purple-300">Tickets</p>
            <h1 className="text-3xl font-bold text-white">{eventTitle || 'Event Tickets'}</h1>
            <p className="text-sm text-gray-400">Add ticket types for this event, set price/quantity, and save in one go.</p>
          </div>
          <Button onClick={handleSaveAll} disabled={savingAll}>
            {savingAll ? 'Saving…' : 'Save all ticket types'}
          </Button>
        </div>
        <div className="text-xs text-gray-500">Ticket names will use the event title with your type label. Add rules/notes per type below.</div>
      </div>

      {/* Bulk tier editor */}
      <Card className="p-5 bg-gray-900 border border-gray-800 shadow-lg shadow-black/25">
        <div className="flex items-center justify-between mb-4">
          <p className="text-white font-semibold">Ticket types</p>
          <Button onClick={() => setRows(r => [...r, { id: null, label: 'New Type', price: '', quantityTotal: '', description: '' }])}>
            Add ticket type
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {rows.map((row, idx) => {
            const saved = Boolean(row.id);
            return (
              <div key={`${row.id || row.label || idx}-${idx}`} className="p-4 rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-950/80 to-gray-900/70 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Input
                    label="Type label"
                    placeholder="e.g. VIP, Balcony"
                    value={row.label}
                    onChange={e => setRows(prev => prev.map((r, i) => i === idx ? { ...r, label: e.target.value } : r))}
                  />
                  {saved && <span className="text-[11px] text-green-400 shrink-0">Saved</span>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={row.price === 0 ? 0 : row.price || ''}
                    onChange={e => setRows(prev => prev.map((r, i) => i === idx ? { ...r, price: e.target.value } : r))}
                  />

                  <Input
                    label="Quantity"
                    type="number"
                    min="0"
                    placeholder="200"
                    value={row.quantityTotal === 0 ? 0 : row.quantityTotal || ''}
                    onChange={e => setRows(prev => prev.map((r, i) => i === idx ? { ...r, quantityTotal: e.target.value } : r))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Rules / notes</label>
                  <textarea
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    rows={2}
                    value={row.description || ''}
                    onChange={e => setRows(prev => prev.map((r, i) => i === idx ? { ...r, description: e.target.value } : r))}
                    placeholder="Refund policy, seat info, access rules"
                  />
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Ticket name: {(eventTitle || 'Event Ticket')}{row.label ? ` - ${row.label}` : ''}</span>
                  {rows.length > defaultTypes.length && (
                    <button
                      onClick={() => setRows(prev => prev.filter((_, i) => i !== idx))}
                      className="text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-5 bg-gray-900 border border-gray-800 shadow-lg shadow-black/25">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-white font-semibold">Existing tiers</p>
            <p className="text-xs text-gray-500">Review current prices and capacity.</p>
          </div>
          {loading && <div className="text-gray-400 text-sm">Refreshing…</div>}
        </div>

        <div className="grid gap-3">
          {!loading && ticketTypes && ticketTypes.length === 0 && (
            <div className="text-sm text-gray-500">No tiers saved yet. Add details above and save.</div>
          )}

          {!loading && ticketTypes && ticketTypes.map(tt => {
            const remaining = Math.max(0, (tt.quantityTotal || 0) - (tt.quantitySold || 0));
            return (
              <div key={tt._id || tt.id} className="p-4 rounded-2xl border border-gray-800 bg-gray-950/70 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-200 border border-purple-500/20">{tt.tier || 'ticket'}</span>
                    <span className="text-white font-semibold">{tt.name}</span>
                  </div>
                  {tt.description && <p className="text-sm text-gray-400 max-w-xl">{tt.description}</p>}
                  <p className="text-sm text-gray-500">${tt.price} • {remaining} remaining</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => navigator.clipboard.writeText(tt._id || tt.id)}>Copy ID</Button>
                  <Button onClick={async () => { await deleteTicketType(eventId, tt._id || tt.id); load(); }}>Delete</Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default ManageTickets;
