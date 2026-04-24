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
import { blockDigits, allowDigitsOnly } from '../../utils/validators';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CATEGORY_NAME_PATTERN = /^[A-Za-z][A-Za-z\s&/,.'()\-]*$/;

const schema = z.object({
  name: z.string()
    .trim()
    .min(2, 'Category name must be at least 2 characters')
    .max(60, 'Category name cannot exceed 60 characters')
    .regex(CATEGORY_NAME_PATTERN, 'Category name can only contain letters, spaces, and & / , . \' ( ) -'),
  slug: z.string()
    .trim()
    .max(80, 'Slug cannot exceed 80 characters')
    .refine((v) => !v || SLUG_PATTERN.test(v), 'Slug must be lowercase letters, numbers, and hyphens only')
    .optional(),
  description: z.string()
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description cannot exceed 500 characters'),
  sortOrder: z.coerce
    .number({ invalid_type_error: 'Sort order must be a number' })
    .int('Sort order must be a whole number')
    .min(0, 'Sort order cannot be negative')
    .max(9999, 'Sort order is too large'),
  isActive: z.enum(['true', 'false'], { required_error: 'Please select a status' }),
});

export default function FAQCategoryForm({ isOpen, onClose, category, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!category;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', slug: '', description: '', sortOrder: 0, isActive: 'true' },
  });

  useEffect(() => {
    if (!isOpen) return;
    if (category) {
      reset({
        name: category.name || '',
        slug: category.slug || '',
        description: category.description || '',
        sortOrder: category.sortOrder || 0,
        isActive: category.isActive !== false ? 'true' : 'false',
      });
    } else {
      reset({ name: '', slug: '', description: '', sortOrder: 0, isActive: 'true' });
    }
  }, [isOpen, category, reset]);

  const onSubmit = async (data) => {
    setLoading(true);
    const payload = { ...data, isActive: data.isActive === 'true' };
    try {
      if (isEditing) {
        await api.put(endpoints.faqCategories.update(category.id || category._id), payload);
        toast.success('Category updated');
      } else {
        await api.post(endpoints.faqCategories.create, payload);
        toast.success('Category created');
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Category' : 'Add Category'} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Category Name"
          placeholder="e.g. General"
          maxLength={60}
          error={errors.name?.message}
          onKeyDown={blockDigits}
          {...register('name')}
        />
        <Input
          label="Slug"
          placeholder="auto-generated if empty"
          maxLength={80}
          error={errors.slug?.message}
          {...register('slug')}
        />
        <Input
          label="Description"
          placeholder="Short summary of what this category covers"
          maxLength={500}
          error={errors.description?.message}
          {...register('description')}
        />
        <div className="grid grid-cols-2 gap-4">
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
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <Select
                label="Status"
                options={[
                  { value: 'true', label: 'Active' },
                  { value: 'false', label: 'Inactive' },
                ]}
                error={errors.isActive?.message}
                {...field}
              />
            )}
          />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>{isEditing ? 'Update' : 'Create'} Category</Button>
        </div>
      </form>
    </Modal>
  );
}
