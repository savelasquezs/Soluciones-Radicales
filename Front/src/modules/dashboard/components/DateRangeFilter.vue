<template>
  <AppCard>
    <div class="flex flex-col gap-3 md:flex-row md:items-end">
      <div class="w-full">
        <label class="mb-1 block text-xs text-foreground/70" for="from-date">Desde</label>
        <AppInput id="from-date" v-model="localFrom" type="date" />
      </div>
      <div class="w-full">
        <label class="mb-1 block text-xs text-foreground/70" for="to-date">Hasta</label>
        <AppInput id="to-date" v-model="localTo" type="date" />
      </div>
      <div class="flex gap-2 md:pb-0.5">
        <AppButton :disabled="loading" @click="onApply">Aplicar</AppButton>
        <AppButton variant="secondary" :disabled="loading" @click="onReset">Este mes</AppButton>
      </div>
    </div>
  </AppCard>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import AppCard from '@/shared/components/ui/AppCard.vue';
import AppInput from '@/shared/components/ui/AppInput.vue';
import AppButton from '@/shared/components/ui/AppButton.vue';

const props = withDefaults(
  defineProps<{
    from: string;
    to: string;
    loading?: boolean;
  }>(),
  {
    loading: false,
  },
);

const emit = defineEmits<{
  apply: [{ from: string; to: string }];
  reset: [];
}>();

const localFrom = ref(props.from);
const localTo = ref(props.to);

watch(
  () => [props.from, props.to],
  ([nextFrom, nextTo]) => {
    localFrom.value = nextFrom;
    localTo.value = nextTo;
  },
);

const onApply = () => {
  emit('apply', { from: localFrom.value, to: localTo.value });
};

const onReset = () => {
  emit('reset');
};
</script>
