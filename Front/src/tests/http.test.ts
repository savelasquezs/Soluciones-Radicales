import { describe, expect, it, vi, afterEach } from 'vitest';
import { http, httpClient } from '@/shared/api/http';

describe('http wrapper', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('extrae payload de { data }', async () => {
    vi.spyOn(httpClient, 'get').mockResolvedValue({ data: { data: { id: 'u1' } } } as any);

    const response = await http.get<{ id: string }>('/auth/me');

    expect(response).toEqual({ id: 'u1' });
  });
});
