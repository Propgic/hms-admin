import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import endpoints from '../../api/endpoints';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import DatePicker from '../../components/ui/DatePicker';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';

const DISCOUNT_TYPES = [
  { value: 'percent', label: 'Percentage (%)' },
  { value: 'flat', label: 'Flat amount' },
];

const CURRENCY_OPTIONS = [
  { value: 'INR', label: 'INR — Indian Rupee' },
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'AED', label: 'AED — UAE Dirham' },
];

const schema = z
  .object({
    code: z
      .string()
      .trim()
      .min(2, 'Code must be at least 2 characters')
      .max(40, 'Code is too long')
      .regex(/^[A-Z0-9_-]+$/, 'Use A–Z, 0–9, _ or - only'),
    description: z.string().trim().max(200, 'Too long').optional().or(z.literal('')),
    discountType: z.enum(['percent', 'flat']),
    discountValue: z.coerce
      .number({ invalid_type_error: 'Value must be a number' })
      .positive('Value must be greater than 0'),
    currency: z.string().trim().min(3).max(8).optional().or(z.literal('')),
    maxRedemptions: z
      .union([z.literal(''), z.coerce.number().int().min(1, 'Must be at least 1')])
      .optional(),
    expiresAt: z.string().optional().or(z.literal('')),
    appliesTo: z.array(z.string()).default([]),
    isActive: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.discountType === 'percent' && data.discountValue > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discountValue'],
        message: 'Percentage cannot exceed 100',
      });
    }
    if (data.discountType === 'flat' && !data.currency) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['currency'],
        message: 'Currency is required for flat discounts',
      });
    }
    if (data.expiresAt) {
      const d = new Date(data.expiresAt);
      if (Number.isNaN(d.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['expiresAt'],
          message: 'Invalid date',
        });
      }
    }
  });

const DEFAULTS = {
  code: '',
  description: '',
  discountType: 'percent',
  discountValue: 10,
  currency: 'INR',
  maxRedemptions: '',
  expiresAt: '',
  appliesTo: [],
  isActive: true,
};

export default function CouponForm({ isOpen, onClose, coupon, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);

  const isEditing = !!coupon;

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
  });

  const discountType = watch('discountType');

  useEffect(() => {
    if (!isOpen) return;
    api.get(endpoints.plans.list, { params: { limit: 100 } })
      .then((res) => {
        const d = res.data.data || res.data;
        const list = Array.isArray(d) ? d : (d.plans || d.rows || d.items || []);
        setPlans(list);
      })
      .catch(() => setPlans([]));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (coupon) {
      reset({
        code: coupon.code || '',
        description: coupon.description || '',
        discountType: coupon.discountType || 'percent',
        discountValue: Number(coupon.discountValue) || 0,
        currency: coupon.currency || 'INR',
        maxRedemptions: coupon.maxRedemptions ?? '',
        expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 10) : '',
        appliesTo: Array.isArray(coupon.appliesTo) ? coupon.appliesTo : [],
        isActive: coupon.isActive !== false,
      });
    } else {
      reset(DEFAULTS);
    }
  }, [coupon, isOpen, reset]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        code: data.code.trim().toUpperCase(),
        description: data.description || null,
        discountType: data.discountType,
        discountValue: Number(data.discountValue),
        currency: data.discountType === 'flat' ? data.currency : undefined,
        maxRedemptions: data.maxRedemptions === '' || data.maxRedemptions === undefined
          ? null : Number(data.maxRedemptions),
        expiresAt: data.expiresAt || null,
        appliesTo: data.appliesTo.length ? data.appliesTo : null,
        isActive: data.isActive,
      };
      if (isEditing) {
        await api.put(endpoints.coupons.update(coupon.id), payload);
        toast.success('Coupon updated');
      } else {
        await api.post(endpoints.coupons.create, payload);
        toast.success('Coupon created');
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Coupon' : 'New Coupon'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Code"
            placeholder="e.g. LAUNCH20"
            error={errors.code?.message}
            {...register('code')}
            onChange={(e) => {
              // Keep the visible value uppercase while react-hook-form tracks it.
              e.target.value = e.target.value.toUpperCase();
            }}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Status</label>
            <label className="inline-flex items-center gap-2 mt-2">
              <input type="checkbox" className="w-4 h-4" {...register('isActive')} />
              <span className="text-sm text-gray-700 dark:text-slate-300">Active</span>
            </label>
          </div>
        </div>

        <Input
          label="Description (internal)"
          placeholder="Optional — what's this coupon for?"
          error={errors.description?.message}
          {...register('description')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Controller
            control={control}
            name="discountType"
            render={({ field }) => (
              <Select
                label="Discount Type"
                options={DISCOUNT_TYPES}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.discountType?.message}
              />
            )}
          />
          <Input
            label={discountType === 'percent' ? 'Percentage' : 'Amount'}
            type="number"
            step="0.01"
            error={errors.discountValue?.message}
            {...register('discountValue')}
          />
          {discountType === 'flat' && (
            <Controller
              control={control}
              name="currency"
              render={({ field }) => (
                <Select
                  label="Currency"
                  options={CURRENCY_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.currency?.message}
                />
              )}
            />
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Max Redemptions (blank = unlimited)"
            type="number"
            min={1}
            error={errors.maxRedemptions?.message}
            {...register('maxRedemptions')}
          />
          <Controller
            control={control}
            name="expiresAt"
            render={({ field }) => (
              <DatePicker
                label="Expires On"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.expiresAt?.message}
              />
            )}
          />
        </div>

        <Controller
          control={control}
          name="appliesTo"
          render={({ field }) => {
            const toggle = (id) => {
              const curr = field.value || [];
              field.onChange(curr.includes(id) ? curr.filter((p) => p !== id) : [...curr, id]);
            };
            return (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Applies to (leave empty for all plans)
                </label>
                <div className="flex flex-wrap gap-2">
                  {plans.length === 0 && <span className="text-xs text-gray-500">No plans found</span>}
                  {plans.map((p) => {
                    const selected = (field.value || []).includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggle(p.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                          selected
                            ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                            : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700'
                        }`}
                      >
                        {p.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          }}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
          <Button type="submit" loading={loading}>{isEditing ? 'Save Changes' : 'Create Coupon'}</Button>
        </div>
      </form>
    </Modal>
  );
}
