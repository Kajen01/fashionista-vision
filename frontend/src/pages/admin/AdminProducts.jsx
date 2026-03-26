import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../hooks/useAuth';
import { useProductsModel } from '../../context/ProductsContext';
import { productApi } from '../../utils/productApi';
import { resolveProductImageUrl } from '../../utils/runtimeConfig';

function formatDate(value) {
  if (!value) {
    return 'N/A';
  }

  return new Date(value).toLocaleString();
}

const AdminProducts = () => {
  const { token } = useAuth();
  const { mongodbProducts, refreshMongoProducts } = useProductsModel();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);

      try {
        await refreshMongoProducts();
      } catch (error) {
        toast.error('Unable to load MongoDB products.');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [refreshMongoProducts]);

  const handleDelete = async (productId, productName) => {
    if (!window.confirm(`Delete ${productName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await productApi.deleteProduct(productId, token);
      await refreshMongoProducts();
      toast.success('Product deleted successfully.');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const filteredProducts = mongodbProducts.filter((product) =>
    product.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout
      title="Products"
      description="Manage the MongoDB product collection already connected to the backend product APIs."
      actions={(
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 rounded-full border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
          />
          <Link
            to="/admin/products/new"
            className="shrink-0 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Create Product
          </Link>
        </div>
      )}
    >
      <div className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
        {loading ? (
          <p className="text-sm font-medium text-slate-600">Loading MongoDB products...</p>
        ) : mongodbProducts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-sm text-slate-500">
            No MongoDB products found yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="px-3 py-3 font-semibold">Product</th>
                  <th className="px-3 py-3 font-semibold">Gender</th>
                  <th className="px-3 py-3 font-semibold">Price</th>
                  <th className="px-3 py-3 font-semibold">Sizes</th>
                  <th className="px-3 py-3 font-semibold">Colors</th>
                  <th className="px-3 py-3 font-semibold">Updated</th>
                  <th className="px-3 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <tr key={product.id || product._id}>
                      <td className="px-3 py-4 max-w-[16rem]">
                        <div className="flex items-center gap-3">
                          <img
                            src={resolveProductImageUrl(product)}
                            alt={product.name}
                            className="h-16 w-16 rounded-2xl object-cover"
                          />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">{product.name}</p>
                            <p className="truncate text-slate-500">{product.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-slate-600">{product.gender}</td>
                      <td className="px-3 py-4 text-slate-600">
                        <p>LKR {product.price}</p>
                        <p className="text-xs text-slate-500">Discount: {product.discount}%</p>
                      </td>
                      <td className="px-3 py-4 text-slate-600">{(product.availableSizes || []).join(', ')}</td>
                      <td className="px-3 py-4 text-slate-600">{(product.availableColors || []).join(', ')}</td>
                      <td className="px-3 py-4 text-slate-600">{formatDate(product.updatedAt)}</td>
                      <td className="px-3 py-4">
                        <div className="flex justify-end gap-3">
                          <Link
                            to={`/admin/products/${product.id || product._id}/edit`}
                            className="rounded-full border border-slate-200 px-3 py-2 font-semibold text-slate-700 transition hover:border-rose-200 hover:text-rose-600"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id || product._id, product.name)}
                            className="rounded-full border border-red-200 px-3 py-2 font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-3 py-8 text-center text-sm text-slate-500">
                      No products match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
