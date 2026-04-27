import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Lock } from 'lucide-react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import endpoints from '../../api/endpoints';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'pending', label: 'Awaiting hospital' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];
const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];
const STATUS_COLOR = {
  open: 'info', pending: 'warning', resolved: 'success', closed: 'gray',
};
const PRIORITY_COLOR = {
  low: 'gray', medium: 'info', high: 'warning', urgent: 'danger',
};

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [internal, setInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(endpoints.support.get(id));
      setTicket(res.data.data || res.data);
    } catch {
      setTicket(null);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [id]);

  const updateMeta = async (patch) => {
    setSavingMeta(true);
    try {
      await api.put(endpoints.support.update(id), patch);
      toast.success('Updated');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSavingMeta(false);
    }
  };

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await api.post(endpoints.support.reply(id), { body: reply.trim(), internal });
      setReply('');
      setInternal(false);
      toast.success(internal ? 'Internal note saved' : 'Reply sent');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <Spinner fullPage />;
  if (!ticket) return <div className="text-center py-16 text-gray-500">Ticket not found.</div>;

  const isClosed = ticket.status === 'closed';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/support')} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-slate-300" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-gray-500 dark:text-slate-400">{ticket.number}</span>
            <Badge color={STATUS_COLOR[ticket.status]}>{String(ticket.status).toUpperCase()}</Badge>
            <Badge color={PRIORITY_COLOR[ticket.priority]}>{ticket.priority}</Badge>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">{ticket.subject}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="space-y-3">
            {(ticket.messages || []).map((m) => {
              const isAdmin = m.authorType === 'admin';
              return (
                <div key={m.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    m.internal
                      ? 'bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-700'
                      : isAdmin
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-slate-100'
                  }`}>
                    {m.internal && (
                      <div className="text-xs font-semibold flex items-center gap-1 mb-1 text-amber-700 dark:text-amber-300">
                        <Lock className="w-3 h-3" /> Internal note (not visible to hospital)
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{m.body}</p>
                    <div className={`text-xs mt-2 ${
                      m.internal ? 'text-amber-700 dark:text-amber-400' : isAdmin ? 'text-blue-100' : 'text-gray-500 dark:text-slate-400'
                    }`}>
                      {m.authorName || (isAdmin ? 'Support' : 'Hospital')} · {dayjs(m.createdAt).format('MMM D, h:mm A')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {!isClosed && (
            <Card className="p-4">
              <textarea
                rows={4}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder={internal ? 'Internal note (admin-only)…' : 'Type a reply…'}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  internal
                    ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 dark:text-slate-100'
                    : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-100'
                }`}
              />
              <div className="flex items-center justify-between mt-3">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    className="w-4 h-4"
                    checked={internal}
                    onChange={(e) => setInternal(e.target.checked)}
                  />
                  Internal note (only visible to admins)
                </label>
                <Button icon={Send} onClick={sendReply} loading={sending} disabled={!reply.trim()}>
                  {internal ? 'Save Note' : 'Send Reply'}
                </Button>
              </div>
            </Card>
          )}

          {isClosed && (
            <Card className="p-4 text-center text-sm text-gray-500 dark:text-slate-400">
              This ticket is closed. Re-open it from the side panel to reply.
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400 mb-3">Hospital</div>
            <div className="font-semibold text-gray-900 dark:text-slate-100">{ticket.hospital?.name || '—'}</div>
            <div className="text-sm text-gray-600 dark:text-slate-300 mt-1">{ticket.hospital?.email}</div>
            {ticket.hospital?.phone && <div className="text-sm text-gray-600 dark:text-slate-300">{ticket.hospital.phone}</div>}
          </Card>

          <Card className="p-5 space-y-3">
            <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">Properties</div>
            <Select
              label="Status"
              options={STATUS_OPTIONS}
              value={ticket.status}
              onChange={(v) => updateMeta({ status: v })}
              isDisabled={savingMeta}
            />
            <Select
              label="Priority"
              options={PRIORITY_OPTIONS}
              value={ticket.priority}
              onChange={(v) => updateMeta({ priority: v })}
              isDisabled={savingMeta}
            />
            {ticket.category && (
              <div>
                <div className="text-xs text-gray-500 dark:text-slate-400">Category</div>
                <div className="text-sm dark:text-slate-100">{ticket.category}</div>
              </div>
            )}
            <div>
              <div className="text-xs text-gray-500 dark:text-slate-400">Opened</div>
              <div className="text-sm dark:text-slate-100">{dayjs(ticket.createdAt).format('MMM D, YYYY h:mm A')}</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
