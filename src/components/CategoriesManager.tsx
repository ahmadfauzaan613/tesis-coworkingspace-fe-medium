import React, { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCategories } from '../hooks/useCategories';
import { ErrorState, FormError, LoadingState, Modal, ModalFooter, PageHeader, Pagination } from './kit';
import {
  btnDanger,
  btnIcon,
  btnPrimary,
  btnSecondary,
  errorMessage,
  hintCls,
  inputCls,
  labelCls,
  tableCls,
  tdCls,
  textareaCls,
  thCls,
} from '../lib/ui';

export const CategoriesManager: React.FC = () => {
  const [page, setPage] = useState(1);
  const limit = 10;

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { categoriesData, isLoading, error, refetch, createCategory, isCreating, updateCategory, isUpdating, deleteCategory } =
    useCategories(page, limit);

  const openModal = (id: number | null = null, catName = '', catDesc: string | null = '') => {
    setEditingId(id);
    setName(catName);
    setDescription(catDesc || '');
    setFormError(null);
    setIsOpen(true);
  };

  const closeModal = () => setIsOpen(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Nama kategori wajib diisi.');
      return;
    }
    setFormError(null);
    try {
      if (editingId) {
        await updateCategory({ id: editingId, data: { name, description } });
        toast.success(`Kategori "${name}" diperbarui.`);
      } else {
        await createCategory({ name, description });
        toast.success(`Kategori "${name}" ditambahkan.`);
      }
      closeModal();
    } catch (err) {
      setFormError(errorMessage(err, 'Kategori gagal disimpan. Nama mungkin sudah dipakai, coba nama lain.'));
    }
  };

  const handleDelete = async (id: number, catName: string) => {
    if (!window.confirm(`Hapus kategori "${catName}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    setDeleteError(null);
    try {
      await deleteCategory(id);
      toast.success(`Kategori "${catName}" dihapus.`);
    } catch (err) {
      setDeleteError(errorMessage(err, 'Kategori gagal dihapus. Pindahkan dulu aset yang masih memakai kategori ini.'));
    }
  };

  const isSaving = isCreating || isUpdating;

  return (
    <div id="categories-manager-page" className="space-y-6">
      <PageHeader
        id="categories-header-title"
        title="Kategori"
        description={<span id="categories-header-desc">Kelompok aset seperti furnitur, elektronik, atau pendingin ruangan. Setiap aset wajib punya satu kategori.</span>}
        action={
          <button type="button" id="new-category-btn" onClick={() => openModal()} className={btnPrimary}>
            <Plus className="size-4" aria-hidden="true" />
            Tambah kategori
          </button>
        }
      />

      {deleteError && (
        <FormError id="category-delete-error">
          <span id="category-delete-error-message">{deleteError}</span>
        </FormError>
      )}

      <div className="overflow-hidden rounded-xl border border-border">
        {isLoading ? (
          <LoadingState id="categories-loading-spinner">Memuat kategori...</LoadingState>
        ) : error || !categoriesData ? (
          <ErrorState id="categories-error-container" title="Kategori gagal dimuat" onRetry={() => refetch()} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table id="categories-table" className={tableCls}>
                <thead className="border-b border-border bg-muted">
                  <tr>
                    <th className={`${thCls} w-16`}>ID</th>
                    <th className={thCls}>Nama</th>
                    <th className={thCls}>Keterangan</th>
                    <th className={`${thCls} w-28 text-right`}>
                      <span className="sr-only">Aksi</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {categoriesData.data.length > 0 ? (
                    categoriesData.data.map((category) => (
                      <tr key={category.id} id={`category-row-${category.id}`}>
                        <td className={`${tdCls} tabular-nums text-muted-foreground`}>{category.id}</td>
                        <td id={`category-name-${category.id}`} className={`${tdCls} font-semibold`}>
                          {category.name}
                        </td>
                        <td id={`category-desc-${category.id}`} className={`${tdCls} text-muted-foreground`}>
                          {category.description || '-'}
                        </td>
                        <td className="px-2 py-1 text-right">
                          <div className="inline-flex">
                            <button
                              type="button"
                              id={`edit-category-btn-${category.id}`}
                              onClick={() => openModal(category.id, category.name, category.description)}
                              aria-label={`Ubah kategori ${category.name}`}
                              title="Ubah"
                              className={btnIcon}
                            >
                              <Pencil className="size-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              id={`delete-category-btn-${category.id}`}
                              onClick={() => handleDelete(category.id, category.name)}
                              aria-label={`Hapus kategori ${category.name}`}
                              title="Hapus"
                              className={btnDanger}
                            >
                              <Trash2 className="size-4" aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center text-sm text-muted-foreground">
                        Belum ada kategori. Tambahkan kategori dulu sebelum mendaftarkan aset.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              idPrefix="categories"
              page={categoriesData.pagination?.currentPage ?? page}
              totalPages={categoriesData.pagination?.totalPages ?? 1}
              onChange={setPage}
            />
          </>
        )}
      </div>

      {isOpen && (
        <Modal
          id="category-form-modal"
          closeId="category-modal-close-btn"
          title={editingId ? 'Ubah kategori' : 'Tambah kategori'}
          onClose={closeModal}
        >
          <form id="category-form" onSubmit={handleSubmit} noValidate>
            <div className="space-y-4 p-5">
              {formError && <FormError id="category-form-error">{formError}</FormError>}

              <div>
                <label htmlFor="category-name-input" className={labelCls}>
                  Nama kategori
                </label>
                <input
                  id="category-name-input"
                  name="categoryName"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Kursi ergonomis"
                  aria-invalid={!!formError && !name.trim()}
                  className={inputCls}
                  disabled={isSaving}
                />
              </div>

              <div>
                <label htmlFor="category-desc-input" className={labelCls}>
                  Keterangan <span className="font-normal text-muted-foreground">(opsional)</span>
                </label>
                <textarea
                  id="category-desc-input"
                  name="categoryDescription"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={textareaCls}
                  disabled={isSaving}
                />
                <p className={hintCls}>Jelaskan jenis barang yang masuk ke kategori ini.</p>
              </div>
            </div>

            <ModalFooter>
              <button id="category-cancel-btn" type="button" onClick={closeModal} className={btnSecondary} disabled={isSaving}>
                Batal
              </button>
              <button id="category-submit-btn" type="submit" className={btnPrimary} disabled={isSaving}>
                {isSaving ? 'Menyimpan...' : editingId ? 'Simpan perubahan' : 'Tambah kategori'}
              </button>
            </ModalFooter>
          </form>
        </Modal>
      )}
    </div>
  );
};
