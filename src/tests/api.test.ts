import { describe, expect, it } from 'vitest';
import type { InternalAxiosRequestConfig } from 'axios';
import { AxiosHeaders } from 'axios';
import api from '../services/api';
import { randWord } from './random';

type Handler = { fulfilled: (c: InternalAxiosRequestConfig) => InternalAxiosRequestConfig };
const interceptor = () => (api.interceptors.request as unknown as { handlers: Handler[] }).handlers[0];
const config = () => ({ headers: new AxiosHeaders() }) as InternalAxiosRequestConfig;

describe('api (axios)', () => {
  it('baseURL diambil dari VITE_API_URL', () => {
    expect(api.defaults.baseURL).toBe(import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1');
  });

  it('token di localStorage dipasang sebagai Bearer', () => {
    const token = randWord('token');
    localStorage.setItem('token', token);
    expect(interceptor().fulfilled(config()).headers.Authorization).toBe(`Bearer ${token}`);
  });

  it('tanpa token, header Authorization tidak dipasang', () => {
    expect(interceptor().fulfilled(config()).headers.Authorization).toBeUndefined();
  });
});
