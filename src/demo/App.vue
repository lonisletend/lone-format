<script setup lang="ts">
import { computed, ref, watch, watchEffect } from 'vue'
import Icon from './Icon.vue'
import Playground from './Playground.vue'
import { jsonAdapter } from './formats/json'
import { xmlAdapter } from './formats/xml'
import { sqlAdapter } from './formats/sql'
import type { FormatAdapter, FormatId, ThemeType } from './types'

const adapters: FormatAdapter[] = [jsonAdapter, xmlAdapter, sqlAdapter]

const activeFormat = ref<FormatId>('json')
const theme = ref<ThemeType>('github-light')
const chromeDark = ref(false)

// 切主题时页面外壳跟随明暗，避免深色组件被白底包着；之后仍可手动切换
watch(theme, value => {
  chromeDark.value = value.endsWith('-dark')
})

const chrome = computed(() => (chromeDark.value ? 'dark' : 'light'))

// 同步到 <html>，让页面边缘（滚动条、overscroll 区域）也跟随明暗
watchEffect(() => {
  document.documentElement.dataset.chrome = chrome.value
})
</script>

<template>
  <div class="app" :data-chrome="chrome">
    <header class="appbar">
      <span class="brand">lone-format</span>
      <span class="brand-sub">playground</span>

      <nav class="segmented" role="tablist">
        <button
          v-for="adapter in adapters"
          :key="adapter.id"
          class="segment"
          :class="{ 'segment--active': activeFormat === adapter.id }"
          role="tab"
          :aria-selected="activeFormat === adapter.id"
          :data-testid="'format-tab-' + adapter.id"
          @click="activeFormat = adapter.id"
        >
          {{ adapter.label }}
        </button>
      </nav>

      <div class="appbar-tail">
        <button
          class="btn btn--icon btn--ghost"
          :title="chromeDark ? '切换到浅色界面' : '切换到深色界面'"
          data-testid="chrome-toggle"
          @click="chromeDark = !chromeDark"
        >
          <Icon :name="chromeDark ? 'moon' : 'sun'" />
        </button>
      </div>
    </header>

    <main class="body">
      <Playground
        v-for="adapter in adapters"
        v-show="activeFormat === adapter.id"
        :key="adapter.id"
        v-model:theme="theme"
        :adapter="adapter"
      />
    </main>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--c-bg);
  color: var(--c-text);
}

.appbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: none;
  height: var(--h-bar);
  padding: 0 10px;
  border-bottom: 1px solid var(--c-border);
  background: var(--c-bg-sunken);
}

.brand {
  font-size: var(--fs-lg);
  font-weight: 600;
  letter-spacing: -0.01em;
}

.brand-sub {
  font-size: var(--fs-sm);
  color: var(--c-text-faint);
  margin-right: 8px;
}

.segmented {
  display: inline-flex;
  padding: 2px;
  gap: 2px;
  background: var(--c-bg-active);
  border-radius: var(--radius-lg);
}

.segment {
  height: 24px;
  padding: 0 14px;
  border: none;
  border-radius: var(--radius);
  background: transparent;
  color: var(--c-text-muted);
  font-family: inherit;
  font-size: var(--fs-sm);
  font-weight: 500;
  cursor: pointer;
}

.segment:hover {
  color: var(--c-text);
}

.segment--active {
  color: var(--c-text);
  background: var(--c-bg-raised);
}

.appbar-tail {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}




.body {
  flex: 1 1 auto;
  min-height: 0;
}

.body > * {
  height: 100%;
}

@media (max-width: 1100px) {
  .app {
    height: auto;
    min-height: 100%;
  }

  .appbar {
    position: sticky;
    top: 0;
    z-index: 10;
    flex-wrap: wrap;
    height: auto;
    padding: 6px 10px;
  }

  .body > * {
    height: auto;
  }
}
</style>
