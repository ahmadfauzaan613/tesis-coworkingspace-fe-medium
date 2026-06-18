import React, { useState } from 'react';
import { useCategories } from '../hooks/useCategories';
import { 
  FolderPlus, 
  Edit3, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  X, 
  Loader2, 
  AlertCircle,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

export const CategoriesManager: React.FC = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Use categories hook
  const { 
    categoriesData, 
    isLoading, 
    error,
    createCategory,
    isCreating,
    updateCategory,
    isUpdating,
    deleteCategory
  } = useCategories(page, limit);

  const openCreateModal = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setFormError(null);
    setIsOpen(true);
  };

  const openEditModal = (id: number, catName: string, catDesc: string | null) => {
    setEditingId(id);
    setName(catName);
    setDescription(catDesc || '');
    setFormError(null);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setEditingId(null);
    setName('');
    setDescription('');
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Category name is required.');
      toast.error('Category name is required.');
      return;
    }

    setFormError(null);

    try {
      if (editingId) {
        await updateCategory({ id: editingId, data: { name, description } });
        toast.success('Category updated successfully');
      } else {
        await createCategory({ name, description });
        toast.success('Category created successfully');
      }
      closeModal();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'An error occurred while saving category. Try another name.';
      setFormError(errMsg);
      toast.error(errMsg);
    }
  };

  const handleDelete = async (id: number, catName: string) => {
    if (window.confirm(`Are you sure you want to delete category "${catName}"?`)) {
      setDeleteError(null);
      try {
        await deleteCategory(id);
        toast.success('Category deleted successfully');
      } catch (err: any) {
        const errMsg = err.response?.data?.message || 'Cannot delete category. Ensure no assets are linked to it.';
        setDeleteError(errMsg);
        toast.error(errMsg);
      }
    }
  };

  const isSaving = isCreating || isUpdating;

  return (
    <div id="categories-manager-page" className="space-y-6 animate-fadeIn">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 id="categories-header-title" className="text-2xl font-bold text-slate-900 dark:text-white">Categories Management</h2>
          <p id="categories-header-desc" className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-light">
            Create, update, and manage classification groups for coworking equipments.
          </p>
        </div>
        <button
          id="new-category-btn"
          onClick={openCreateModal}
          className="inline-flex items-center space-x-2 py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-purple-500/10 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      {/* Delete Error Notification */}
      {deleteError && (
        <div 
          id="category-delete-error"
          className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 rounded-2xl flex items-start space-x-3 text-red-800 dark:text-red-200 text-xs animate-shake"
        >
          <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Operation Restricted</p>
            <p id="category-delete-error-message" className="mt-0.5 opacity-90">{deleteError}</p>
          </div>
        </div>
      )}

      {/* Categories Table List */}
      <div className="bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-900 rounded-3xl overflow-hidden shadow-sm">
        
        {isLoading ? (
          <div id="categories-loading-spinner" className="py-20 flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-3" />
            <p className="text-xs">Loading categories...</p>
          </div>
        ) : error || !categoriesData ? (
          <div id="categories-error-container" className="py-16 text-center text-red-550 dark:text-red-400 text-xs">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
            <p className="font-semibold">Failed to load categories</p>
            <p className="opacity-85">Check backend database and try again.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table id="categories-table" className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-slate-900/10">
                    <th className="py-3 px-6 w-16 text-center">ID</th>
                    <th className="py-3 px-6">Category Name</th>
                    <th className="py-3 px-6">Description</th>
                    <th className="py-3 px-6 text-center w-28">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categoriesData.data.length > 0 ? (
                    categoriesData.data.map((category) => (
                      <tr 
                        key={category.id} 
                        id={`category-row-${category.id}`}
                        className="group border-b border-slate-150 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-900/20 transition"
                      >
                        <td className="py-4 px-6 text-center text-slate-400 dark:text-slate-505 font-mono">{category.id}</td>
                        <td id={`category-name-${category.id}`} className="py-4 px-6 font-semibold text-slate-800 dark:text-slate-200">{category.name}</td>
                        <td id={`category-desc-${category.id}`} className="py-4 px-6 text-slate-500 dark:text-slate-400 font-light">{category.description || 'No description provided'}</td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center space-x-2 lg:opacity-40 lg:group-hover:opacity-100 transition-opacity duration-150">
                            <button
                              id={`edit-category-btn-${category.id}`}
                              onClick={() => openEditModal(category.id, category.name, category.description)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-450 rounded-lg transition border border-slate-200 dark:border-slate-700"
                              title="Edit Category"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              id={`delete-category-btn-${category.id}`}
                              onClick={() => handleDelete(category.id, category.name)}
                              className="p-1.5 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/30 text-slate-550 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-450 rounded-lg transition border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-900/30"
                              title="Delete Category"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400 dark:text-slate-500 italic">
                        No categories found. Click "New Category" to register one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {categoriesData.pagination && categoriesData.pagination.totalPages > 1 && (
              <div className="py-4 px-6 border-t border-slate-150 dark:border-slate-900 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Showing page <b>{categoriesData.pagination.currentPage}</b> of <b>{categoriesData.pagination.totalPages}</b>
                </span>
                <div className="flex space-x-2">
                  <button
                    id="categories-page-prev"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    id="categories-page-next"
                    onClick={() => setPage(p => Math.min(categoriesData.pagination.totalPages, p + 1))}
                    disabled={page === categoriesData.pagination.totalPages}
                    className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Drawer Modal Form Overlay */}
      {isOpen && (
        <div 
          id="category-form-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-slideUp">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
              <h3 id="category-modal-title" className="font-bold text-base text-slate-800 dark:text-white flex items-center">
                <FolderPlus className="w-4.5 h-4.5 text-purple-600 dark:text-purple-400 mr-2" />
                {editingId ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button 
                id="category-modal-close-btn"
                onClick={closeModal} 
                className="p-1 text-slate-400 hover:text-slate-655 dark:text-slate-500 dark:hover:text-slate-300 rounded-lg transition"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Modal Form */}
            <form id="category-form" onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                
                {/* Form Error */}
                {formError && (
                  <div 
                    id="category-form-error"
                    className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl flex items-start space-x-2 text-red-800 dark:text-red-200 text-xs"
                  >
                    <AlertCircle className="w-4.5 h-4.5 text-red-500 dark:text-red-400 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Category Name */}
                <div className="space-y-1.5">
                  <label htmlFor="category-name-input" className="text-[10px] font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Category Name</label>
                  <input
                    id="category-name-input"
                    name="categoryName"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ergonomic Chairs, Laptops, ACs"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-650 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition text-xs"
                    required
                    disabled={isSaving}
                  />
                </div>

                {/* Category Description */}
                <div className="space-y-1.5">
                  <label htmlFor="category-desc-input" className="text-[10px] font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Description</label>
                  <textarea
                    id="category-desc-input"
                    name="categoryDescription"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe equipment type, handling conditions, etc."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-655 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition text-xs min-h-[100px] resize-none"
                    disabled={isSaving}
                  />
                </div>

              </div>

              {/* Action Buttons */}
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-end space-x-3">
                <button
                  id="category-cancel-btn"
                  type="button"
                  onClick={closeModal}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 font-semibold rounded-xl text-xs transition"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  id="category-submit-btn"
                  type="submit"
                  className="py-2 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-purple-500/10 transition flex items-center space-x-1"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5" />
                      <span>Save Category</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
