import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Mail, Phone, MapPin, Calendar, CreditCard } from 'lucide-react';
import dayjs from 'dayjs';
import api from '../../api/axios';
import endpoints from '../../api/endpoints';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import StatCard from '../../components/StatCard';
import { formatCurrency } from '../../utils/formatters';

export default function HospitalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hospital, setHospital] = useState(null);
  const [stats, setStats] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

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
    const map = { active: 'success', trial: 'warning', suspended: 'danger', inactive: 'gray' };
    return map[s] || 'gray';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/hospitals')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{hospital.name}</h1>
          <p className="text-sm text-gray-500">Hospital details and subscription history</p>
        </div>
        <Badge color={statusColor(hospital.status)} className="ml-auto text-sm">
          {hospital.status}
        </Badge>
      </div>

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
