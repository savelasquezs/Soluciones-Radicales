import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
	CreatePaymentMethodPayload,
	UpdatePaymentMethodPayload,
} from '@/modules/settings/types/settings.types';
import { settingsService } from '@/modules/settings/services/settings.service';
import { endpoints } from '@/shared/api/endpoints';
import { http } from '@/shared/api/http';

vi.mock('@/shared/api/http', () => ({
	http: {
		get: vi.fn(),
		post: vi.fn(),
		patch: vi.fn(),
		delete: vi.fn(),
	},
}));

describe('settingsService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('getSettings llama endpoint correcto', async () => {
		vi.mocked(http.get).mockResolvedValueOnce({ businessName: 'SR' } as any);

		await settingsService.getSettings();

		expect(http.get).toHaveBeenCalledWith(endpoints.settings.get);
	});

	it('updateSettings envía payload correcto', async () => {
		const payload = { businessName: 'SR', defaultFrequencyDays: 30 };
		vi.mocked(http.patch).mockResolvedValueOnce(payload as any);

		await settingsService.updateSettings(payload);

		expect(http.patch).toHaveBeenCalledWith(endpoints.settings.update, payload);
	});

	it('listPaymentMethods llama endpoint correcto', async () => {
		vi.mocked(http.get).mockResolvedValueOnce([] as any);

		await settingsService.listPaymentMethods();

		expect(http.get).toHaveBeenCalledWith(endpoints.settings.paymentMethods);
	});

	it('createPaymentMethod envía payload correcto', async () => {
		const payload: CreatePaymentMethodPayload = {
			name: 'Efectivo',
			type: 'cash',
			active: true,
		};
		vi.mocked(http.post).mockResolvedValueOnce({
			id: 'pm-1',
			...payload,
		} as any);

		await settingsService.createPaymentMethod(payload);

		expect(http.post).toHaveBeenCalledWith(
			endpoints.settings.paymentMethods,
			payload,
		);
	});

	it('updatePaymentMethod llama endpoint correcto', async () => {
		const payload: UpdatePaymentMethodPayload = {
			name: 'Efectivo modificado',
			type: 'cash',
			active: true,
		};
		vi.mocked(http.patch).mockResolvedValueOnce({
			id: 'pm-1',
			...payload,
		} as any);

		await settingsService.updatePaymentMethod('pm-1', payload);

		expect(http.patch).toHaveBeenCalledWith(
			endpoints.settings.paymentMethodById('pm-1'),
			payload,
		);
	});

	it('disablePaymentMethod llama endpoint correcto sin actorUserId', async () => {
		vi.mocked(http.patch).mockResolvedValueOnce({ success: true } as any);

		await settingsService.disablePaymentMethod('pm-1');

		expect(http.patch).toHaveBeenCalledWith(
			endpoints.settings.disablePaymentMethod('pm-1'),
			undefined,
		);
	});

	it('disablePaymentMethod llama endpoint correcto con actorUserId', async () => {
		vi.mocked(http.patch).mockResolvedValueOnce({ success: true } as any);

		await settingsService.disablePaymentMethod('pm-1', 'user-1');

		expect(http.patch).toHaveBeenCalledWith(
			endpoints.settings.disablePaymentMethod('pm-1'),
			{ actorUserId: 'user-1' },
		);
	});
});
