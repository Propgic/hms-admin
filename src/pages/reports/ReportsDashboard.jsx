import { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Sector,
} from 'recharts';
import { TrendingUp, DollarSign, Building2, CreditCard } from 'lucide-react';
import api from '../../api/axios';
import endpoints from '../../api/endpoints';
import StatCard from '../../components/StatCard';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import { AreaGradient, BarGradient, CustomTooltip } from '../../components/charts/ChartPrimitives';
import { CHART_COLORS, PIE_PALETTE, ANIM, AXIS_TICK, GRID_STROKE } from '../../components/charts/chartConfig';
import { formatCurrency, formatCompactCurrency } from '../../utils/formatters';

const currencyFmt = (v) => formatCurrency(v);

function renderActivePieSlice(props) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;
  return (
    <g>
      <text x={cx} y={cy - 8} textAnchor="middle" fill="var(--text)" className="text-sm font-semibold">
        {payload.name}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--text-muted)" className="text-xs">
        {(percent * 100).toFixed(1)}%
      </text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} innerRadius={outerRadius + 8} outerRadius={outerRadius + 11} startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.35} />
    </g>
  );
}

export default function ReportsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePieIdx, setActivePieIdx] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const [overviewRes, revenueRes, hospitalsRes, plansRes] = await Promise.allSettled([
          api.get(endpoints.reports.overview),
          api.get(endpoints.reports.revenue),
          api.get(endpoints.reports.hospitals),
          api.get(endpoints.reports.plans),
        ]);
        setData({
          overview: overviewRes.status === 'fulfilled' ? (overviewRes.value.data.data || overviewRes.value.data) : null,
          revenue: revenueRes.status === 'fulfilled' ? (revenueRes.value.data.data || revenueRes.value.data) : null,
          hospitals: hospitalsRes.status === 'fulfilled' ? (hospitalsRes.value.data.data || hospitalsRes.value.data) : null,
          plans: plansRes.status === 'fulfilled' ? (plansRes.value.data.data || plansRes.value.data) : null,
        });
      } catch {
        setData({});
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <Spinner fullPage size="lg" />;

  const overview = data?.overview;
  const revenueData = data?.revenue || [];
  const planData = data?.plans || [];
  const hospitalData = data?.hospitals || [];

  const statCards = [
    { icon: DollarSign, label: 'Total Revenue', value: overview?.totalRevenue ?? formatCurrency(0), change: overview?.revenueGrowth ?? '', changeType: 'positive', iconBg: 'bg-green-100', iconColor: 'text-green-600' },
    { icon: Building2, label: 'Total Hospitals', value: overview?.totalHospitals ?? 0, change: overview?.hospitalGrowth ?? '', changeType: 'positive', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { icon: CreditCard, label: 'Avg Revenue / Hospital', value: overview?.avgRevenue ?? formatCurrency(0), change: overview?.avgGrowth ?? '', changeType: 'positive', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
    { icon: TrendingUp, label: 'Churn Rate', value: overview?.churnRate ?? '0%', change: overview?.churnChange ?? '', changeType: 'positive', iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600' },
  ];

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">Platform-wide performance metrics and trends</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => <StatCard key={card.label} {...card} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5 chart-fade-in">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">Revenue Trend</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Monthly revenue</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <AreaGradient id="revGrad" color={CHART_COLORS.emerald} from={0.32} />
                </defs>
                <CartesianGrid strokeDasharray="4 6" stroke={GRID_STROKE} vertical={false} />
                <XAxis dataKey="month" tick={AXIS_TICK} tickLine={false} axisLine={false} />
                <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v) => formatCompactCurrency(v)} domain={[0, 'auto']} allowDataOverflow />
                <Tooltip content={<CustomTooltip valueFormatter={currencyFmt} />} cursor={{ stroke: CHART_COLORS.emerald, strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area
                  type="monotone"
                  name="Revenue"
                  dataKey="revenue"
                  stroke={CHART_COLORS.emerald}
                  strokeWidth={2.5}
                  fill="url(#revGrad)"
                  activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff', fill: CHART_COLORS.emerald }}
                  animationDuration={ANIM.duration}
                  animationEasing={ANIM.easing}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 chart-fade-in" style={{ animationDelay: '80ms' }}>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">Plan Distribution</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Active plan breakdown</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={planData}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={84}
                  dataKey="value"
                  nameKey="name"
                  paddingAngle={3}
                  stroke="var(--surface)"
                  strokeWidth={2}
                  activeIndex={activePieIdx}
                  activeShape={renderActivePieSlice}
                  onMouseEnter={(_, i) => setActivePieIdx(i)}
                  animationDuration={ANIM.pieDuration}
                  animationEasing={ANIM.easing}
                >
                  {planData.map((_, idx) => (
                    <Cell key={idx} fill={PIE_PALETTE[idx % PIE_PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2 chart-fade-in" style={{ animationDelay: '160ms' }}>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">Hospital Growth vs Churn</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Net growth by month</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hospitalData} barGap={6} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <BarGradient id="barGrowth" color={CHART_COLORS.primary} />
                  <BarGradient id="barChurn" color={CHART_COLORS.rose} />
                </defs>
                <CartesianGrid strokeDasharray="4 6" stroke={GRID_STROKE} vertical={false} />
                <XAxis dataKey="month" tick={AXIS_TICK} tickLine={false} axisLine={false} />
                <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--surface-hover)', opacity: 0.5 }} />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)', paddingBottom: 8 }} />
                <Bar dataKey="newHospitals" name="New Hospitals" fill="url(#barGrowth)" radius={[6, 6, 0, 0]} animationDuration={ANIM.barDuration} animationEasing={ANIM.easing} />
                <Bar dataKey="churned" name="Churned" fill="url(#barChurn)" radius={[6, 6, 0, 0]} animationDuration={ANIM.barDuration} animationEasing={ANIM.easing} animationBegin={120} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
