import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { ref } from 'vue';
import type { PaymentMethod } from '@/modules/settings/types/settings.types';
import SettingsPage from '@/modules/settings/pages/SettingsPage.vue';
import CompanySettingsPage from '@/modules/settings/pages/CompanySettingsPage.vue';
import PaymentMethodsPage from '@/modules/settings/pages/PaymentMethodsPage.vue';
import CompanySettingsForm from '@/modules/settings/components/CompanySettingsForm.vue';
import PaymentMethodForm from '@/modules/settings/components/PaymentMethodForm.vue';
import { settingsService } from '@/modules/settings/services/settings.service';

const toastPush = vi.fn();

vi.mock('@/shared/composables/useToast', () => ({
	useToast: () => ({ push: toastPush, messages: ref([]) }),
}));

vi.mock('@/modules/settings/services/settings.service', () => ({
	settingsService: {
		getSettings: vi.fn(),
		updateSettings: vi.fn(),
		listPaymentMethods: vi.fn(),
		createPaymentMethod: vi.fn(),
		updatePaymentMethod: vi.fn(),
		disablePaymentMethod: vi.fn(),
	},
}));

describe('SettingsPage', () => {
	it('muestra cards Empresa, Métodos de pago y Usuarios y técnicos como Próximamente', () => {
		const wrapper = mount(SettingsPage, {
			global: {
				stubs: {
					RouterLink: { template: '<div><slot /></div>' },
				},
			},
		});

		expect(wrapper.text()).toContain('Empresa');
		expect(wrapper.text()).toContain('Métodos de pago');
		expect(wrapper.text()).toContain('Usuarios y técnicos');
		expect(wrapper.text()).toContain('Próximamente');
	});
});

describe('CompanySettingsPage', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('carga settings al montar', async () => {
		vi.mocked(settingsService.getSettings).mockResolvedValueOnce({
			businessName: 'Empresa X',
			logoUrl: '',
			defaultFrequencyDays: 30,
			defaultReinforcementDays: 10,
			reinforcementEnabledDefault: true,
			reinforcementIsPaidDefault: false,
		});

		mount(CompanySettingsPage);
		await flushPromises();

		expect(settingsService.getSettings).toHaveBeenCalled();
	});

	it('guarda cambios correctamente', async () => {
		vi.mocked(settingsService.getSettings).mockResolvedValueOnce({
			businessName: 'Empresa X',
			logoUrl: '',
			defaultFrequencyDays: 30,
			defaultReinforcementDays: 10,
			reinforcementEnabledDefault: true,
			reinforcementIsPaidDefault: false,
		});
		vi.mocked(settingsService.updateSettings).mockResolvedValueOnce({
			businessName: 'Empresa Y',
			logoUrl: '',
			defaultFrequencyDays: 30,
			defaultReinforcementDays: 10,
			reinforcementEnabledDefault: true,
			reinforcementIsPaidDefault: false,
		});

		const wrapper = mount(CompanySettingsPage);
		await flushPromises();

		wrapper.findComponent(CompanySettingsForm).vm.$emit('submit', {
			businessName: 'Empresa Y',
			logoUrl: '',
			defaultFrequencyDays: 30,
			defaultReinforcementDays: 10,
			reinforcementEnabledDefault: true,
			reinforcementIsPaidDefault: false,
		});
		await flushPromises();

		expect(settingsService.updateSettings).toHaveBeenCalledWith(
			expect.objectContaining({ businessName: 'Empresa Y' }),
		);
		expect(toastPush).toHaveBeenCalledWith(
			'Configuración actualizada correctamente.',
		);
	});

	it('muestra error si falla carga', async () => {
		vi.mocked(settingsService.getSettings).mockRejectedValueOnce(
			new Error('fail'),
		);

		const wrapper = mount(CompanySettingsPage);
		await flushPromises();

		expect(wrapper.text()).toContain(
			'No se pudo cargar la configuración. Intenta de nuevo.',
		);
	});
});

