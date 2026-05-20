import { afterEach, vi } from 'vitest';
import { defineComponent, h } from 'vue';

vi.mock('@vuepic/vue-datepicker', () => {
  const MockDatePicker = defineComponent({
    name: 'VueDatePicker',
    props: {
      modelValue: { type: [String, Object, Array, Date, null], default: null },
      range: { type: Boolean, default: false },
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      return () =>
        h('input', {
          value: Array.isArray(props.modelValue)
            ? props.modelValue.map((value: unknown) => String(value ?? '')).join(' - ')
            : String(props.modelValue ?? ''),
          onInput: (event: Event) => {
            const value = (event.target as HTMLInputElement).value;
            if (props.range) {
              const [from, to] = value.split(',');
              const rangeValue: [Date, Date] = [
                new Date(`${(from ?? '').trim()}T00:00:00`),
                new Date(`${(to ?? '').trim()}T00:00:00`),
              ];
              emit('update:modelValue', rangeValue);
              return;
            }
            emit('update:modelValue', value ? new Date(value) : null);
          },
        });
    },
  });

  return {
    default: MockDatePicker,
    VueDatePicker: MockDatePicker,
  };
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }),
});

afterEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
});
