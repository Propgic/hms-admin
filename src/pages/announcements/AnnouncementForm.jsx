import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import endpoints from '../../api/endpoints';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import DatePicker from '../../components/ui/DatePicker';
import Button from '../../components/ui/Button';

const SEVERITY_OPTIONS = [
  { value: 'info', label: 'Info' },
  { value: 'success', label: 'Success' },
  { value: 'warning', label: 'Warning' },
  { value: 'critical', label: 'Critical' },
];

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'All hospitals' },
  { value: 'plan', label: 'Hospitals on specific plan(s)' },
  { value: 'hospital', label: 'Specific hospital(s)' },
];

const schema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120, 'Too long'),
  body: z.string().trim().min(1, 'Body is required').max(1000, 'Too long'),
  severity: z.enum(['info', 'success', 'warning', 'critical']),
  audience: z.enum(['all', 'plan', 'hospital']),
  planIds: z.array(z.string()).optional(),
  hospitalIds: z.array(z.string()).optional(),
  startsAt: z.string().optional().or(z.literal('')),
  endsAt: z.string().optional().or(z.literal('')),
  isActive: z.boolean(),
  ctaLabel: z.string().trim().max(40).optional().or(z.literal('')),
  ctaUrl: z.string().trim().max(500).optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  if (data.audience === 'plan' && (!data.planIds || data.planIds.length === 0)) {
    ctx.addIssue({ path: ['planIds'], code: 'custom', message: 'Select at least one plan' });
  }
  if (data.audience === 'hospital' && (!data.hospitalIds || data.hospitalIds.length === 0)) {
    ctx.addIssue({ path: ['hospitalIds'], code: 'custom', message: 'Select at least one hospital' });
  }
});

const defaults = (a) => ({
  title: a?.title || '',
  body: a?.body || '',
  severity: a?.severity || 'info',
  audience: a?.audience || 'all',
  planIds: Array.isArray(a?.planIds) ? a.planIds : [],
  hospitalIds: Array.isArray(a?.hospitalIds) ? a.hospitalIds : [],
  startsAt: a?.startsAt ? String(a.startsAt).slice(0, 10) : '',
  endsAt: a?.endsAt ? String(a.endsAt).slice(0, 10) : '',
  isActive: a?.isActive ?? true,
  ctaLabel: a?.ctaLabel || '',
  ctaUrl: a?.ctaUrl || '',
});

export default function AnnouncementForm({ isOpen, onClose, onSuccess, announcement }) {
  const isEdit = !!announcement?.id;
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [hospitals, setHospitals] = useState([]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaults(announcement),
    mode: 'onBlur',
  });

  const audience = watch('audience');

  useEffect(() => {
    if (!isOpen) return;
    reset(defaults(announcement));
  }, [isOpen, announcement, reset]);

  useEffect(() => {
    if (!isOpen) return;
    api.get(endpoints.plans.list, { params: { limit: 200 } })
      .then((res) => {
        const d = res.data.data || res.data;
        const list = d.plans || d.rows || d.items || (Array.isArray(d) ? d : []);
        setPlans(list);
      })
      .catch(() => { toast.error('Could not load plans'); setPlans([]); });
    api.get(endpoints.hospitals.list, { params: { limit: 500 } })
      .then((res) => {
        const d = res.data.data || res.data;
        const list = Array.isArray(d) ? d : (d.hospitals || d.items || d.rows || []);
        setHospitals(list);
      })
      .catch(() => { toast.error('Could not load hospitals'); setHospitals([]); });
  }, [isOpen]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const body = {
        title: data.title.trim(),
        body: data.body.trim(),
        severity: data.severity,
        audience: data.audience,
        planIds: data.audience === 'plan' ? data.planIds : null,
        hospitalIds: data.audience === 'hospital' ? data.hospitalIds : null,
        startsAt: data.startsAt || null,
        endsAt: data.endsAt || null,
        isActive: data.isActive,
        ctaLabel: data.ctaLabel || null,
        ctaUrl: data.ctaUrl || null,
      };
      if (isEdit) {
        await api.put(endpoints.announcements.update(announcement.id), body);
        toast.success('Announcement updated');
      } else {
        await api.post(endpoints.announcements.create, body);
        toast.success('Announcement published');
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || (isEdit ? 'Update failed' : 'Create failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Announcement' : 'New Announcement'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input label="Title" error={errors.title?.message} {...register('title')} />
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Body</label>
          <textarea
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...register('body')}
          />
          {errors.body && <p className="text-xs text-red-600 mt-1">{errors.body.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Controller
            control={control}
            name="severity"
            render={({ field }) => (
              <Select label="Severity" options={SEVERITY_OPTIONS} value={field.value} onChange={field.onChange} />
            )}
          />
          <Controller
            control={control}
            name="audience"
            render={({ field }) => (
              <Select label="Audience" options={AUDIENCE_OPTIONS} value={field.value} onChange={field.onChange} />
            )}
          />
        </div>

        {audience === 'plan' && (
          <Controller
            control={control}
            name="planIds"
            render={({ field }) => (
              <Select
                label="Plans"
                placeholder="Select one or more plans..."
                isMulti
                options={plans.map((p) => ({ value: p.id, label: p.name }))}
                value={Array.isArray(field.value) ? field.value : []}
                onChange={field.onChange}
                error={errors.planIds?.message}
              />
            )}
          />
        )}

        {audience === 'hospital' && (
          <Controller
            control={control}
            name="hospitalIds"
            render={({ field }) => (
              <Select
                label="Hospitals"
                placeholder="Select one or more hospitals..."
                isMulti
                options={hospitals.map((h) => ({ value: h.id, label: h.name }))}
                value={Array.isArray(field.value) ? field.value : []}
                onChange={field.onChange}
                error={errors.hospitalIds?.message}
              />
            )}
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Controller
            control={control}
            name="startsAt"
            render={({ field }) => (
              <DatePicker
                label="Starts On (optional)"
                value={field.value}
                onChange={field.onChange}
                placeholder="Now"
              />
            )}
          />
          <Controller
            control={control}
            name="endsAt"
            render={({ field }) => (
              <DatePicker
                label="Ends On (optional)"
                value={field.value}
                onChange={field.onChange}
                placeholder="No end"
              />
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="CTA Button Label (optional)" placeholder="e.g. Learn more" error={errors.ctaLabel?.message} {...register('ctaLabel')} />
          <Input label="CTA URL (optional)" placeholder="https://..." error={errors.ctaUrl?.message} {...register('ctaUrl')} />
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
          <input type="checkbox" className="w-4 h-4" {...register('isActive')} />
          Active (uncheck to hide without deleting)
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} type="button" disabled={loading}>Cancel</Button>
          <Button type="submit" loading={loading}>{isEdit ? 'Save Changes' : 'Publish'}</Button>
        </div>
      </form>
    </Modal>
  );
}
