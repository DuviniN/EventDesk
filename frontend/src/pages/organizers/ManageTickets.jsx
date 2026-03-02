import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getTicketTypes, createTicketType, updateTicketType, deleteTicketType } from '../../features/tickets/ticketsApi';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';

const ManageTickets = () => {
  const { id: eventId } = useParams();
  const [ticketTypes, setTicketTypes] = useState([]);
  const [form, setForm] = useState({ name: '', price: '', quantityTotal: '' });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getTicketTypes(eventId);
      setTicketTypes(res.ticketTypes || res.ticketTypes);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  useEffect(() => { if (eventId) load(); }, [eventId]);

  const handleCreate = async () => {
    try {
      const payload = { ...form, price: Number(form.price) };
      await createTicketType(eventId, payload);
      setForm({ name: '', price: '', quantityTotal: '' });
      load();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl mb-4">Manage Ticket Types</h2>
      <Card className="mb-4 p-4">
        <div className="grid grid-cols-3 gap-3">
          <Input placeholder="Name (e.g. VIP)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Price (e.g. 49.99)" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
          <Input placeholder="Quantity" value={form.quantityTotal} onChange={e => setForm({ ...form, quantityTotal: e.target.value })} />
        </div>
        <div className="mt-3">
          <Button onClick={handleCreate}>Create Ticket Type</Button>
        </div>
      </Card>

      <div className="grid gap-3">
        {loading && <div>Loading...</div>}
        {ticketTypes && ticketTypes.map(tt => (
          <Card key={tt._id || tt.id} className="p-3 flex justify-between items-center">
            <div>
              <div className="font-semibold">{tt.name}</div>
              <div className="text-sm text-gray-600">Price: {tt.price} — Remaining: {Math.max(0, (tt.quantityTotal || tt.quantityTotal) - (tt.quantitySold || 0))}</div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => navigator.clipboard.writeText(tt._id || tt.id)}>Copy ID</Button>
              <Button onClick={async () => { await deleteTicketType(eventId, tt._id || tt.id); load(); }}>Delete</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ManageTickets;
