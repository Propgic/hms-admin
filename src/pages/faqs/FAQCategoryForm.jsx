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
  slug: z.string().optional(),
  description: z.string().optional(),
  sortOrder: z.coerce.number().min(0).optional(),
  isActive: z.string().optional(),
});

export default function FAQCategoryForm({ isOpen, onClose, category, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!category;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', slug: '', description: '', sortOrder: 0, isActive: 'true' },
  });

  useEffect(() => {
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
  }, [category, reset]);

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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Category Name" error={errors.name?.message} {...register('name')} />
        <Input label="Slug" placeholder="auto-generated if empty" {...register('slug')} />
        <Input label="Description" {...register('description')} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Sort Order" type="number" {...register('sortOrder')} />
          <Select
            label="Status"
            options={[
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' },
            ]}
            {...register('isActive')}
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
