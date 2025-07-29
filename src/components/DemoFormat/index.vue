<template>
  <div class="demo-format">
    <div class="demo-format__header">
      <h3 class="demo-format__title">{{ title }}</h3>
      <span v-if="badge" class="demo-format__badge" :class="`demo-format__badge--${type}`">
        {{ badge }}
      </span>
    </div>
    <div class="demo-format__content">
      <slot>
        <p class="demo-format__default-text">{{ content || 'Default content for demo format component' }}</p>
      </slot>
    </div>
    <div v-if="showActionsComputed" class="demo-format__actions">
      <button v-for="action in actions" :key="action.label" class="demo-format__action"
        :class="`demo-format__action--${action.type || 'default'}`" @click="handleAction(action)">
        {{ action.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// 定义组件属性接口
interface Action {
  label: string
  type?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  handler?: () => void
}

// 定义 Props
interface Props {
  title?: string
  content?: string
  badge?: string
  type?: 'info' | 'success' | 'warning' | 'error'
  actions?: Action[]
  showActions?: boolean
}

// 定义默认值
const props = withDefaults(defineProps<Props>(), {
  title: 'Demo Format',
  content: '',
  badge: '',
  type: 'info',
  actions: () => [],
  showActions: true
})

// 定义事件
const emit = defineEmits<{
  action: [action: Action]
}>()

// 计算属性
const showActionsComputed = computed(() => props.showActions && props.actions.length > 0)

// 方法
const handleAction = (action: Action) => {
  if (action.handler) {
    action.handler()
  }
  emit('action', action)
}
</script>

<style scoped>
.demo-format {
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  padding: 16px;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.demo-format:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.demo-format__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.demo-format__title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.demo-format__badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
}

.demo-format__badge--info {
  background: #e3f2fd;
  color: #1976d2;
}

.demo-format__badge--success {
  background: #e8f5e8;
  color: #2e7d32;
}

.demo-format__badge--warning {
  background: #fff3e0;
  color: #f57c00;
}

.demo-format__badge--error {
  background: #ffebee;
  color: #d32f2f;
}

.demo-format__content {
  margin-bottom: 16px;
  line-height: 1.6;
}

.demo-format__default-text {
  margin: 0;
  color: #666;
}

.demo-format__actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.demo-format__action {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  color: #333;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.demo-format__action:hover {
  background: #f5f5f5;
}

.demo-format__action--primary {
  background: #1976d2;
  color: white;
  border-color: #1976d2;
}

.demo-format__action--primary:hover {
  background: #1565c0;
}

.demo-format__action--success {
  background: #2e7d32;
  color: white;
  border-color: #2e7d32;
}

.demo-format__action--success:hover {
  background: #1b5e20;
}

.demo-format__action--warning {
  background: #f57c00;
  color: white;
  border-color: #f57c00;
}

.demo-format__action--warning:hover {
  background: #ef6c00;
}

.demo-format__action--danger {
  background: #d32f2f;
  color: white;
  border-color: #d32f2f;
}

.demo-format__action--danger:hover {
  background: #c62828;
}
</style>
