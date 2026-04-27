import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Mail, Phone, MapPin, Calendar, CreditCard, Activity, Hourglass, LogIn } from 'lucide-react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import endpoints from '../../api/endpoints';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import StatCard from '../../components/StatCard';
import { formatCurrency } from '../../utils/formatters';

const HMS_TENANT_URL = import.meta.env.VITE_HMS_URL || 'http://localhost:3004';

export default function HospitalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hospital, setHospital] = useState(null);
  const [stats, setStats] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [impersonateOpen, setImpersonateOpen] = useState(false);
  const [impersonating, setImpersonating] = useState(false);

  const startImpersonation = async () => {
    setImpersonating(true);
    try {
      const res = await api.post(endpoints.impersonate(id));
      const data = res.data?.data || res.data;
      if (!data?.token || !data?.hospital?.slug) {
        throw new Error('Invalid impersonation response');
      }
      const url = `${HMS_TENANT_URL}/impersonate?token=${encodeURIComponent(data.token)}&slug=${encodeURIComponent(data.hospital.slug)}`;
      const win = window.open(url, '_blank', 'noopener');
      if (!win) {
        toast.error('Popup blocked — allow popups to impersonate');
      } else {
        toast.success(`Impersonating ${data.targetUser?.email || 'hospital admin'}`);
      }
      setImpersonateOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start impersonation');
    } finally {
      setImpersonating(false);
    }
  };

  useEffect(() => {
    async function load() {
      try {
        const [hRes, sRes] = await Promise.allSettled([
          api.get(endpoints.hospitals.get(id)),
          api.get(endpoints.hospitals.stats(id)),
        ]);
        if (hRes.status === 'fulfilled') {
          const h = hRes.value.data.data || hRes.value.data;
          setHospital(h);
          setSubscriptions(Array.isArray(h?.subscriptions) ? h.subscriptions : []);
        }
        if (sRes.status === 'fulfilled') setStats(sRes.value.data.data || sRes.value.data);
      } catch {
        // handled below with null checks
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <Spinner fullPage size="lg" />;
  if (!hospital) {
    return (
      <div className="text-center mt-20">
        <p className="text-gray-500">Hospital not found</p>
        <Button variant="secondary" onClick={() => navigate('/hospitals')} className="mt-4">
          Back to Hospitals
        </Button>
      </div>
    );
  }

  const statusColor = (s) => {
    const map = { active: 'success', trial: 'warning', trial_expired: 'danger', suspended: 'danger', inactive: 'gray' };
    return map[s] || 'gray';
  };

  const healthBandClass = {
    green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    yellow: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    red: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/hospitals')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{hospital.name}</h1>
          <p className="text-base text-gray-600 dark:text-slate-400">Hospital details and subscription history</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="secondary"
            icon={LogIn}
            onClick={() => setImpersonateOpen(true)}
            disabled={!hospital.isActive}
            title={hospital.isActive ? 'Sign in as this hospital' : 'Hospital is suspended'}
          >
            Login as Hospital
          </Button>
          <Badge color={statusColor(hospital.status)} className="text-sm">
            {String(hospital.status).replace('_', ' ')}
          </Badge>
        </div>
      </div>

      {(hospital.health || hospital.trial) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {hospital.health && (
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" /> Account Health
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${healthBandClass[hospital.health.band] || healthBandClass.yellow}`}>
                      <span className="w-2 h-2 rounded-full bg-current" />
                      {hospital.health.score} / 100
                    </span>
                    <span className="text-sm text-gray-500 dark:text-slate-400 uppercase">{hospital.health.band}</span>
                  </div>
                </div>
              </div>
              {hospital.health.reasons?.length > 0 && (
                <ul className="mt-3 text-xs text-gray-600 dark:text-slate-400 list-disc list-inside space-y-0.5">
                  {hospital.health.reasons.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              )}
            </Card>
          )}

          {hospital.trial && (
            <Card className="p-5">
              <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
                <Hourglass className="w-3.5 h-3.5" /> Trial Status
              </div>
              {hospital.trial.expired ? (
                <div className="mt-2 text-sm">
                  <div className="font-semibold text-rose-600 dark:text-rose-400">Trial expired</div>
                  <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    Ended {dayjs(hospital.trial.trialEndsAt).format('MMM D, YYYY')}
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-sm">
                  <div className="font-semibold text-gray-900 dark:text-slate-100">
                    {hospital.trial.daysLeft} day(s) remaining
                  </div>
                  <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    Ends {dayjs(hospital.trial.trialEndsAt).format('MMM D, YYYY')}
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Building2} label="Doctors" value={stats.totalDoctors ?? 0} iconBg="bg-blue-100" iconColor="text-blue-600" />
          <StatCard icon={Building2} label="Patients" value={stats.totalPatients ?? 0} iconBg="bg-green-100" iconColor="text-green-600" />
          <StatCard icon={Building2} label="Appointments" value={stats.totalAppointments ?? 0} iconBg="bg-purple-100" iconColor="text-purple-600" />
          <StatCard icon={CreditCard} label="Revenue" value={stats.totalRevenue ?? formatCurrency(0)} iconBg="bg-yellow-100" iconColor="text-yellow-600" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Hospital Information</h2>
          <div className="space-y-3">
            <InfoRow icon={Building2} label="Name" value={hospital.name} />
            <InfoRow icon={Mail} label="Email" value={hospital.email} />
            <InfoRow icon={Phone} label="Phone" value={hospital.phone} />
            <InfoRow icon={MapPin} label="Address" value={[hospital.address, hospital.city, hospital.state, hospital.pincode].filter(Boolean).join(', ')} />
            <InfoRow icon={Calendar} label="Joined" value={dayjs(hospital.createdAt).format('MMM D, YYYY')} />
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Subscription History</h2>
          {subscriptions.length === 0 ? (
            <p className="text-sm text-gray-500">No subscription history available.</p>
          ) : (
            <div className="space-y-3">
              {subscriptions.map((sub, idx) => (
                <div key={sub.id || sub._id || idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{sub.planName || sub.plan?.name || hospital.plan?.name || 'Plan'}</p>
                    <p className="text-xs text-gray-500">
                      {dayjs(sub.startDate).format('MMM D, YYYY')} - {dayjs(sub.endDate).format('MMM D, YYYY')}
                    </p>
                  </div>
                  <Badge color={sub.status === 'active' ? 'success' : 'gray'}>{sub.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <ConfirmDialog
        isOpen={impersonateOpen}
        onClose={() => !impersonating && setImpersonateOpen(false)}
        onConfirm={startImpersonation}
        title="Login as hospital"
        message={`A short-lived (10-minute) token will be issued to sign in as ${hospital.name}'s primary admin. The session will be logged in Activity Logs. Continue?`}
        confirmText="Open hospital app"
        variant="primary"
        loading={impersonating}
      />
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm text-gray-900">{value || '-'}</p>
      </div>
    </div>
  );
}
