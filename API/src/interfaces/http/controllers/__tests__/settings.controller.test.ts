import { describe, expect, it, vi } from 'vitest';
import { createSettingsController } from '../settings.controller';
import { createSettingsRoutes } from '../../routes/settings.routes';
import { startServer } from './http-test.helper';

const buildUseCases = () => ({
  getSystemSettings: vi.fn(),
  updateSystemSettings: vi.fn(),
  createPaymentMethod: vi.fn(),
  listActivePaymentMethods: vi.fn(),
  updatePaymentMethod: vi.fn(),
  disablePaymentMethod: vi.fn(),
});

describe('settings routes', () => {
  it('GET /api/settings responde 200', async () => {
    const useCases = buildUseCases();
    useCases.getSystemSettings.mockResolvedValue({ id: 'settings-1' });

    const controller = createSettingsController({ settingsUseCases: useCases });
    const server = await startServer(createSettingsRoutes(controller), '/api/settings');

    const response = await server.request('/api/settings');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { id: 'settings-1' } });
  });

  it('PATCH /api/settings responde 200', async () => {
    const useCases = buildUseCases();
    useCases.updateSystemSettings.mockResolvedValue({ id: 'settings-1', businessName: 'SR' });

    const controller = createSettingsController({ settingsUseCases: useCases });
    const server = await startServer(createSettingsRoutes(controller), '/api/settings');

    const response = await server.request('/api/settings', {
      method: 'PATCH',
      body: { businessName: 'SR' },
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { id: 'settings-1', businessName: 'SR' } });
  });

  it('POST /api/settings/payment-methods responde 201', async () => {
    const useCases = buildUseCases();
    useCases.createPaymentMethod.mockResolvedValue({ id: 'pm-1' });

    const controller = createSettingsController({ settingsUseCases: useCases });
    const server = await startServer(createSettingsRoutes(controller), '/api/settings');

    const response = await server.request('/api/settings/payment-methods', {
      method: 'POST',
      body: { name: 'Efectivo', type: 'cash' },
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ data: { id: 'pm-1' } });
  });

  it('GET /api/settings/payment-methods responde 200', async () => {
    const useCases = buildUseCases();
    useCases.listActivePaymentMethods.mockResolvedValue([{ id: 'pm-1' }]);

    const controller = createSettingsController({ settingsUseCases: useCases });
    const server = await startServer(createSettingsRoutes(controller), '/api/settings');

    const response = await server.request('/api/settings/payment-methods');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: [{ id: 'pm-1' }] });
  });

  it('PATCH /api/settings/payment-methods/:id responde 200', async () => {
    const useCases = buildUseCases();
    useCases.updatePaymentMethod.mockResolvedValue({ id: 'pm-1', name: 'Cuenta' });

    const controller = createSettingsController({ settingsUseCases: useCases });
    const server = await startServer(createSettingsRoutes(controller), '/api/settings');

    const response = await server.request('/api/settings/payment-methods/pm-1', {
      method: 'PATCH',
      body: { name: 'Cuenta' },
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { id: 'pm-1', name: 'Cuenta' } });
  });

  it('PATCH /api/settings/payment-methods/:id/disable responde 200', async () => {
    const useCases = buildUseCases();
    useCases.disablePaymentMethod.mockResolvedValue(undefined);

    const controller = createSettingsController({ settingsUseCases: useCases });
    const server = await startServer(createSettingsRoutes(controller), '/api/settings');

    const response = await server.request('/api/settings/payment-methods/pm-1/disable', {
      method: 'PATCH',
      body: {},
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { success: true } });
  });
});
