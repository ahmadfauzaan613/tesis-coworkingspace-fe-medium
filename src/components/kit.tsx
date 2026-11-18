import { useEffect, useRef, type ReactNode } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';
import { btnIcon, btnSecondary, toneCls } from '../lib/ui';

export function PageHeader({
  title,
  description,
  action,
  id,
}: {
  title: string;
  description: ReactNode;
  action?: ReactNode;
  id?: string;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 id={id} className="text-3xl font-extrabold tracking-tight">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>
      </div>
      {action && <div className="flex flex-wrap gap-3">{action}</div>}
    </header>
  );
}

export function Badge({ tone, children, id }: { tone: keyof typeof toneCls; children: ReactNode; id?: string }) {
  return (
    <span id={id} className={`inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-semibold ${toneCls[tone]}`}>
      {children}
    </span>
  );
}

export function LoadingState({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <div id={id} role="status" className="flex items-center justify-center gap-3 px-4 py-16 text-sm text-muted-foreground">
      <Loader2 className="size-5 animate-spin text-primary" aria-hidden="true" />
      {children}
    </div>
  );
}

export function ErrorState({
  id,
  title,
  onRetry,
}: {
  id?: string;
  title: string;
  onRetry?: () => void;
}) {
  return (
    <div id={id} role="alert" className="px-4 py-14 text-center">
      <AlertCircle className="mx-auto size-6 text-destructive" aria-hidden="true" />
      <p className="mt-3 font-semibold">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        Server atau database sedang tidak terjangkau. Cek status database di menu samping, lalu coba lagi.
      </p>
      {onRetry && (
        <button type="button" onClick={onRetry} className={`${btnSecondary} mt-5`}>
          Muat ulang
        </button>
      )}
    </div>
  );
}

export function FormError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <div id={id} role="alert" className="flex items-start gap-2 rounded-lg bg-destructive-soft px-3 py-2.5 text-sm text-destructive">
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

export function Pagination({
  idPrefix,
  page,
  totalPages,
  onChange,
}: {
  idPrefix: string;
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Halaman tabel" className="flex items-center justify-between gap-3 border-t border-border px-4 py-2 text-sm text-muted-foreground">
      <span className="tabular-nums">
        Halaman {page} dari {totalPages}
      </span>
      <div className="flex gap-1">
        <button
          type="button"
          id={`${idPrefix}-page-prev`}
          aria-label="Halaman sebelumnya"
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className={`${btnIcon} disabled:opacity-40`}
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          id={`${idPrefix}-page-next`}
          aria-label="Halaman berikutnya"
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className={`${btnIcon} disabled:opacity-40`}
        >
          <ChevronRight className="size-5" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}

// Dialog native: fokus terkunci di dalam, Escape menutup, fokus kembali ke tombol pemicu.
export function Modal({
  id,
  closeId = `${id}-close-btn`,
  title,
  onClose,
  children,
}: {
  id: string;
  closeId?: string;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    // showModal memfokuskan tombol tutup; untuk form, langsung ke isian pertama.
    dialog?.querySelector<HTMLElement>('input:not(:disabled), select:not(:disabled), textarea:not(:disabled)')?.focus();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      id={id}
      ref={ref}
      aria-labelledby={`${id}-title`}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      // Bayangan dipakai hanya di sini: dialog satu-satunya lapisan yang melayang di atas halaman.
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-0 text-card-foreground shadow-xl"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border py-2 pl-5 pr-2">
        <h2 id={`${id}-title`} className="text-lg font-bold">
          {title}
        </h2>
        <button type="button" id={closeId} aria-label="Tutup dialog" onClick={onClose} className={btnIcon}>
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>
      {children}
    </dialog>
  );
}

export function ModalFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col-reverse gap-3 border-t border-border bg-muted px-5 py-4 sm:flex-row sm:justify-end">{children}</div>
  );
}
