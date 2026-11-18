// Kelas dan label bersama. Tombol min 44px (h-11) sesuai target sentuh.
export const btnPrimary =
  'inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover active:translate-y-px disabled:opacity-60';
export const btnSecondary =
  'inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted active:translate-y-px disabled:opacity-60';
export const btnRow =
  'inline-flex h-11 items-center justify-center gap-1.5 rounded-md border border-border px-3 text-sm font-semibold text-foreground transition-colors hover:border-input hover:bg-muted active:translate-y-px';
export const btnIcon =
  'inline-flex size-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:translate-y-px';
export const btnDanger =
  'inline-flex size-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive-soft hover:text-destructive active:translate-y-px';

export const labelCls = 'block text-sm font-semibold text-foreground';
export const hintCls = 'mt-1.5 text-xs text-muted-foreground';
export const inputCls =
  'mt-1.5 block h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground disabled:opacity-60';
export const textareaCls =
  'mt-1.5 block min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground disabled:opacity-60';

export const tableCls = 'w-full min-w-[640px] border-collapse text-left text-sm';
export const thCls = 'whitespace-nowrap px-4 py-3 text-xs font-semibold text-muted-foreground';
export const tdCls = 'px-4 py-3 align-top';

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'primary';

export const toneCls: Record<Tone, string> = {
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-destructive-soft text-destructive',
  neutral: 'bg-muted text-muted-foreground',
  primary: 'bg-primary-soft text-primary',
};

// Nilai enum dari backend tetap bahasa Inggris, yang tampil ke pengguna bahasa Indonesia.
export const assetStatus: Record<string, { label: string; tone: Tone }> = {
  Available: { label: 'Tersedia', tone: 'success' },
  Maintenance: { label: 'Perawatan', tone: 'warning' },
  Broken: { label: 'Rusak', tone: 'danger' },
};

export const loanStatus: Record<string, { label: string; tone: Tone }> = {
  ACTIVE: { label: 'Dipinjam', tone: 'warning' },
  RETURNED: { label: 'Dikembalikan', tone: 'neutral' },
};

export const ticketStatus: Record<string, { label: string; tone: Tone }> = {
  PENDING: { label: 'Menunggu perbaikan', tone: 'warning' },
  RESOLVED: { label: 'Selesai', tone: 'success' },
};

export const changeType: Record<string, { label: string; tone: Tone }> = {
  INITIAL: { label: 'Stok awal', tone: 'primary' },
  ADDITION: { label: 'Penambahan', tone: 'success' },
  DEDUCTION: { label: 'Pengurangan', tone: 'neutral' },
  DAMAGE: { label: 'Rusak', tone: 'danger' },
  AUDIT: { label: 'Audit', tone: 'warning' },
};

export const LOW_STOCK = 5;

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

export const formatIDR = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

export const formatQty = (n: number) => (n > 0 ? `+${n}` : String(n));

// Pesan dari backend kalau ada, kalau tidak pakai cadangan yang menjelaskan langkah berikutnya.
export function errorMessage(err: unknown, fallback: string): string {
  const msg = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
  return typeof msg === 'string' && msg ? msg : fallback;
}

export type AdjustType = 'ADDITION' | 'DEDUCTION' | 'DAMAGE' | 'AUDIT';

// Pengguna mengetik jumlah positif; tanda +/- ditentukan jenis perubahan. Hanya audit yang boleh bertanda bebas.
export function signedQty(type: AdjustType, qty: number): number {
  if (type === 'AUDIT') return qty;
  return type === 'ADDITION' ? Math.abs(qty) : -Math.abs(qty);
}
