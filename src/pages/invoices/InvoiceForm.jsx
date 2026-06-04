import { useEffect, useRef, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import endpoints from '../../api/endpoints';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import DatePicker from '../../components/ui/DatePicker';

const CURRENCY_OPTIONS = [
  { value: 'INR', label: 'INR — Indian Rupee' },
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'AED', label: 'AED — UAE Dirham' },
];

const lineItemSchema = z.object({
  description: z.string().trim().min(1, 'Description is required').max(200, 'Too long'),
  hsnCode: z.string().trim().max(16).optional().or(z.literal('')),
  quantity: z.coerce
    .number({ invalid_type_error: 'Qty must be a number' })
    .positive('Qty must be greater than 0'),
  rate: z.coerce
    .number({ invalid_type_error: 'Rate must be a number' })
    .min(0, 'Rate cannot be negative'),
});

const schema = z.object({
  hospitalId: z.string().min(1, 'Select a hospital'),
  dueDate: z.string().optional().or(z.literal('')),
  currency: z.string().min(3).max(8),
  gstRate: z.coerce
    .number({ invalid_type_error: 'GST must be a number' })
    .min(0, 'GST cannot be negative')
    .max(100, 'GST cannot exceed 100'),
  couponCode: z
    .string()
    .trim()
    .max(40, 'Coupon code too long')
    .regex(/^[A-Z0-9_-]*$/, 'Use A–Z, 0–9, _ or - only')
    .optional()
    .or(z.literal('')),
  notes: z.string().trim().max(500, 'Notes too long').optional().or(z.literal('')),
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item is required'),
});

// Quick subtotal/tax preview so the user can verify before creating the invoice.
function previewTotals(lines, gstRate) {
  const subtotal = (lines || []).reduce(
    (s, li) => s + Number(li.quantity || 0) * Number(li.rate || 0),
    0,
  );
  const taxable = Math.max(0, subtotal);
  const tax = (taxable * Number(gstRate || 0)) / 100;
  return { subtotal, taxable, tax, total: taxable + tax };
}

const DEFAULTS = (overrides = {}) => ({
  hospitalId: overrides.hospitalId || '',
  dueDate: overrides.dueDate || '',
  currency: overrides.currency || 'INR',
  gstRate: overrides.gstRate ?? 18,
  couponCode: overrides.couponCode || '',
  notes: overrides.notes || '',
  lineItems: overrides.lineItems?.length
    ? overrides.lineItems
    : [{ description: '', hsnCode: '', quantity: 1, rate: 0 }],
});

// Reduce a server invoice record into the form's value shape.
function invoiceToFormValues(inv) {
  if (!inv) return {};
  return {
    hospitalId: inv.hospitalId,
    dueDate: inv.dueDate ? String(inv.dueDate).slice(0, 10) : '',
    currency: inv.currency || 'INR',
    gstRate: Number(inv.gstRate ?? 18),
    couponCode: inv.couponCode || '',
    notes: inv.notes || '',
    lineItems: Array.isArray(inv.lineItems) && inv.lineItems.length
      ? inv.lineItems.map((li) => ({
          description: li.description || '',
          hsnCode: li.hsnCode || '',
          quantity: Number(li.quantity || 1),
          rate: Number(li.rate || 0),
        }))
      : [{ description: '', hsnCode: '', quantity: 1, rate: 0 }],
  };
}

