import { describe, expect, it } from 'vitest';
import {
  LOW_STOCK,
  assetStatus,
  changeType,
  errorMessage,
  formatDate,
  formatIDR,
  formatQty,
  loanStatus,
  signedQty,
  ticketStatus,
  toneCls,
  type AdjustType,
} from '../lib/ui';
import { cn } from '../lib/utils';
import { randInt, randWord } from './random';

describe('formatIDR', () => {
  it('sama dengan format Rupiah bawaan Intl tanpa desimal', () => {
    const n = randInt(0, 50_000_000);
    const expected = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
    expect(formatIDR(n)).toBe(expected);
  });
});

describe('formatDate', () => {
  it('memakai format tanggal Indonesia', () => {
    const iso = new Date(Date.now() - randInt(0, 1e10)).toISOString();
    expect(formatDate(iso)).toBe(new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }));
  });
});

describe('formatQty', () => {
  it('angka positif diberi tanda +, negatif dan nol apa adanya', () => {
    const n = randInt(1, 999);
    expect(formatQty(n)).toBe(`+${n}`);
    expect(formatQty(-n)).toBe(String(-n));
    expect(formatQty(0)).toBe('0');
  });
});

describe('signedQty', () => {
  const n = () => randInt(1, 999);

  it('penambahan selalu positif apa pun tanda inputnya', () => {
    const q = n();
    expect(signedQty('ADDITION', q)).toBe(q);
    expect(signedQty('ADDITION', -q)).toBe(q);
  });

  it.each<AdjustType>(['DEDUCTION', 'DAMAGE'])('%s selalu negatif', (type) => {
    const q = n();
    expect(signedQty(type, q)).toBe(-q);
    expect(signedQty(type, -q)).toBe(-q);
  });

  it('audit memakai tanda dari pengguna', () => {
    const q = n();
    expect(signedQty('AUDIT', q)).toBe(q);
    expect(signedQty('AUDIT', -q)).toBe(-q);
  });
});

describe('errorMessage', () => {
  it('memakai pesan dari backend bila ada', () => {
    const msg = randWord('pesan');
    expect(errorMessage({ response: { data: { message: msg } } }, randWord('cadangan'))).toBe(msg);
  });

  it.each([undefined, null, new Error('x'), { response: {} }, { response: { data: { message: '' } } }, { response: { data: { message: [1] } } }])(
    'jatuh ke pesan cadangan bila pesan backend tidak ada atau bukan teks (%#)',
    (err) => {
      const fallback = randWord('cadangan');
      expect(errorMessage(err, fallback)).toBe(fallback);
    },
  );
});

describe('peta status', () => {
  it.each([
    ['assetStatus', assetStatus],
    ['loanStatus', loanStatus],
    ['ticketStatus', ticketStatus],
    ['changeType', changeType],
  ])('%s: setiap status punya label bahasa Indonesia dan warna yang terdaftar', (_n, map) => {
    for (const [key, v] of Object.entries(map)) {
      expect(v.label.trim()).not.toBe('');
      expect(v.label).not.toBe(key);
      expect(Object.keys(toneCls)).toContain(v.tone);
    }
  });

  it('jenis perubahan stok mencakup semua nilai yang diterima backend', () => {
    expect(Object.keys(changeType).sort()).toEqual(['ADDITION', 'AUDIT', 'DAMAGE', 'DEDUCTION', 'INITIAL']);
  });

  it('batas stok menipis adalah 5, sama dengan backend', () => {
    expect(LOW_STOCK).toBe(5);
  });
});

describe('cn', () => {
  it('menggabungkan kelas dan kelas Tailwind yang bentrok dimenangkan yang terakhir', () => {
    const a = randWord('a');
    expect(cn(a, false, 'mt-1.5', 'mt-0')).toBe(`${a} mt-0`);
  });
});
