import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import RoleChip from './RoleChip';
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

const getInitials = (name, fallback = '?') => {
  if (!name) return fallback;
  const parts = String(name).trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || fallback;
};

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
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
      await api.post(endpoints.support.reply(id), { body: reply.trim() });
      setReply('');
      toast.success('Reply sent');
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
    <div className="flex flex-col h-[calc(100vh-124px)]">
      <div className="flex items-center gap-3 mb-4 shrink-0">
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
          {(ticket.createdByName || ticket.createdByRole) && (
            <div className="text-xs text-gray-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
              <span>Filed by</span>
              {ticket.createdByName && <span className="font-bold text-blue-700 dark:text-blue-300">{ticket.createdByName}</span>}
              {ticket.createdByRole && <RoleChip role={ticket.createdByRole} />}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-2 flex flex-col min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-2 pb-4">
            {(ticket.messages || []).map((m) => {
              const isAdmin = m.authorType === 'admin';
              const displayName = m.authorName || (isAdmin ? 'Support' : ticket.hospital?.name || 'Hospital');
              const avatarFallback = isAdmin ? 'S' : 'H';
              const avatar = (
                <div
                  title={displayName}
                  className={`w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center shrink-0 self-end ${
                    isAdmin
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 text-gray-700 dark:bg-slate-600 dark:text-slate-100'
                  }`}
                >
                  {getInitials(displayName, avatarFallback)}
                </div>
              );
              return (
                <div key={m.id} className={`flex items-end gap-2 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                  {!isAdmin && avatar}
                  <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    isAdmin
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-slate-100'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{m.body}</p>
                    <div className={`text-xs mt-2 flex flex-wrap items-center gap-1.5 ${
                      isAdmin ? 'text-blue-100' : 'text-gray-500 dark:text-slate-400'
                    }`}>
                      <span className={`font-bold ${isAdmin ? 'text-white' : 'text-blue-700 dark:text-blue-300'}`}>{displayName}</span>
                      {!isAdmin && m.authorRole && <RoleChip role={m.authorRole} />}
                      <span>·</span>
                      <span>{dayjs(m.createdAt).format('MMM D, h:mm A')}</span>
                    </div>
                  </div>
                  {isAdmin && avatar}
                </div>
              );
            })}
          </div>

          {!isClosed && (
            <Card className="p-4 shrink-0">
              <textarea
                rows={3}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Type a reply…"
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-100"
              />
              <div className="flex items-center justify-end mt-3">
                <Button icon={Send} onClick={sendReply} loading={sending} disabled={!reply.trim()}>
                  Send Reply
                </Button>
              </div>
            </Card>
          )}

          {isClosed && (
            <Card className="p-4 shrink-0 text-center text-sm text-gray-500 dark:text-slate-400">
              This ticket is closed. Re-open it from the side panel to reply.
            </Card>
          )}
        </div>

        <div className="space-y-4 overflow-y-auto pr-1">
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
