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
import Button from '../../components/ui/Button';
import { allowDigitsOnly } from '../../utils/validators';

const schema = z.object({
  question: z.string()
    .trim()
    .min(10, 'Question must be at least 10 characters')
    .max(300, 'Question cannot exceed 300 characters'),
  answer: z.string()
    .trim()
    .min(10, 'Answer must be at least 10 characters')
    .max(5000, 'Answer cannot exceed 5000 characters'),
  categoryId: z.string().min(1, 'Please select a category'),
  sortOrder: z.coerce
    .number({ invalid_type_error: 'Sort order must be a number' })
    .int('Sort order must be a whole number')
    .min(0, 'Sort order cannot be negative')
    .max(9999, 'Sort order is too large'),
  isActive: z.enum(['true', 'false'], { required_error: 'Please select a status' }),
});

export default function FAQForm({ isOpen, onClose, faq, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const isEditing = !!faq;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { question: '', answer: '', categoryId: '', sortOrder: 0, isActive: 'true' },
  });

  useEffect(() => {
    if (isOpen) {
      api.get(endpoints.faqCategories.list, { params: { limit: 100, isActive: true } })
        .then((res) => {
          const d = res.data.data || res.data;
          const list = d.categories || d.rows || d.items || (Array.isArray(d) ? d : []);
          setCategories(list.map((c) => ({ value: c.id || c._id, label: c.name })));
        })
        .catch(() => setCategories([]));
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (faq) {
      reset({
        question: faq.question || '',
        answer: faq.answer || '',
        categoryId: faq.categoryId || faq.category?.id || faq.category?._id || '',
        sortOrder: faq.sortOrder || 0,
        isActive: faq.isActive !== false ? 'true' : 'false',
      });
    } else {
      reset({ question: '', answer: '', categoryId: '', sortOrder: 0, isActive: 'true' });
    }
  }, [isOpen, faq, reset]);

  const onSubmit = async (data) => {
    setLoading(true);
    const payload = { ...data, isActive: data.isActive === 'true' };
    try {
      if (isEditing) {
        await api.put(endpoints.faqs.update(faq.id || faq._id), payload);
        toast.success('FAQ updated');
      } else {
        await api.post(endpoints.faqs.create, payload);
        toast.success('FAQ created');
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save FAQ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit FAQ' : 'Add FAQ'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input label="Question" placeholder="e.g. How do I add a new doctor?" maxLength={300} error={errors.question?.message} {...register('question')} />
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Answer</label>
          <textarea
            rows={4}
            maxLength={5000}
            placeholder="Provide a clear, complete answer..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            {...register('answer')}
          />
          {errors.answer && <p className="text-xs text-red-600">{errors.answer.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <Select
                  label="Category"
                  options={categories}
                  placeholder="Select category"
                  error={errors.categoryId?.message}
                  {...field}
                />
              )}
            />
            {categories.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">No categories yet — add one in the Categories tab.</p>
            )}
          </div>
          <Input
            label="Sort Order"
            type="number"
            min={0}
            max={9999}
            inputMode="numeric"
            onKeyDown={allowDigitsOnly}
            error={errors.sortOrder?.message}
            {...register('sortOrder')}
          />
        </div>
        <Controller
          name="isActive"
          control={control}
          render={({ field }) => (
            <Select
              label="Status"
              options={[
                { value: 'true', label: 'Published' },
                { value: 'false', label: 'Draft' },
              ]}
              error={errors.isActive?.message}
              {...field}
            />
          )}
        />
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>{isEditing ? 'Update' : 'Create'} FAQ</Button>
        </div>
      </form>
    </Modal>
  );
}
