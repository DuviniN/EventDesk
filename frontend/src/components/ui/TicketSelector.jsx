import React, { useState, useEffect } from 'react';
import Button from './Button';

const TicketSelector = ({ eventId, onPurchase, fetchTicketTypes }) => {
  const [ticketTypes, setTicketTypes] = useState([]);
  const [selection, setSelection] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchTicketTypes(eventId);
        setTicketTypes(res.ticketTypes || res.ticketTypes);
      } catch (err) { console.error(err); }
    };
    if (eventId) load();
  }, [eventId, fetchTicketTypes]);

  const handleChange = (id, qty) => {
    setSelection(s => ({ ...s, [id]: qty }));
  };

  const handlePurchase = () => {
    const items = Object.entries(selection).filter(([,q]) => q > 0).map(([ticketTypeId,q]) => ({ ticketTypeId, quantity: q }));
    if (items.length === 0) return alert('Pick at least one ticket');
    onPurchase({ items });
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg mb-2">Tickets</h3>
      {ticketTypes.map(tt => (
        <div key={tt.id || tt._id} className="flex items-center justify-between py-2">
          <div>
            <div className="font-medium">{tt.name}</div>
            <div className="text-sm text-gray-600">{tt.description} — ${tt.price}</div>
            <div className="text-sm">Remaining: {tt.remaining !== undefined ? tt.remaining : Math.max(0, (tt.quantityTotal || 0) - (tt.quantitySold || 0))}</div>
          </div>
          <div className="flex items-center gap-2">
            <input type="number" min="0" max={tt.maxPerOrder || 10} value={selection[tt.id || tt._id] || 0} onChange={e => handleChange(tt.id || tt._id, parseInt(e.target.value || '0'))} className="w-20 p-1 border rounded" />
            <Button onClick={() => handleChange(tt.id || tt._id, (selection[tt.id || tt._id] || 0) + 1)}>+</Button>
          </div>
        </div>
      ))}

      <div className="mt-3">
        <Button onClick={handlePurchase}>Purchase</Button>
      </div>
    </div>
  );
};

export default TicketSelector;