describe('PaymentMethodsPage', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		toastPush.mockClear();
	});

	const activeMethods: PaymentMethod[] = [
		{ id: 'pm-1', name: 'Efectivo', type: 'cash', active: true },
	];

	it('carga métodos al montar', async () => {
		vi.mocked(settingsService.listPaymentMethods).mockResolvedValueOnce(
			activeMethods,
		);

		mount(PaymentMethodsPage);
		await flushPromises();

		expect(settingsService.listPaymentMethods).toHaveBeenCalled();
	});

	it('abre modal de creación', async () => {
		vi.mocked(settingsService.listPaymentMethods).mockResolvedValueOnce([]);

		const wrapper = mount(PaymentMethodsPage);
		await flushPromises();

		await wrapper.find('button').trigger('click');
		await wrapper.vm.$nextTick();
		expect(wrapper.text()).toContain('Nuevo método de pago');
	});

	it('crea método y refresca lista', async () => {
		vi.mocked(settingsService.listPaymentMethods)
			.mockResolvedValueOnce([])
			.mockResolvedValueOnce(activeMethods);
		vi.mocked(settingsService.createPaymentMethod).mockResolvedValueOnce({
			id: 'pm-1',
			name: 'Efectivo',
			type: 'cash',
			active: true,
		});

		const wrapper = mount(PaymentMethodsPage);
		await flushPromises();

		await wrapper.find('button').trigger('click');
		await wrapper.vm.$nextTick();
		wrapper.findComponent(PaymentMethodForm).vm.$emit('submit', {
			name: 'Efectivo',
			type: 'cash',
			active: true,
		});
		await flushPromises();

		expect(settingsService.createPaymentMethod).toHaveBeenCalledWith({
			name: 'Efectivo',
			type: 'cash',
			active: true,
		});
		expect(settingsService.listPaymentMethods).toHaveBeenCalledTimes(2);
		expect(toastPush).toHaveBeenCalledWith(
			'Método de pago creado correctamente.',
		);
	});

	it('abre modal de edición', async () => {
		vi.mocked(settingsService.listPaymentMethods).mockResolvedValueOnce(
			activeMethods,
		);

		const wrapper = mount(PaymentMethodsPage);
		await flushPromises();

		const editButton = wrapper
			.findAll('button')
			.find((btn) => btn.text() === 'Editar');
		await editButton?.trigger('click');

		expect(wrapper.text()).toContain('Editar método de pago');
		expect(
			(wrapper.find('input#paymentMethodName').element as HTMLInputElement)
				.value,
		).toBe('Efectivo');
	});

	it('edita método y refresca lista', async () => {
		vi.mocked(settingsService.listPaymentMethods)
			.mockResolvedValueOnce(activeMethods)
			.mockResolvedValueOnce(activeMethods);
		vi.mocked(settingsService.updatePaymentMethod).mockResolvedValueOnce({
			id: 'pm-1',
			name: 'Efectivo modificado',
			type: 'cash',
			active: true,
		});

		const wrapper = mount(PaymentMethodsPage);
		await flushPromises();

		const editButton = wrapper
			.findAll('button')
			.find((btn) => btn.text() === 'Editar');
		await editButton?.trigger('click');
		await wrapper.vm.$nextTick();
		wrapper.findComponent(PaymentMethodForm).vm.$emit('submit', {
			name: 'Efectivo modificado',
			type: 'cash',
			active: true,
		});
		await flushPromises();

		expect(settingsService.updatePaymentMethod).toHaveBeenCalledWith(
			'pm-1',
			expect.objectContaining({ name: 'Efectivo modificado' }),
		);
		expect(settingsService.listPaymentMethods).toHaveBeenCalledTimes(2);
		expect(toastPush).toHaveBeenCalledWith(
			'Método de pago actualizado correctamente.',
		);
	});

	it('desactiva método y refresca lista', async () => {
		vi.mocked(settingsService.listPaymentMethods)
			.mockResolvedValueOnce(activeMethods)
			.mockResolvedValueOnce([]);
		vi.mocked(settingsService.disablePaymentMethod).mockResolvedValueOnce({
			success: true,
		} as any);
		vi.spyOn(window, 'confirm').mockReturnValue(true);

		const wrapper = mount(PaymentMethodsPage);
		await flushPromises();

		const disableButton = wrapper
			.findAll('button')
			.find((btn) => btn.text() === 'Desactivar');
		await disableButton?.trigger('click');
		await flushPromises();

		expect(settingsService.disablePaymentMethod).toHaveBeenCalledWith('pm-1');
		expect(settingsService.listPaymentMethods).toHaveBeenCalledTimes(2);
		expect(toastPush).toHaveBeenCalledWith(
			'Método de pago desactivado correctamente.',
		);
	});
});
