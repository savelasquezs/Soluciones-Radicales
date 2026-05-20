import { describe, expect, it } from 'vitest';
import { endpoints } from '@/shared/api/endpoints';

describe('shared endpoints', () => {
  it('genera rutas dinamicas correctas', () => {
    expect(endpoints.clients.detail('c1')).toBe('/clients/c1/detail');
    expect(endpoints.services.generateReinforcement('s1')).toBe('/services/s1/generate-reinforcement');
    expect(endpoints.settings.paymentMethodById('pm1')).toBe('/settings/payment-methods/pm1');
    expect(endpoints.users.disable('u1')).toBe('/users/u1/disable');
  });
});
