import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import endpoints from '../../api/endpoints';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().min(5, 'Pincode is required'),
  planId: z.string().optional(),
  isActive: z.boolean().optional(),
  adminName: z.string().optional(),
  adminEmail: z.string().email('Invalid admin email').optional().or(z.literal('')),
  adminPassword: z.string().min(6, 'Min 6 characters').optional().or(z.literal('')),
});

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
];

export default function HospitalForm({ isOpen, onClose, hospital, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [fullHospital, setFullHospital] = useState(null);
  const isEditing = !!hospital;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '', email: '', phone: '', address: '', city: '', state: '', pincode: '',
      planId: '', isActive: true, adminName: '', adminEmail: '', adminPassword: '',
    },
  });

  const statusValue = watch('isActive') ? 'active' : 'suspended';

  useEffect(() => {
    if (isOpen) {
      api.get(endpoints.plans.list, { params: { limit: 100 } })
        .then((res) => {
          const d = res.data.data || res.data;
          const list = d.plans || d.rows || d.items || (Array.isArray(d) ? d : []);
          setPlans(list.map((p) => ({ value: p.id || p._id, label: p.name })));
        })
        .catch(() => setPlans([]));
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && hospital) {
      api.get(endpoints.hospitals.get(hospital.id || hospital._id))
        .then((res) => setFullHospital(res.data.data || res.data))
        .catch(() => setFullHospital(hospital));
    } else {
      setFullHospital(null);
    }
  }, [isOpen, hospital]);

  useEffect(() => {
    const source = fullHospital || hospital;
    if (source && isEditing) {
      reset({
        name: source.name || '',
        email: source.email || '',
        phone: source.phone || '',
        address: source.address || '',
        city: source.city || '',
        state: source.state || '',
        pincode: source.pincode || '',
        planId: source.planId || source.plan?.id || source.plan?._id || '',
        isActive: source.isActive !== undefined ? !!source.isActive : (source.status !== 'suspended'),
        adminName: source.admin?.name || '',
        adminEmail: source.admin?.email || '',
        adminPassword: '',
      });
    } else if (!isEditing) {
      reset({
        name: '', email: '', phone: '', address: '', city: '', state: '', pincode: '',
        planId: '', isActive: true, adminName: '', adminEmail: '', adminPassword: '',
      });
    }
  }, [fullHospital, hospital, isEditing, reset]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (isEditing) {
        const payload = { ...data };
        // Only send admin password if provided
        if (!payload.adminPassword) delete payload.adminPassword;
        if (!payload.adminName) delete payload.adminName;
        if (!payload.adminEmail) delete payload.adminEmail;
        await api.put(endpoints.hospitals.update(hospital.id || hospital._id), payload);
        toast.success('Hospital updated');
      } else {
        await api.post(endpoints.hospitals.create, data);
        toast.success('Hospital created');
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save hospital');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Hospital' : 'Add Hospital'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Hospital Name" error={errors.name?.message} {...register('name')} />
          <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
          <Input label="Phone" error={errors.phone?.message} {...register('phone')} />
          <Select label="Plan" options={plans} placeholder="Select a plan" error={errors.planId?.message} {...register('planId')} />
          <div className="col-span-2">
            <Input label="Address" error={errors.address?.message} {...register('address')} />
          </div>
          <Input label="City" error={errors.city?.message} {...register('city')} />
          <Input label="State" error={errors.state?.message} {...register('state')} />
          <Input label="Pincode" error={errors.pincode?.message} {...register('pincode')} />
          {isEditing && (
            <Select
              label="Status"
              options={STATUS_OPTIONS}
              value={statusValue}
              onChange={(e) => setValue('isActive', e.target.value === 'active', { shouldDirty: true })}
            />
          )}
        </div>

        <hr className="border-gray-200 dark:border-slate-700" />
        <p className="text-sm font-medium text-gray-700 dark:text-slate-200">
          {isEditing ? 'Admin Account' : 'Admin Account'}
          {isEditing && <span className="ml-2 text-xs font-normal text-gray-500 dark:text-slate-400">(leave password empty to keep unchanged)</span>}
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Admin Name" error={errors.adminName?.message} {...register('adminName')} />
          <Input label="Admin Email" type="email" error={errors.adminEmail?.message} {...register('adminEmail')} />
          <Input
            label={isEditing ? 'New Admin Password' : 'Admin Password'}
            type="password"
            placeholder={isEditing ? 'Leave blank to keep current' : ''}
            error={errors.adminPassword?.message}
            {...register('adminPassword')}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>{isEditing ? 'Update' : 'Create'} Hospital</Button>
        </div>
      </form>
    </Modal>
  );
}
