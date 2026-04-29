import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Mail, Phone, MapPin, Calendar, CreditCard, Activity, Hourglass, LogIn, Hash, Receipt, Globe, BadgeCheck, User, Power } from 'lucide-react';
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

  const initials = String(hospital.name || '?')
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/hospitals')} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-slate-300" />
        </button>
        <p className="text-base text-gray-600 dark:text-slate-400">Hospital details and subscription history</p>
      </div>

      {/* Hero card */}
      <div className="rounded-lg overflow-hidden shadow-sm border border-transparent dark:border-slate-700">
        <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 px-6 py-6 sm:px-8 sm:py-8">
          <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(circle at 20% 0%, white 0, transparent 50%), radial-gradient(circle at 80% 100%, white 0, transparent 50%)' }} />
          <div className="relative flex items-start gap-4 sm:gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-lg shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge color={statusColor(hospital.status)} className="text-xs">
                  {String(hospital.status).replace('_', ' ').toUpperCase()}
                </Badge>
                {hospital.isTrial && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-xs font-medium">
                    <Hourglass className="w-3 h-3" />On Trial
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white truncate">{hospital.name}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3 text-xs sm:text-sm text-white/90">
                {hospital.slug && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/15 backdrop-blur-sm font-mono">
                    <Hash className="w-3 h-3" />{hospital.slug}
                  </span>
                )}
                {(hospital.plan?.name || hospital.planName) && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/15 backdrop-blur-sm font-medium">
                    <CreditCard className="w-3 h-3" />{hospital.plan?.name || hospital.planName}
                  </span>
                )}
                {hospital.email && (
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="w-3 h-3" />{hospital.email}
                  </span>
                )}
                {hospital.phone && (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="w-3 h-3" />{hospital.phone}
                  </span>
                )}
              </div>
            </div>
            <div className="shrink-0">
              <Button
                variant="secondary"
                icon={LogIn}
                onClick={() => setImpersonateOpen(true)}
                disabled={!hospital.isActive}
                title={hospital.isActive ? 'Sign in as this hospital' : 'Hospital is suspended'}
              >
                Login as Hospital
              </Button>
            </div>
          </div>
        </div>
      </div>

      {(hospital.health || hospital.trial) && (
        <div className={`grid grid-cols-1 ${hospital.health && hospital.trial ? 'sm:grid-cols-2' : ''} gap-4`}>
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
        <Card className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">Hospital Information</h2>
            <Building2 className="w-4 h-4 text-gray-400" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
            <InfoRow icon={Building2} iconBg="bg-blue-50" iconColor="text-blue-600" label="Name" value={hospital.name} />
            <InfoRow icon={Hash} iconBg="bg-slate-50" iconColor="text-slate-600" label="Hospital ID (tenant)" value={hospital.slug} mono />
            <InfoRow icon={Mail} iconBg="bg-purple-50" iconColor="text-purple-600" label="Email" value={hospital.email} />
            <InfoRow icon={Phone} iconBg="bg-emerald-50" iconColor="text-emerald-600" label="Phone" value={hospital.phone} />
            <InfoRow icon={CreditCard} iconBg="bg-indigo-50" iconColor="text-indigo-600" label="Plan" value={hospital.plan?.name || hospital.planName} />
            <InfoRow icon={Calendar} iconBg="bg-amber-50" iconColor="text-amber-600" label="Joined" value={dayjs(hospital.createdAt).format('MMM D, YYYY')} />
            <div className="sm:col-span-2">
              <InfoRow icon={MapPin} iconBg="bg-rose-50" iconColor="text-rose-600" label="Address" value={[hospital.address, hospital.city, hospital.state, hospital.pincode, hospital.country].filter(Boolean).join(', ')} />
            </div>
            {hospital.gstin && (
              <InfoRow icon={Receipt} iconBg="bg-yellow-50" iconColor="text-yellow-600" label="GSTIN" value={hospital.gstin} mono />
            )}
            {hospital.registrationNo && (
              <InfoRow icon={BadgeCheck} iconBg="bg-cyan-50" iconColor="text-cyan-600" label="Registration No." value={hospital.registrationNo} mono />
            )}
            {hospital.website && (
              <InfoRow icon={Globe} iconBg="bg-teal-50" iconColor="text-teal-600" label="Website" value={hospital.website} />
            )}
            <InfoRow icon={Power} iconBg={hospital.isActive ? 'bg-emerald-50' : 'bg-rose-50'} iconColor={hospital.isActive ? 'text-emerald-600' : 'text-rose-600'} label="Status" value={
              <span className={`inline-flex items-center gap-1.5 font-medium ${hospital.isActive ? 'text-emerald-600' : 'text-rose-600'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${hospital.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                {hospital.isActive ? 'Active' : 'Inactive'}
              </span>
            } />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">Admin Account</h2>
            <User className="w-4 h-4 text-gray-400" />
          </div>
          {hospital.admin ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              <InfoRow icon={User} iconBg="bg-blue-50" iconColor="text-blue-600" label="Name" value={hospital.admin.name} />
              <InfoRow icon={Mail} iconBg="bg-purple-50" iconColor="text-purple-600" label="Email" value={hospital.admin.email} />
              {hospital.admin.phone && (
                <InfoRow icon={Phone} iconBg="bg-emerald-50" iconColor="text-emerald-600" label="Phone" value={hospital.admin.phone} />
              )}
              <InfoRow icon={Calendar} iconBg="bg-amber-50" iconColor="text-amber-600" label="Created" value={dayjs(hospital.admin.createdAt).format('MMM D, YYYY')} />
              <InfoRow icon={Power} iconBg={hospital.admin.isActive ? 'bg-emerald-50' : 'bg-rose-50'} iconColor={hospital.admin.isActive ? 'text-emerald-600' : 'text-rose-600'} label="Status" value={
                <span className={`inline-flex items-center gap-1.5 font-medium ${hospital.admin.isActive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${hospital.admin.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  {hospital.admin.isActive ? 'Active' : 'Inactive'}
                </span>
              } />
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-2">
                <User className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 dark:text-slate-400">No admin account on file.</p>
            </div>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">Subscription History</h2>
          <CreditCard className="w-4 h-4 text-gray-400" />
        </div>
        {subscriptions.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-2">
              <CreditCard className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 dark:text-slate-400">No subscription history available.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {subscriptions.map((sub, idx) => {
              const isActive = sub.status === 'active';
              const isLast = idx === subscriptions.length - 1;
              return (
                <div key={sub.id || sub._id || idx} className="flex gap-4">
                  <div className="flex flex-col items-center pt-4 shrink-0">
                    <span className={`w-3 h-3 rounded-full ring-4 ring-white dark:ring-slate-900 ${isActive ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-slate-600'}`} />
                    {!isLast && <span className="flex-1 w-px mt-1 bg-gray-200 dark:bg-slate-700" />}
                  </div>
                  <div className="flex-1 flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-gradient-to-r from-gray-50/60 to-white dark:from-slate-800/40 dark:to-slate-900 hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'bg-gray-100 dark:bg-slate-800'}`}>
                        <CreditCard className={`w-5 h-5 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">{sub.planName || sub.plan?.name || hospital.plan?.name || 'Plan'}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                          {dayjs(sub.startDate).format('MMM D, YYYY')} → {dayjs(sub.endDate).format('MMM D, YYYY')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {sub.amount != null && (
                        <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">{formatCurrency(sub.amount)}</span>
                      )}
                      <Badge color={isActive ? 'success' : 'gray'}>{sub.status}</Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

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

function InfoRow({ icon: Icon, label, value, iconBg = 'bg-gray-50', iconColor = 'text-gray-500', mono = false }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-9 h-9 rounded-lg ${iconBg} dark:bg-slate-800 flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-4 h-4 ${iconColor} dark:text-slate-300`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
        <div className={`text-sm text-gray-900 dark:text-slate-100 mt-0.5 break-words ${mono ? 'font-mono' : 'font-medium'}`}>
          {value || <span className="text-gray-400 dark:text-slate-500">—</span>}
        </div>
      </div>
    </div>
  );
}
