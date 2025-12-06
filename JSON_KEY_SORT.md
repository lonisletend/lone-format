# JSON Key Sorting Feature

## 功能说明

为 `JsonFormat` 组件添加了 JSON 对象 key 排序功能。该功能可以按字母顺序对所有对象的键进行排序，便于查看和比较 JSON 数据。

## 特性

✅ **递归排序**：深度遍历所有嵌套对象，对每个对象的 key 进行排序  
✅ **保护原数据**：排序只影响显示，不修改原始 JSON 数据  
✅ **支持过滤**：可以与过滤功能配合使用，对过滤后的数据进行排序  
✅ **可逆操作**：可以随时清除排序，恢复原始 key 顺序  

## API 使用

### 1. 启用 Key 排序

```typescript
jsonFormatRef.value?.sortKeys()
```

调用后，组件会递归地对所有对象的 key 按字母顺序排序并重新渲染。

### 2. 清除 Key 排序

```typescript
jsonFormatRef.value?.clearSortKeys()
```

恢复到原始 key 顺序。

### 3. 检查排序状态

```typescript
const sorted = jsonFormatRef.value?.isSorted()
```

返回 `true` 表示当前启用了排序，`false` 表示未排序。

## 完整示例

```vue
<template>
  <div>
    <div class="controls">
      <button @click="toggleSort">
        {{ isSortEnabled ? '清除排序' : '排序 Keys' }}
      </button>
    </div>
    
    <JsonFormat ref="jsonRef" v-model="jsonData" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import JsonFormat from 'lone-format/json-format'
import type { JsonFormatExposed } from 'lone-format/json-format'

const jsonRef = ref<JsonFormatExposed>()
const isSortEnabled = ref(false)

const jsonData = ref(JSON.stringify({
  zebra: 'last',
  apple: 'first',
  mango: 'middle',
  banana: 'second'
}, null, 2))

const toggleSort = () => {
  if (isSortEnabled.value) {
    jsonRef.value?.clearSortKeys()
    isSortEnabled.value = false
  } else {
    jsonRef.value?.sortKeys()
    isSortEnabled.value = true
  }
}
</script>
```

## 排序示例

### 排序前
```json
{
  "zebra": "last animal",
  "apple": "first fruit",
  "mango": "tropical fruit",
  "banana": "yellow fruit",
  "user": {
    "zipCode": "12345",
    "age": 25,
    "name": "Alice",
    "email": "alice@example.com"
  }
}
```

### 排序后
```json
{
  "apple": "first fruit",
  "banana": "yellow fruit",
  "mango": "tropical fruit",
  "user": {
    "age": 25,
    "email": "alice@example.com",
    "name": "Alice",
    "zipCode": "12345"
  },
  "zebra": "last animal"
}
```

## 实现原理

1. **深度复制**：排序时创建数据的深度副本，保护原始数据
2. **递归处理**：
   - 对象：提取所有 key，按字母排序后重新构建对象
   - 数组：递归处理每个元素
   - 原始类型：直接返回
3. **计算属性**：使用 Vue 的 `computed` 属性实现响应式排序
4. **状态管理**：通过 `isSorted` 状态控制是否应用排序

## 类型定义

```typescript
export interface JsonFormatExposed {
  // ... 其他方法
  
  // Key 排序相关方法
  sortKeys: () => void
  clearSortKeys: () => void
  isSorted: () => boolean
}
```

## 使用场景

- 📊 **数据对比**：对比两个 JSON 对象时，排序可以让 key 顺序一致
- 🔍 **快速查找**：在大型 JSON 中按字母顺序查找特定字段
- 📝 **文档生成**：生成 API 文档时保持字段顺序的一致性
- ✅ **测试验证**：在单元测试中验证 JSON 结构时更容易比较

## 注意事项

1. **原数据保护**：排序功能不会修改 `v-model` 绑定的原始数据
2. **性能考虑**：对于超大型 JSON（数千个对象），排序可能需要一些时间
3. **数组顺序**：数组元素的顺序保持不变，只有对象的 key 会被排序
4. **与过滤配合**：先应用过滤，再排序，或者反过来都可以

## 测试

项目中提供了测试页面 `test-key-sort.html`，可以直接在浏览器中打开测试排序功能。

```bash
# 打开测试页面
open test-key-sort.html
```

## 更新日志

- **v0.7.1+**: 新增 Key 排序功能
  - 添加 `sortKeys()` API
  - 添加 `clearSortKeys()` API
  - 添加 `isSorted()` API
  - 在 App.vue 的 Filter Test 标签页中集成排序按钮
