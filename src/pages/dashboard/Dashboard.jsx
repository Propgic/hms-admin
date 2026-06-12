import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Building2, CreditCard, DollarSign, Users, RefreshCw, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import api, { forceLogout } from '../../api/axios';
import endpoints from '../../api/endpoints';
import StatCard from '../../components/StatCard';
import Card from '../../components/ui/Card';
import {
  SupportOverviewCard,
  RecurringRevenueCard,
  PlanDistributionCard,
  UpcomingRenewalsCard,
} from '../../components/dashboard/PlatformCards';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import { AreaGradient, CustomTooltip, ChartEmpty, isEmpty } from '../../components/charts/ChartPrimitives';
import { CHART_COLORS, ANIM, AXIS_TICK, GRID_STROKE } from '../../components/charts/chartConfig';
import { formatCurrency } from '../../utils/formatters';

function unwrap(res) {
  const body = res?.value?.data;
  if (!body) return null;
  return body.data !== undefined ? body.data : body;
}

function inr(n) {
  return formatCurrency(n);
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Reshape backend's rolling 12-month growth into a Jan→Dec calendar-year axis.
// The backend returns months ordered oldest→newest ending at the current month,
// so the last (currentMonth+1) entries belong to the current calendar year.
function toCalendarYear(data) {
  const list = Array.isArray(data) ? data : [];
  const currentMonthIdx = new Date().getMonth();
  const thisYear = list.slice(-(currentMonthIdx + 1));
  const byMonth = new Map(thisYear.map((d) => [d.month, d]));
  return MONTH_NAMES.map((m) => {
    const row = byMonth.get(m);
    return row
      ? { month: m, hospitals: row.hospitals ?? 0, new: row.new ?? 0 }
      : { month: m, hospitals: null, new: null };
  });
}

// Fallback: build a stats shape from the hospitals + plans + subscriptions list endpoints
// so the dashboard still renders if /platform/dashboard/* hasn't been deployed yet.
async function buildFallbackStats() {
  const [hospitalsRes, plansRes, subsRes] = await Promise.allSettled([
    api.get(endpoints.hospitals.list, { params: { limit: 100 } }),
    api.get(endpoints.plans.list, { params: { limit: 100 } }),
    api.get('/platform/subscriptions', { params: { limit: 200 } }).catch(() => {
      // Revenue in the fallback view depends on this; warn (deduped) so the
      // monthly-revenue figure isn't silently understated.
      toast.error('Could not load subscriptions — revenue may be incomplete', { id: 'dashboard-subs-fallback' });
      return null;
    }),
  ]);

  const hospitals = hospitalsRes.status === 'fulfilled' ? (unwrap(hospitalsRes) || []) : [];
  const plans = plansRes.status === 'fulfilled' ? (unwrap(plansRes) || []) : [];
  const subs = subsRes.status === 'fulfilled' ? (unwrap(subsRes) || []) : [];

  const list = Array.isArray(hospitals) ? hospitals : (hospitals.hospitals || hospitals.rows || []);
  const planList = Array.isArray(plans) ? plans : (plans.plans || plans.rows || []);
  const subList = Array.isArray(subs) ? subs : (subs?.subscriptions || subs?.rows || []);

  const total = list.length;
  const active = list.filter((h) => h.isActive !== false && h.status !== 'suspended').length;
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const thisMonth = list.filter((h) => h.createdAt && new Date(h.createdAt) >= startOfMonth).length;
  const paid = planList.filter((p) => Number(p.price) > 0).length;
  const free = planList.filter((p) => Number(p.price) === 0).length;
  const monthlyRevenue = subList
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + Number(s.amount || 0), 0);

  // Derive recent (last 7d) directly from hospitals list
  const sevenDays = new Date();
  sevenDays.setDate(sevenDays.getDate() - 7);
  const recentList = list
    .filter((h) => h.createdAt && new Date(h.createdAt) >= sevenDays)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
    .map((h) => {
      // The /hospitals endpoint already computes a trial-aware status
      // (`trial`, `trial_expired`, `active`, `suspended`). Don't clobber it.
      const status = h.status || (h.isActive === false ? 'suspended' : (h.isTrial ? 'trial' : 'active'));
      return {
        id: h.id,
        name: h.name,
        email: h.email,
        plan: h.plan?.name || h.planName || '-',
        status,
        createdAt: h.createdAt,
      };
    });

  return {
    stats: {
      totalHospitals: total,
      activeUsers: active,
      activePlans: planList.length,
      planInfo: `${paid} paid, ${free} free`,
      hospitalGrowth: thisMonth > 0 ? `+${thisMonth} this month` : '',
      userGrowth: '',
      monthlyRevenue: inr(monthlyRevenue),
      revenueGrowth: '',
    },
    recent: recentList,
  };
}

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [growth, setGrowth] = useState(null);
  const [recent, setRecent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);

  const [fallbackReason, setFallbackReason] = useState(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const [statsRes, growthRes, recentRes] = await Promise.allSettled([
        api.get(endpoints.dashboard.stats),
        api.get(endpoints.dashboard.hospitalGrowth),
        api.get(endpoints.dashboard.recentHospitals, { params: { days: 7, limit: 5 } }),
      ]);

      const primaryStats = statsRes.status === 'fulfilled' ? unwrap(statsRes) : null;
      const primaryRecent = recentRes.status === 'fulfilled' ? unwrap(recentRes) : null;

      // If the dedicated dashboard endpoints failed or returned nothing, fall
      // back to building stats from list endpoints. Record *why* the primary
      // request failed so the banner doesn't lie about a missing endpoint
      // when the real cause is a 401, network blip, etc.
      const dashboardMissing = !primaryStats && statsRes.status !== 'fulfilled';
      if (dashboardMissing) {
        const status = statsRes.reason?.response?.status;
        const reason = status === 404
          ? 'endpoint_missing'
          : status === 401 || status === 403
            ? 'unauthorized'
            : status
              ? `http_${status}`
              : 'network';
        // If the failure was 401/403 the access token is no longer trusted
        // and the axios interceptor's refresh+retry already gave up — there
        // is nothing useful left to show. Kick the user to /login so they
        // re-authenticate instead of staring at a stale-data banner.
        if (reason === 'unauthorized') {
          forceLogout('Your session expired. Please login again.');
          return;
        }
        const fb = await buildFallbackStats();
        setStats(fb.stats);
        setRecent(fb.recent);
        setUsedFallback(true);
        setFallbackReason(reason);
      } else {
        setStats(primaryStats);
        setRecent(Array.isArray(primaryRecent) ? primaryRecent : []);
        setUsedFallback(false);
        setFallbackReason(null);
      }
      setGrowth(growthRes.status === 'fulfilled' ? (unwrap(growthRes) || []) : []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Re-fetch every time the user navigates back to the dashboard, and when the window regains focus.
  useEffect(() => { load(true); }, [load, location.key]);
  useEffect(() => {
    const onFocus = () => load(true);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  if (loading) return <Spinner fullPage size="lg" />;

  const statCards = [
    {
      icon: Building2,
      label: 'Total Hospitals',
      value: stats?.totalHospitals ?? 0,
      change: stats?.hospitalGrowth ?? '',
      changeType: 'positive',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      onClick: () => navigate('/hospitals'),
    },
    {
      icon: Users,
      label: 'Active Users',
      value: stats?.activeUsers ?? 0,
      change: stats?.userGrowth ?? '',
      changeType: 'positive',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      onClick: () => navigate('/hospitals?status=active'),
    },
    {
      icon: CreditCard,
      label: 'Active Plans',
      value: stats?.activePlans ?? 0,
      change: stats?.planInfo ?? '',
      changeType: 'neutral',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      onClick: () => navigate('/plans'),
    },
    {
      icon: DollarSign,
      label: 'Monthly Revenue',
      value: stats?.monthlyRevenue ?? formatCurrency(0),
      change: stats?.revenueGrowth ?? '',
      changeType: 'positive',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      onClick: () => navigate('/revenue'),
    },
  ];

  const growthData = toCalendarYear(growth);
  const recentData = recent || [];

  const statusColor = (s) => {
    if (s === 'active') return 'success';
    if (s === 'trial') return 'warning';
    if (s === 'trial_expired') return 'danger';
    if (s === 'suspended') return 'danger';
    return 'gray';
  };

  return (
    <div className="space-y-6 dash-anim-icons">
      {usedFallback && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 text-xs text-amber-800 dark:text-amber-200">
          {fallbackReason === 'unauthorized' && (
            <>Couldn't load the live dashboard — your session may have expired. Try logging out and back in.</>
          )}
          {fallbackReason === 'endpoint_missing' && (
            <>Dashboard endpoints (<code className="mx-1 font-mono">/platform/dashboard/*</code>) aren't registered. Restart the backend.</>
          )}
          {fallbackReason === 'network' && (
            <>Couldn't reach the backend — showing fallback stats. Check that the API server is running.</>
          )}
          {fallbackReason && !['unauthorized','endpoint_missing','network'].includes(fallbackReason) && (
            <>Dashboard request failed ({fallbackReason}) — showing fallback stats computed from the hospitals list.</>
          )}
        </div>
      )}
      <div className="flex items-center justify-between">
        <p className="text-base text-gray-600 dark:text-slate-400">Platform overview and key metrics</p>
        {/* Gradient pill refresh button. Reuses the auth-shine keyframes
            already defined in index.css (slow gradient sweep), pairs it
            with a soft blue glow on hover and a 180° icon rotation. When
            refreshing, the icon spins continuously and the shine pauses
            so the two animations don't fight each other. */}
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="group relative inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-full overflow-hidden text-white shadow-sm shadow-blue-500/30 ring-1 ring-inset ring-white/15 disabled:opacity-70 disabled:cursor-not-allowed transition active:scale-[0.97]"
          title="Refresh data"
        >
          <span
            aria-hidden
            className={`absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 bg-[length:200%_100%] ${refreshing ? '' : 'animate-[auth-shine_4s_linear_infinite]'}`}
          />
          <span aria-hidden className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
          <span aria-hidden className="absolute -inset-1 rounded-full bg-blue-500/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none -z-10" />
          <RefreshCw
            className={`relative w-3.5 h-3.5 transition-transform duration-500 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180'}`}
          />
          <span className="relative">{refreshing ? 'Refreshing…' : 'Refresh'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Platform widgets — SaaS owner's daily glance. Default CSS Grid
          items-stretch is back, so cards in a row equalize to the tallest. */}
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4">
        <SupportOverviewCard />
        <RecurringRevenueCard />
        <PlanDistributionCard />
        <UpcomingRenewalsCard />
      </div>

      <Card className="p-5 chart-fade-in">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">Hospital Growth</h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Monthly hospital count</p>
        </div>
        <div className="h-72">
          {isEmpty(growthData) || growthData.every((d) => d.hospitals == null) ? (
            <ChartEmpty icon={TrendingUp} message="No growth data" hint="Hospital onboarding will populate this chart." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <AreaGradient id="growthGrad" color={CHART_COLORS.primary} from={0.32} />
                </defs>
                <CartesianGrid strokeDasharray="4 6" stroke={GRID_STROKE} vertical={false} />
                <XAxis dataKey="month" tick={AXIS_TICK} tickLine={false} axisLine={false} />
                <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: CHART_COLORS.primary, strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area
                  type="monotone"
                  name="Hospitals"
                  dataKey="hospitals"
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2.5}
                  fill="url(#growthGrad)"
                  connectNulls={false}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff', fill: CHART_COLORS.primary }}
                  animationDuration={ANIM.duration}
                  animationEasing={ANIM.easing}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      <Card className="p-5 chart-fade-in flex flex-col" style={{ minHeight: 280 }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">Recent Hospitals</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Added in the last 7 days</p>
          </div>
        </div>
        {recentData.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <ChartEmpty icon={Building2} message="No hospitals added recently" hint="New hospitals onboarded in the last 7 days will appear here." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentData.map((h, i) => (
                  <tr
                    key={h.id || h._id}
                    onClick={() => navigate(`/hospitals/${h.id || h._id}`)}
                    className="hover:bg-gray-50 text-sm row-stagger cursor-pointer"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{h.name}</td>
                    <td className="px-4 py-3 text-gray-600">{h.email}</td>
                    <td className="px-4 py-3 text-gray-600">{h.plan || h.planName || '-'}</td>
                    <td className="px-4 py-3">
                      <Badge color={statusColor(h.status)}>{h.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{dayjs(h.createdAt).format('MMM D, YYYY')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
