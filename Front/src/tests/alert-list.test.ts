import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import AlertList from '@/modules/dashboard/components/AlertList.vue';

describe('AlertList', () => {
  it('muestra empty state si no hay items', () => {
    const wrapper = mount(AlertList, {
      props: {
        title: 'Alertas',
        items: [],
        emptyMessage: 'Sin alertas',
      },
    });

    expect(wrapper.text()).toContain('Sin alertas');
  });
});
