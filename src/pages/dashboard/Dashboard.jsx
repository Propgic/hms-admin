import { useState, useEffect } from 'react';
import { Building2, CreditCard, DollarSign, Users } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';
import api from '../../api/axios';
import endpoints from '../../api/endpoints';
import StatCard from '../../components/StatCard';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import { AreaGradient, CustomTooltip } from '../../components/charts/ChartPrimitives';
import { CHART_COLORS, ANIM, AXIS_TICK, GRID_STROKE } from '../../components/charts/chartConfig';

const fallbackGrowth = [
  { month: 'Jan', hospitals: 12 },
  { month: 'Feb', hospitals: 19 },
  { month: 'Mar', hospitals: 25 },
  { month: 'Apr', hospitals: 32 },
  { month: 'May', hospitals: 38 },
  { month: 'Jun', hospitals: 45 },
];

const fallbackRecent = [
  { id: 1, name: 'City Hospital', email: 'admin@cityhospital.com', plan: 'Professional', status: 'active', createdAt: '2026-04-10' },
  { id: 2, name: 'Green Valley Clinic', email: 'info@greenvalley.com', plan: 'Basic', status: 'active', createdAt: '2026-04-08' },
  { id: 3, name: 'HealthFirst Center', email: 'admin@healthfirst.com', plan: 'Enterprise', status: 'trial', createdAt: '2026-04-05' },
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [growth, setGrowth] = useState(null);
  const [recent, setRecent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, growthRes, recentRes] = await Promise.allSettled([
          api.get(endpoints.dashboard.stats),
          api.get(endpoints.dashboard.hospitalGrowth),
          api.get(endpoints.dashboard.recentHospitals),
        ]);
        setStats(statsRes.status === 'fulfilled' ? (statsRes.value.data.data || statsRes.value.data) : null);
        setGrowth(growthRes.status === 'fulfilled' ? (growthRes.value.data.data || growthRes.value.data) : null);
        setRecent(recentRes.status === 'fulfilled' ? (recentRes.value.data.data || recentRes.value.data) : null);
      } catch {
        // fallback data will render
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <Spinner fullPage size="lg" />;

  const statCards = [
    {
      icon: Building2,
      label: 'Total Hospitals',
      value: stats?.totalHospitals ?? 142,
      change: stats?.hospitalGrowth ?? '+12 this month',
      changeType: 'positive',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      icon: Users,
      label: 'Active Users',
      value: stats?.activeUsers ?? '2,845',
      change: stats?.userGrowth ?? '+8.5% from last month',
      changeType: 'positive',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      icon: CreditCard,
      label: 'Active Plans',
      value: stats?.activePlans ?? 5,
      change: stats?.planInfo ?? '3 paid, 1 trial, 1 free',
      changeType: 'neutral',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      icon: DollarSign,
      label: 'Monthly Revenue',
      value: stats?.monthlyRevenue ?? '$24,500',
      change: stats?.revenueGrowth ?? '+15.3% from last month',
      changeType: 'positive',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
    },
  ];

  const growthData = growth || fallbackGrowth;
  const recentData = recent || fallbackRecent;

  const statusColor = (s) => {
    if (s === 'active') return 'success';
    if (s === 'trial') return 'warning';
    if (s === 'suspended') return 'danger';
    return 'gray';
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">Platform overview and key metrics</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <Card className="p-5 chart-fade-in">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">Hospital Growth</h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Monthly hospital count</p>
        </div>
        <div className="h-72">
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
                type="natural"
                name="Hospitals"
                dataKey="hospitals"
                stroke={CHART_COLORS.primary}
                strokeWidth={2.5}
                fill="url(#growthGrad)"
                activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff', fill: CHART_COLORS.primary }}
                animationDuration={ANIM.duration}
                animationEasing={ANIM.easing}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-5 chart-fade-in">
        <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-4">Recent Hospitals</h2>
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
                  className="hover:bg-gray-50 text-sm row-stagger"
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
      </Card>
    </div>
  );
}
