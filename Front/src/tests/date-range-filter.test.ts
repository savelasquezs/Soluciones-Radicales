import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import DateRangeFilter from '@/modules/dashboard/components/DateRangeFilter.vue';

describe('DateRangeFilter', () => {
  it('emite filtros al aplicar', async () => {
    const wrapper = mount(DateRangeFilter, {
      props: {
        from: '2026-01-01',
        to: '2026-01-31',
      },
    });

    const inputs = wrapper.findAll('input');
    await inputs[0].setValue('2026-02-01');
    await inputs[1].setValue('2026-02-28');

    await wrapper.findAll('button')[0].trigger('click');

    expect(wrapper.emitted('apply')?.[0]?.[0]).toEqual({
      from: '2026-02-01',
      to: '2026-02-28',
    });
  });
});
