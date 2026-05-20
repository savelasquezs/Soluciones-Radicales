import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PaymentMethod } from '@/modules/settings/types/settings.types';
import { mount } from '@vue/test-utils';
import SettingsCard from '@/modules/settings/components/SettingsCard.vue';
import CompanySettingsForm from '@/modules/settings/components/CompanySettingsForm.vue';
import PaymentMethodForm from '@/modules/settings/components/PaymentMethodForm.vue';
import PaymentMethodsTable from '@/modules/settings/components/PaymentMethodsTable.vue';

describe('SettingsCard', () => {
	it('renderiza title y description', () => {
		const wrapper = mount(SettingsCard, {
			props: {
				title: 'Empresa',
				description: 'Configura datos de empresa',
				to: '/settings/company',
			},
			global: {
				stubs: {
					RouterLink: { template: '<div><slot /></div>' },
				},
			},
		});

		expect(wrapper.text()).toContain('Empresa');
		expect(wrapper.text()).toContain('Configura datos de empresa');
	});

	it('no navega cuando disabled=true', () => {
		const wrapper = mount(SettingsCard, {
			props: {
				title: 'Usuarios y técnicos',
				description: 'Próximamente',
				to: '/settings/users',
				disabled: true,
			},
			global: {
				stubs: {
					RouterLink: { template: '<div><slot /></div>' },
				},
			},
		});

		expect(wrapper.find('a').exists()).toBe(false);
		expect(wrapper.text()).toContain('Próximamente');
	});
});

describe('CompanySettingsForm', () => {
	const initialValue = {
		businessName: 'Empresa X',
		logoUrl: '',
		defaultFrequencyDays: 30,
		defaultReinforcementDays: 0,
		reinforcementEnabledDefault: false,
		reinforcementIsPaidDefault: false,
	};

	it('valida businessName requerido', async () => {
		const wrapper = mount(CompanySettingsForm, { props: { initialValue } });
		await wrapper.find('input#businessName').setValue('');
		await wrapper.find('form').trigger('submit.prevent');
		await wrapper.vm.$nextTick();

		expect(wrapper.text()).toContain('businessName es requerido.');
	});

	it('valida defaultFrequencyDays > 0', async () => {
		const wrapper = mount(CompanySettingsForm, { props: { initialValue } });
		await wrapper.find('input#businessName').setValue('Empresa X');
		await wrapper.find('input#defaultFrequencyDays').setValue('0');
		await wrapper.find('form').trigger('submit.prevent');
		await wrapper.vm.$nextTick();

		expect(wrapper.text()).toContain(
			'defaultFrequencyDays debe ser un número mayor a 0.',
		);
	});

	it('valida defaultReinforcementDays cuando reinforcementEnabledDefault=true', async () => {
		const wrapper = mount(CompanySettingsForm, { props: { initialValue } });
		await wrapper.find('input#businessName').setValue('Empresa X');
		await wrapper.find('input#defaultFrequencyDays').setValue('30');
		const checkboxes = wrapper.findAll('input[type="checkbox"]');
		await checkboxes[0].setValue(true);
		await wrapper.find('input#defaultReinforcementDays').setValue('0');
		await wrapper.find('form').trigger('submit.prevent');
		await wrapper.vm.$nextTick();
		expect(wrapper.text()).toContain(
			'Si el refuerzo está habilitado, los días deben ser mayores a 0.',
		);
	});

	it('emite submit con payload válido', async () => {
		const wrapper = mount(CompanySettingsForm, { props: { initialValue } });
		await wrapper.find('input#businessName').setValue('Empresa XY');
		await wrapper.find('input#defaultFrequencyDays').setValue('15');
		await wrapper.find('input#defaultReinforcementDays').setValue('3');
		await wrapper.find('form').trigger('submit.prevent');
		await wrapper.vm.$nextTick();
		const emitted = wrapper.emitted('submit');
		expect(emitted).toBeTruthy();
		expect(emitted?.[0]?.[0]).toMatchObject({
			businessName: 'Empresa XY',
			defaultFrequencyDays: 15,
			defaultReinforcementDays: 3,
			reinforcementEnabledDefault: false,
			reinforcementIsPaidDefault: false,
		});
	});
});

describe('PaymentMethodForm', () => {
	it('valida name requerido', async () => {
		const wrapper = mount(PaymentMethodForm, { props: { mode: 'create' } });
		await wrapper.find('form').trigger('submit.prevent');
		await wrapper.vm.$nextTick();

		expect(wrapper.text()).toContain('El nombre es requerido.');
	});

	it('valida type requerido', async () => {
		const wrapper = mount(PaymentMethodForm, { props: { mode: 'create' } });
		await wrapper.find('input#paymentMethodName').setValue('Caja');
		await wrapper.find('select#paymentMethodType').setValue('');
		await wrapper.find('form').trigger('submit.prevent');
		await wrapper.vm.$nextTick();
		expect(wrapper.text()).toContain('El tipo es requerido.');
	});

	it('emite payload válido', async () => {
		const wrapper = mount(PaymentMethodForm, { props: { mode: 'create' } });
		await wrapper.find('input#paymentMethodName').setValue('Efectivo');
		await wrapper.find('select#paymentMethodType').setValue('cash');
		await wrapper.find('form').trigger('submit.prevent');
		await wrapper.vm.$nextTick();
		const emitted = wrapper.emitted('submit');
		expect(emitted).toBeTruthy();
		expect(emitted?.[0]?.[0]).toEqual({
			name: 'Efectivo',
			type: 'cash',
			active: true,
		});
	});
});

describe('PaymentMethodsTable', () => {
	it('muestra empty state', () => {
		const wrapper = mount(PaymentMethodsTable, { props: { methods: [] } });
		expect(wrapper.text()).toContain(
			'No hay métodos de pago activos. Crea uno para comenzar.',
		);
	});

	it('muestra filas con métodos activos', () => {
		const methods: PaymentMethod[] = [
			{ id: 'pm-1', name: 'Efectivo', type: 'cash', active: true },
		];
		const wrapper = mount(PaymentMethodsTable, { props: { methods } });

		expect(wrapper.text()).toContain('Efectivo');
		expect(wrapper.text()).toContain('Activo');
	});

	it('emite edit', async () => {
		const methods: PaymentMethod[] = [
			{ id: 'pm-1', name: 'Efectivo', type: 'cash', active: true },
		];
		const wrapper = mount(PaymentMethodsTable, { props: { methods } });
		await wrapper.find('button').trigger('click');

		expect(wrapper.emitted('edit')).toBeTruthy();
		expect(wrapper.emitted('edit')?.[0]?.[0]).toMatchObject(methods[0]);
	});

	it('emite disable', async () => {
		const methods: PaymentMethod[] = [
			{ id: 'pm-1', name: 'Efectivo', type: 'cash', active: true },
		];
		const wrapper = mount(PaymentMethodsTable, { props: { methods } });
		const buttons = wrapper.findAll('button');
		await buttons[1].trigger('click');

		expect(wrapper.emitted('disable')).toBeTruthy();
		expect(wrapper.emitted('disable')?.[0]?.[0]).toMatchObject(methods[0]);
	});
});
