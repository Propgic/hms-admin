import Card from './ui/Card';

export default function StatCard({ icon: Icon, label, value, change, changeType = 'neutral', iconBg = 'bg-blue-100', iconColor = 'text-blue-600' }) {
  const changeColors = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-500',
  };

  return (
    <Card className="flex items-start gap-4 p-4">
      <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-semibold text-gray-900 mt-0.5">{value}</p>
        {change && (
          <p className={`text-xs mt-1 ${changeColors[changeType]}`}>{change}</p>
        )}
      </div>
    </Card>
  );
}
