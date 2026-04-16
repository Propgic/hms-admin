import { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, DollarSign, Building2, CreditCard } from 'lucide-react';
import api from '../../api/axios';
import endpoints from '../../api/endpoints';
import StatCard from '../../components/StatCard';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';

const COLORS = ['#2563EB', '#16A34A', '#F59E0B', '#DC2626', '#8B5CF6', '#EC4899'];

const fallbackRevenue = [
  { month: 'Jan', revenue: 12000 },
  { month: 'Feb', revenue: 15000 },
  { month: 'Mar', revenue: 18500 },
  { month: 'Apr', revenue: 22000 },
  { month: 'May', revenue: 19800 },
  { month: 'Jun', revenue: 24500 },
];

const fallbackPlanDist = [
  { name: 'Basic', value: 35 },
  { name: 'Professional', value: 45 },
  { name: 'Enterprise', value: 15 },
  { name: 'Free', value: 5 },
];

const fallbackHospitalGrowth = [
  { month: 'Jan', newHospitals: 8, churned: 2 },
  { month: 'Feb', newHospitals: 12, churned: 1 },
  { month: 'Mar', newHospitals: 15, churned: 3 },
  { month: 'Apr', newHospitals: 10, churned: 2 },
  { month: 'May', newHospitals: 18, churned: 1 },
  { month: 'Jun', newHospitals: 22, churned: 4 },
];

export default function ReportsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <Spinner className="mt-32" size="lg" />;

  const overview = data?.overview;
  const revenueData = data?.revenue || fallbackRevenue;
  const planData = data?.plans || fallbackPlanDist;
  const hospitalData = data?.hospitals || fallbackHospitalGrowth;

  const statCards = [
    { icon: DollarSign, label: 'Total Revenue', value: overview?.totalRevenue ?? '$145,200', change: overview?.revenueGrowth ?? '+18.2% YoY', changeType: 'positive', iconBg: 'bg-green-100', iconColor: 'text-green-600' },
    { icon: Building2, label: 'Total Hospitals', value: overview?.totalHospitals ?? 142, change: overview?.hospitalGrowth ?? '+22 this quarter', changeType: 'positive', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { icon: CreditCard, label: 'Avg Revenue / Hospital', value: overview?.avgRevenue ?? '$1,023', change: overview?.avgGrowth ?? '+5.4%', changeType: 'positive', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
    { icon: TrendingUp, label: 'Churn Rate', value: overview?.churnRate ?? '2.3%', change: overview?.churnChange ?? '-0.5% from last quarter', changeType: 'positive', iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Platform-wide performance metrics and trends</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => <StatCard key={card.label} {...card} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Revenue Trend</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                <Area type="monotone" dataKey="revenue" stroke="#16A34A" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Plan Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={planData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {planData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Hospital Growth vs Churn</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hospitalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                <Legend />
                <Bar dataKey="newHospitals" name="New Hospitals" fill="#2563EB" radius={[4, 4, 0, 0]} />
                <Bar dataKey="churned" name="Churned" fill="#DC2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