export default function InvoiceForm({
  isOpen,
  onClose,
  onSuccess,
  defaultHospitalId,
  defaultSubscriptionId,
  defaultLines,
  invoice,
}) {
  const [loading, setLoading] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [hospitals, setHospitals] = useState([]);
  const isEdit = !!invoice?.id;
  // Tracks which CTA the user clicked so onSubmit knows whether to also issue.
  const submitActionRef = useRef('draft');

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: isEdit
      ? invoiceToFormValues(invoice)
      : DEFAULTS({ hospitalId: defaultHospitalId, lineItems: defaultLines }),
    mode: 'onBlur',
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'lineItems' });

  useEffect(() => {
    if (!isOpen) return;
    api.get(endpoints.hospitals.list, { params: { limit: 200 } })
      .then((res) => {
        const d = res.data.data || res.data;
        const list = Array.isArray(d) ? d : (d.hospitals || d.rows || d.items || []);
        setHospitals(list);
      })
      .catch(() => { toast.error('Could not load hospitals'); setHospitals([]); });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    reset(
      isEdit
        ? invoiceToFormValues(invoice)
        : DEFAULTS({ hospitalId: defaultHospitalId, lineItems: defaultLines }),
    );
  }, [isOpen, isEdit, invoice, defaultHospitalId, defaultLines, reset]);

  const watchedLines = watch('lineItems');
  const watchedGst = watch('gstRate');
  const totals = previewTotals(watchedLines, watchedGst);

  const onSubmit = async (data) => {
    const action = submitActionRef.current;
    const isIssueAction = action === 'issue';
    if (isIssueAction) setIssuing(true); else setLoading(true);
    try {
      const body = {
        hospitalId: data.hospitalId,
        subscriptionId: isEdit ? invoice.subscriptionId : (defaultSubscriptionId || null),
        dueDate: data.dueDate || null,
        currency: data.currency,
        gstRate: Number(data.gstRate),
        couponCode: data.couponCode?.trim() ? data.couponCode.trim().toUpperCase() : null,
        notes: data.notes || null,
        lineItems: data.lineItems.map((li) => ({
          description: li.description,
          hsnCode: li.hsnCode || undefined,
          quantity: Number(li.quantity || 1),
          rate: Number(li.rate || 0),
        })),
      };
      // Persist the draft first (create or update), then optionally issue.
      const saveRes = isEdit
        ? await api.put(endpoints.invoices.update(invoice.id), body)
        : await api.post(endpoints.invoices.create, body);
      const saved = saveRes.data?.data || saveRes.data;

      if (isIssueAction) {
        const issueRes = await api.post(endpoints.invoices.issue(saved.id));
        const issued = issueRes.data?.data || issueRes.data;
        toast.success(`Issued as ${issued?.number || 'invoice'}`);
      } else {
        toast.success(isEdit ? 'Draft updated' : 'Draft saved');
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          (isIssueAction ? 'Issue failed' : isEdit ? 'Update failed' : 'Create failed'),
      );
    } finally {
      setIssuing(false);
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? `Edit Draft Invoice` : 'New Invoice'} size="xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Controller
            control={control}
            name="hospitalId"
            render={({ field }) => (
              <Select
                label="Hospital"
                placeholder="Search hospital…"
                isClearable
                options={hospitals.map((h) => ({
                  value: h.id,
                  label: h.gstin ? `${h.name} · ${h.gstin}` : h.name,
                }))}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.hospitalId?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="dueDate"
            render={({ field }) => (
              <DatePicker
                label="Due Date"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.dueDate?.message}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          <Input
            label="GST Rate (%)"
            type="number"
            step="0.01"
            error={errors.gstRate?.message}
            {...register('gstRate')}
          />
          <Input
            label="Coupon (optional)"
            placeholder="e.g. LAUNCH20"
            error={errors.couponCode?.message}
            {...register('couponCode')}
            onChange={(e) => {
              e.target.value = e.target.value.toUpperCase();
            }}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Line Items</label>
            <button
              type="button"
              onClick={() => append({ description: '', hsnCode: '', quantity: 1, rate: 0 })}
              className="text-xs text-blue-600 dark:text-blue-400 inline-flex items-center gap-1 font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> Add Line
            </button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-800">
                <tr>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Description</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 dark:text-slate-400 uppercase w-28">HSN/SAC</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-gray-500 dark:text-slate-400 uppercase w-20">Qty</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-gray-500 dark:text-slate-400 uppercase w-32">Rate</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-gray-500 dark:text-slate-400 uppercase w-32">Amount</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {fields.map((f, i) => {
                  const line = watchedLines?.[i] || {};
                  const lineErrors = errors.lineItems?.[i] || {};
                  return (
                    <tr key={f.id} className="border-t border-gray-200 dark:border-slate-700 align-top">
                      <td className="px-3 py-2">
                        <input
                          className="w-full bg-transparent focus:outline-none text-sm dark:text-slate-100"
                          placeholder="e.g. Professional Plan — Apr 2026"
                          {...register(`lineItems.${i}.description`)}
                        />
                        {lineErrors.description && (
                          <p className="text-xs text-red-600 mt-1">{lineErrors.description.message}</p>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="w-full bg-transparent focus:outline-none text-sm dark:text-slate-100"
                          placeholder="998314"
                          {...register(`lineItems.${i}.hsnCode`)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          className="w-full bg-transparent text-right focus:outline-none text-sm dark:text-slate-100"
                          {...register(`lineItems.${i}.quantity`)}
                        />
                        {lineErrors.quantity && (
                          <p className="text-xs text-red-600 mt-1">{lineErrors.quantity.message}</p>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          className="w-full bg-transparent text-right focus:outline-none text-sm dark:text-slate-100"
                          {...register(`lineItems.${i}.rate`)}
                        />
                        {lineErrors.rate && (
                          <p className="text-xs text-red-600 mt-1">{lineErrors.rate.message}</p>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right text-sm dark:text-slate-100">
                        {(Number(line.quantity || 0) * Number(line.rate || 0)).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(i)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {typeof errors.lineItems?.message === 'string' && (
            <p className="text-xs text-red-600 mt-2">{errors.lineItems.message}</p>
          )}
        </div>

        <div className="flex justify-end">
          <div className="w-72 text-sm">
            <div className="flex justify-between py-1"><span className="text-gray-500 dark:text-slate-400">Subtotal</span><span className="dark:text-slate-100">{totals.subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between py-1"><span className="text-gray-500 dark:text-slate-400">GST ({Number(watchedGst || 0).toFixed(2)}%)</span><span className="dark:text-slate-100">{totals.tax.toFixed(2)}</span></div>
            <div className="flex justify-between py-1 border-t border-gray-200 dark:border-slate-700 mt-1 pt-2 font-semibold"><span className="dark:text-slate-100">Total</span><span className="dark:text-slate-100">{totals.total.toFixed(2)}</span></div>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Final CGST/SGST vs IGST split is determined by the hospital's state on the generated invoice.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Notes</label>
          <textarea
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Optional notes shown on the invoice"
            {...register('notes')}
          />
          {errors.notes && <p className="text-xs text-red-600 mt-1">{errors.notes.message}</p>}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} type="button" disabled={loading || issuing}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="secondary"
            loading={loading}
            disabled={issuing}
            onClick={() => { submitActionRef.current = 'draft'; }}
          >
            {isEdit ? 'Save Changes' : 'Save as Draft'}
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={Send}
            loading={issuing}
            disabled={loading}
            onClick={() => { submitActionRef.current = 'issue'; }}
          >
            {isEdit ? 'Save & Issue' : 'Issue Invoice'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
