import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import MetricCard from '@/modules/dashboard/components/MetricCard.vue';

describe('MetricCard', () => {
  it('renderiza title y value', () => {
    const wrapper = mount(MetricCard, {
      props: {
        title: 'Ventas',
        value: '$100',
      },
    });

    expect(wrapper.text()).toContain('Ventas');
    expect(wrapper.text()).toContain('$100');
  });
});
