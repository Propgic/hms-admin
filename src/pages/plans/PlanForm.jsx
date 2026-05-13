import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import endpoints from '../../api/endpoints';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { nameField, blockDigits } from '../../utils/validators';
import { getCurrencySymbol } from '../../utils/formatters';
import { usePlatformSettings } from '../../hooks/usePlatformSettings';

const featuresList = [
  'Patient Management',
  'Appointment Scheduling',
  'Prescription Management',
  'Billing & Invoicing',
  'Insurance Management',
  'Lab & Tests',
  'Inventory Management',
  'Staff Management',
  'IPD / Wards',
  'Leads / CRM',
  'Reports & Analytics',
  'AI Growth Engine',
  'AI Assistant (Ask AI)',
  'ABDM Integration',
  'Priority Support',
];

const legacyFeatureLabels = {
  abdm_integration: 'ABDM Integration',
};

function normalizeFeatures(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value)
    .filter(([, enabled]) => Boolean(enabled))
    .map(([key]) => legacyFeatureLabels[key] || key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase()));
}

const schema = z.object({
  name: nameField('Plan name'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be 0 or more'),
  durationInDays: z.coerce.number().min(1, 'Duration must be at least 1'),
  maxUsers: z.coerce.number().min(1, 'Must allow at least 1 user'),
  maxAdmins: z.coerce.number().min(1, 'Must allow at least 1 admin'),
  maxDoctors: z.coerce.number().min(0).optional(),
  maxPatients: z.coerce.number().min(0).optional(),
  trialDays: z.coerce.number().min(0).optional(),
});

export default function PlanForm({ isOpen, onClose, plan, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [features, setFeatures] = useState(() => normalizeFeatures(plan?.features));
  const isEditing = !!plan;
  const { currency } = usePlatformSettings();
  const currencySymbol = getCurrencySymbol(currency);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '', description: '', price: 0, durationInDays: 30,
      maxUsers: 10, maxAdmins: 1, maxDoctors: 5, maxPatients: 500, trialDays: 14,
    },
  });

  useEffect(() => {
    if (plan) {
      reset({
        name: plan.name || '',
        description: plan.description || '',
        price: plan.price || 0,
        durationInDays: plan.durationInDays || 30,
        maxUsers: plan.maxUsers || 10,
        maxAdmins: plan.maxAdmins || 1,
        maxDoctors: plan.maxDoctors || 5,
        maxPatients: plan.maxPatients || 500,
        trialDays: plan.trialDays || 0,
      });
    } else {
      reset({
        name: '', description: '', price: 0, durationInDays: 30,
        maxUsers: 10, maxAdmins: 1, maxDoctors: 5, maxPatients: 500, trialDays: 14,
      });
    }
  }, [plan, reset]);

  const toggleFeature = (f) => {
    setFeatures((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]);
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = { ...data, features };
      if (isEditing) {
        await api.put(endpoints.plans.update(plan.id || plan._id), payload);
        toast.success('Plan updated');
      } else {
        await api.post(endpoints.plans.create, payload);
        toast.success('Plan created');
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Plan' : 'Create Plan'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Plan Name" error={errors.name?.message} {...register('name')} onKeyDown={blockDigits} />
          <Input label={`Price (${currencySymbol}/month)`} type="number" error={errors.price?.message} {...register('price')} />
          <Input label="Duration (days)" type="number" error={errors.durationInDays?.message} {...register('durationInDays')} />
          <Input label="Trial Days" type="number" error={errors.trialDays?.message} {...register('trialDays')} />
          <Input label="Max Users" type="number" error={errors.maxUsers?.message} {...register('maxUsers')} />
          <Input label="Max Admins" type="number" error={errors.maxAdmins?.message} {...register('maxAdmins')} />
          <Input label="Max Doctors" type="number" error={errors.maxDoctors?.message} {...register('maxDoctors')} />
          <Input label="Max Patients" type="number" error={errors.maxPatients?.message} {...register('maxPatients')} />
          <div className="col-span-2">
            <Input label="Description" error={errors.description?.message} {...register('description')} />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Features</p>
          <div className="grid grid-cols-2 gap-2">
            {featuresList.map((f) => (
              <label key={f} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                <div
                  onClick={() => toggleFeature(f)}
                  className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer flex-shrink-0 ${
                    features.includes(f) ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      features.includes(f) ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </div>
                <span className="text-sm text-gray-700">{f}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>{isEditing ? 'Update' : 'Create'} Plan</Button>
        </div>
      </form>
    </Modal>
  );
}
