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
  adminName: z.string().optional(),
  adminEmail: z.string().email('Invalid admin email').optional().or(z.literal('')),
  adminPassword: z.string().min(6, 'Min 6 characters').optional().or(z.literal('')),
});

export default function HospitalForm({ isOpen, onClose, hospital, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const isEditing = !!hospital;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '', email: '', phone: '', address: '', city: '', state: '', pincode: '',
      planId: '', adminName: '', adminEmail: '', adminPassword: '',
    },
  });

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
    if (hospital) {
      reset({
        name: hospital.name || '',
        email: hospital.email || '',
        phone: hospital.phone || '',
        address: hospital.address || '',
        city: hospital.city || '',
        state: hospital.state || '',
        pincode: hospital.pincode || '',
        planId: hospital.planId || hospital.plan?.id || hospital.plan?._id || '',
        adminName: '', adminEmail: '', adminPassword: '',
      });
    } else {
      reset({
        name: '', email: '', phone: '', address: '', city: '', state: '', pincode: '',
        planId: '', adminName: '', adminEmail: '', adminPassword: '',
      });
    }
  }, [hospital, reset]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (isEditing) {
        const { adminName, adminEmail, adminPassword, ...updateData } = data;
        await api.put(endpoints.hospitals.update(hospital.id || hospital._id), updateData);
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
        </div>

        {!isEditing && (
          <>
            <hr className="border-gray-200" />
            <p className="text-sm font-medium text-gray-700">Admin Account</p>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Admin Name" error={errors.adminName?.message} {...register('adminName')} />
              <Input label="Admin Email" type="email" error={errors.adminEmail?.message} {...register('adminEmail')} />
              <Input label="Admin Password" type="password" error={errors.adminPassword?.message} {...register('adminPassword')} />
            </div>
          </>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>{isEditing ? 'Update' : 'Create'} Hospital</Button>
        </div>
      </form>
    </Modal>
  );
}
