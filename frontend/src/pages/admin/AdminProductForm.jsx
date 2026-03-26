import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../hooks/useAuth';
import { useProductsModel } from '../../context/ProductsContext';
import { productApi } from '../../utils/productApi';
import { resolveProductImageUrl } from '../../utils/runtimeConfig';
import { validateRequired } from '../../utils/validators';

const genderOptions = ['Girls', 'Boys', 'Men', 'Women', 'Unisex'];

const initialForm = {
  name: '',
  description: '',
  price: '',
  discount: '',
  gender: 'Women',
  availableSizes: 'Free Size, XS, S, M, L, XL',
  availableColors: 'Black, White, Navy, Beige',
};

const AdminProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const { token } = useAuth();
  const { refreshMongoProducts } = useProductsModel();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [existingProduct, setExistingProduct] = useState(null);

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);

      try {
        const response = await productApi.getProductById(id);
        setExistingProduct(response);
        setForm({
          name: response.name || '',
          description: response.description || '',
          price: response.price ?? '',
          discount: response.discount ?? '',
          gender: response.gender || 'Women',
          availableSizes: (response.availableSizes || []).join(', '),
          availableColors: (response.availableColors || []).join(', '),
        });
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (isEditMode) {
      loadProduct();
    }
  }, [id, isEditMode]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleFileChange = (event) => {
    setImageFile(event.target.files?.[0] || null);
  };

  const imagePreview = useMemo(() => {
    if (imageFile) {
      return URL.createObjectURL(imageFile);
    }

    if (existingProduct) {
      return resolveProductImageUrl(existingProduct);
    }

    return '';
  }, [existingProduct, imageFile]);

  useEffect(() => {
    return () => {
      if (imagePreview && imageFile) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imageFile, imagePreview]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateRequired(form.name) || !validateRequired(form.description)) {
      toast.error('Name and description are required.');
      return;
    }

    if (form.price === '' || Number.isNaN(Number(form.price))) {
      toast.error('Price must be a valid number.');
      return;
    }

    if (form.discount === '' || Number.isNaN(Number(form.discount))) {
      toast.error('Discount must be a valid number.');
      return;
    }

    if (!isEditMode && !imageFile) {
      toast.error('Please upload a product image.');
      return;
    }

    const payload = new FormData();
    payload.append('name', form.name.trim());
    payload.append('description', form.description.trim());
    payload.append('price', String(form.price));
    payload.append('discount', String(form.discount));
    payload.append('gender', form.gender);
    payload.append('availableSizes', form.availableSizes);
    payload.append('availableColors', form.availableColors);

    if (imageFile) {
      payload.append('image', imageFile);
    }

    setIsSubmitting(true);

    try {
      if (isEditMode) {
        await productApi.updateProduct(id, payload, token);
        toast.success('Product updated successfully.');
      } else {
        await productApi.createProduct(payload, token);
        toast.success('Product created successfully.');
      }

      await refreshMongoProducts();
      navigate('/admin/products');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout
      title={isEditMode ? 'Edit Product' : 'Create Product'}
      description="Manage the current MongoDB product schema without adding any new product fields."
      actions={(
        <Link
          to="/admin/products"
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-rose-200 hover:text-rose-600"
        >
          Back to Products
        </Link>
      )}
    >
      <div className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
        {loading ? (
          <p className="text-sm font-medium text-slate-600">Loading product...</p>
        ) : isEditMode && !existingProduct ? (
          <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-sm text-slate-500">
            Product not found.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="admin-product-name" className="mb-2 block text-sm font-semibold text-slate-700">
                  Name
                </label>
                <input
                  id="admin-product-name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                />
              </div>

              <div>
                <label htmlFor="admin-product-gender" className="mb-2 block text-sm font-semibold text-slate-700">
                  Gender
                </label>
                <select
                  id="admin-product-gender"
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                >
                  {genderOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="admin-product-description" className="mb-2 block text-sm font-semibold text-slate-700">
                  Description
                </label>
                <textarea
                  id="admin-product-description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                />
              </div>

              <div>
                <label htmlFor="admin-product-price" className="mb-2 block text-sm font-semibold text-slate-700">
                  Price
                </label>
                <input
                  id="admin-product-price"
                  name="price"
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                />
              </div>

              <div>
                <label htmlFor="admin-product-discount" className="mb-2 block text-sm font-semibold text-slate-700">
                  Discount Percentage
                </label>
                <input
                  id="admin-product-discount"
                  name="discount"
                  type="number"
                  min="0"
                  value={form.discount}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                />
              </div>

              <div>
                <label htmlFor="admin-product-sizes" className="mb-2 block text-sm font-semibold text-slate-700">
                  Available Sizes
                </label>
                <input
                  id="admin-product-sizes"
                  name="availableSizes"
                  type="text"
                  value={form.availableSizes}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                />
                <p className="mt-2 text-xs text-slate-500">Separate sizes with commas.</p>
              </div>

              <div>
                <label htmlFor="admin-product-colors" className="mb-2 block text-sm font-semibold text-slate-700">
                  Available Colors
                </label>
                <input
                  id="admin-product-colors"
                  name="availableColors"
                  type="text"
                  value={form.availableColors}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                />
                <p className="mt-2 text-xs text-slate-500">Separate colors with commas.</p>
              </div>
            </div>

            <div className="grid gap-5 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5 lg:grid-cols-[minmax(0,1fr)_200px]">
              <div>
                <label htmlFor="admin-product-image" className="mb-2 block text-sm font-semibold text-slate-700">
                  Product Image
                </label>
                <input
                  id="admin-product-image"
                  name="image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-slate-800"
                />
                <p className="mt-2 text-xs text-slate-500">
                  {isEditMode ? 'Upload a new image only if you want to replace the current one.' : 'One image is required when creating a product.'}
                </p>
              </div>

              <div>
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt={form.name || 'Product preview'}
                    className="h-40 w-full rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-sm text-slate-400">
                    No image selected
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Saving...' : isEditMode ? 'Save Product' : 'Create Product'}
              </button>
              <Link
                to="/admin/products"
                className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-rose-200 hover:text-rose-600"
              >
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminProductForm;
