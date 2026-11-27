<script setup lang="ts">
import type { IconName } from './types'

defineProps<{ name: IconName; size?: number }>()

const PATHS: Record<IconName, string[]> = {
  expand: ['M7 13l5 5 5-5', 'M7 6l5 5 5-5'],
  collapse: ['M7 11l5-5 5 5', 'M7 18l5-5 5 5'],
  sort: ['M4 6h14', 'M4 12h9', 'M4 18h5'],
  'sort-off': ['M4 6h14', 'M4 12h9', 'M4 18h5', 'M20 4L6 20'],
  format: ['M4 6h16', 'M4 10h10', 'M4 14h13', 'M4 18h7'],
  compress: ['M9 4v5H4', 'M15 20v-5h5', 'M9 20v-5H4', 'M15 4v5h5'],
  copy: ['M9 9h9v9H9z', 'M6 15H5a1 1 0 01-1-1V5a1 1 0 011-1h9a1 1 0 011 1v1'],
  filter: ['M3 5h18l-7 8v6l-4 2v-8z'],
  close: ['M6 6l12 12', 'M18 6L6 18'],
  check: ['M4 12l5 5L20 6'],
  alert: ['M12 4l9 16H3z', 'M12 10v4', 'M12 17h.01'],
  sun: [
    'M12 7a5 5 0 100 10 5 5 0 000-10',
    'M12 2v2',
    'M12 20v2',
    'M4.9 4.9l1.4 1.4',
    'M17.7 17.7l1.4 1.4',
    'M2 12h2',
    'M20 12h2',
    'M4.9 19.1l1.4-1.4',
    'M17.7 6.3l1.4-1.4',
  ],
  moon: ['M20 14a8 8 0 11-10-10 7 7 0 0010 10z'],
  panel: ['M4 5h16v14H4z', 'M14 5v14'],
}
</script>

<template>
  <svg
    class="icon"
    :width="size || 14"
    :height="size || 14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path v-for="(d, i) in PATHS[name]" :key="i" :d="d" />
  </svg>
</template>

<style scoped>
.icon {
  flex: none;
  display: block;
}
</style>
