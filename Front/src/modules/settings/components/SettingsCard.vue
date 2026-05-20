<template>
	<AppCard
		:class="[
			'transition hover:shadow-soft',
			disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-primary',
		]"
	>
		<component :is="linkComponent" v-bind="linkProps" class="block">
			<div class="flex flex-col gap-4">
				<div class="flex items-start justify-between gap-4">
					<div>
						<h3 class="text-lg font-semibold text-foreground">{{ title }}</h3>
						<p class="mt-2 text-sm leading-6 text-foreground/70">
							{{ description }}
						</p>
					</div>
					<AppBadge v-if="badge" class="shrink-0">{{ badge }}</AppBadge>
				</div>

				<div
					v-if="disabled"
					class="rounded-xl bg-muted/50 p-3 text-xs uppercase tracking-[0.15em] text-foreground/70"
				>
					Próximamente
				</div>
			</div>
		</component>
	</AppCard>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import AppBadge from '@/shared/components/ui/AppBadge.vue';
import AppCard from '@/shared/components/ui/AppCard.vue';

type Props = {
	title: string;
	description: string;
	to?: string;
	disabled?: boolean;
	badge?: string;
};

const props = defineProps<Props>();

const linkComponent = computed(() =>
	!props.disabled && props.to ? RouterLink : 'div',
);
const linkProps = computed(() =>
	!props.disabled && props.to ? { to: props.to } : {},
);
</script>
