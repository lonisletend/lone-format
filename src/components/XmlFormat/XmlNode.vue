<template>
  <div class="xml-node" :style="{ paddingLeft: level > 0 ? '16px' : '0' }">
    <!-- 注释节点 -->
    <div v-if="nodeType === 'comment'" class="xml-node__comment">
      <span :style="{ color: theme.colors.xmlComment }">
        &lt;!-- {{ commentContent }} --&gt;
      </span>
    </div>

    <!-- CDATA 节点 -->
    <div v-else-if="nodeType === 'cdata'" class="xml-node__cdata">
      <span :style="{ color: theme.colors.xmlCdata }">
        &lt;![CDATA[{{ node['__cdata'] }}]]&gt;
      </span>
    </div>

    <!-- 元素节点 -->
    <div v-else-if="nodeType === 'element'" class="xml-node__element">
      <!-- 包含 CDATA 的元素，使用内联格式 -->
      <div v-if="hasCdata" class="xml-node__line"
        ><span class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">&lt;</span
        ><span 
          class="xml-node__tag xml-node__tag--editable" 
          :style="{ color: theme.colors.xmlTag }"
          :contenteditable="isEditingTagName"
          @dblclick="editTagName"
          @contextmenu="handleContextMenu"
          @keydown.enter.prevent="saveTagNameEdit"
          @keydown.escape="cancelTagNameEdit"
          @blur="saveTagNameEdit"
          ref="tagNameRef"
          :title="'Double-click to edit tag name'"
        >{{ isEditingTagName ? editingTagNameValue : tagName }}</span
        ><span v-for="(attrValue, attrName) in attributes" :key="attrName" class="xml-node__attribute"
          ><span 
            class="xml-node__attr-name xml-node__attr-name--editable" 
            :style="{ color: theme.colors.xmlAttribute }"
            :contenteditable="isEditingAttrName === attrName"
            @dblclick="editAttrName(attrName)"
            @keydown.enter.prevent="saveAttrNameEdit"
            @keydown.escape="cancelAttrNameEdit"
            @blur="saveAttrNameEdit"
            :ref="el => { if (isEditingAttrName === attrName) attrNameRef = el as HTMLElement }"
            :title="'Double-click to edit attribute name'"
          >{{ isEditingAttrName === attrName ? editingAttrNameValue : attrName }}</span
          ><span class="xml-node__equals" :style="{ color: theme.colors.xmlEquals }">=</span
          ><span class="xml-node__quote" :style="{ color: theme.colors.xmlQuote }">"</span
          ><span 
            class="xml-node__attr-value xml-node__attr-value--editable" 
            :style="{ color: theme.colors.xmlAttributeValue }"
            :contenteditable="isEditingAttrValue === attrName"
            @dblclick="editAttrValue(attrName)"
            @keydown.enter.prevent="saveAttrValueEdit"
            @keydown.escape="cancelAttrValueEdit"
            @blur="saveAttrValueEdit"
            :ref="el => { if (isEditingAttrValue === attrName) attrValueRef = el as HTMLElement }"
            :title="'Double-click to edit attribute value'"
          >{{ isEditingAttrValue === attrName ? editingAttrValueValue : attrValue }}</span
          ><span class="xml-node__quote" :style="{ color: theme.colors.xmlQuote }">"</span></span
        ><span class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">&gt;</span
        ><span class="xml-node__cdata" :style="{ color: theme.colors.xmlCdata }">&lt;![CDATA[</span
        ><span 
          class="xml-node__cdata-content xml-node__cdata-content--editable"
          :style="{ color: theme.colors.xmlCdata }"
          :contenteditable="isEditingCdataContent"
          @dblclick="editCdataContent"
          @keydown.enter.prevent="saveCdataContentEdit"
          @keydown.escape="cancelCdataContentEdit"
          @blur="saveCdataContentEdit"
          ref="cdataContentRef"
          :title="'Double-click to edit CDATA content'"
        >{{ isEditingCdataContent ? editingCdataContentValue : cdataContent }}</span
        ><span class="xml-node__cdata" :style="{ color: theme.colors.xmlCdata }">]]&gt;</span
        ><span class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">&lt;/</span
        ><span 
          class="xml-node__tag" 
          :style="{ color: theme.colors.xmlTag }"
        >{{ isEditingTagName ? editingTagNameValue : tagName }}</span
        ><span class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">&gt;</span>
      </div>
      
      <!-- 只有文本内容的简单元素，使用内联格式 -->
      <div v-else-if="isSimpleTextElement" class="xml-node__line"
        ><span class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">&lt;</span
        ><span 
          class="xml-node__tag xml-node__tag--editable" 
          :style="{ color: theme.colors.xmlTag }"
          :contenteditable="isEditingTagName"
          @dblclick="editTagName"
          @contextmenu="handleContextMenu"
          @keydown.enter.prevent="saveTagNameEdit"
          @keydown.escape="cancelTagNameEdit"
          @blur="saveTagNameEdit"
          ref="tagNameRef"
          :title="'Double-click to edit tag name'"
        >{{ isEditingTagName ? editingTagNameValue : tagName }}</span
        ><span v-for="(attrValue, attrName) in attributes" :key="attrName" class="xml-node__attribute"
          ><span 
            class="xml-node__attr-name xml-node__attr-name--editable" 
            :style="{ color: theme.colors.xmlAttribute }"
            :contenteditable="isEditingAttrName === attrName"
            @dblclick="editAttrName(attrName)"
            @keydown.enter.prevent="saveAttrNameEdit"
            @keydown.escape="cancelAttrNameEdit"
            @blur="saveAttrNameEdit"
            :ref="el => { if (isEditingAttrName === attrName) attrNameRef = el as HTMLElement }"
            :title="'Double-click to edit attribute name'"
          >{{ isEditingAttrName === attrName ? editingAttrNameValue : attrName }}</span
          ><span class="xml-node__equals" :style="{ color: theme.colors.xmlEquals }">=</span
          ><span class="xml-node__quote" :style="{ color: theme.colors.xmlQuote }">"</span
          ><span 
            class="xml-node__attr-value xml-node__attr-value--editable" 
            :style="{ color: theme.colors.xmlAttributeValue }"
            :contenteditable="isEditingAttrValue === attrName"
            @dblclick="editAttrValue(attrName)"
            @keydown.enter.prevent="saveAttrValueEdit"
            @keydown.escape="cancelAttrValueEdit"
            @blur="saveAttrValueEdit"
            :ref="el => { if (isEditingAttrValue === attrName) attrValueRef = el as HTMLElement }"
            :title="'Double-click to edit attribute value'"
          >{{ isEditingAttrValue === attrName ? editingAttrValueValue : attrValue }}</span
          ><span class="xml-node__quote" :style="{ color: theme.colors.xmlQuote }">"</span></span
        ><span class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">&gt;</span
        ><span 
          class="xml-node__text-content xml-node__text-content--editable" 
          :style="{ color: theme.colors.xmlText }"
          :contenteditable="isEditingTextContent"
          @dblclick="editTextContent"
          @keydown.enter.prevent="saveTextContentEdit"
          @keydown.escape="cancelTextContentEdit"
          @blur="saveTextContentEdit"
          ref="textContentRef"
          :title="'Double-click to edit text content'"
        >{{ isEditingTextContent ? editingTextContentValue : textContent }}</span
        ><span class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">&lt;/</span
        ><span 
          class="xml-node__tag" 
          :style="{ color: theme.colors.xmlTag }"
        >{{ isEditingTagName ? editingTagNameValue : tagName }}</span
        ><span class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">&gt;</span>
      </div>
      
      <!-- 空元素 - 自闭合格式 -->
      <div v-else-if="isEmptyElement && isSelfClosing" class="xml-node__line"
        ><span class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">&lt;</span
        ><span 
          class="xml-node__tag xml-node__tag--editable" 
          :style="{ color: theme.colors.xmlTag }"
          :contenteditable="isEditingTagName"
          @dblclick="editTagName"
          @contextmenu="handleContextMenu"
          @keydown.enter.prevent="saveTagNameEdit"
          @keydown.escape="cancelTagNameEdit"
          @blur="saveTagNameEdit"
          ref="tagNameRef"
          :title="'Double-click to edit tag name'"
        >{{ isEditingTagName ? editingTagNameValue : tagName }}</span
        ><span v-for="(attrValue, attrName) in attributes" :key="attrName" class="xml-node__attribute"
          ><span 
            class="xml-node__attr-name xml-node__attr-name--editable" 
            :style="{ color: theme.colors.xmlAttribute }"
            :contenteditable="isEditingAttrName === attrName"
            @dblclick="editAttrName(attrName)"
            @keydown.enter.prevent="saveAttrNameEdit"
            @keydown.escape="cancelAttrNameEdit"
            @blur="saveAttrNameEdit"
            :ref="el => { if (isEditingAttrName === attrName) attrNameRef = el as HTMLElement }"
            :title="'Double-click to edit attribute name'"
          >{{ isEditingAttrName === attrName ? editingAttrNameValue : attrName }}</span
          ><span class="xml-node__equals" :style="{ color: theme.colors.xmlEquals }">=</span
          ><span class="xml-node__quote" :style="{ color: theme.colors.xmlQuote }">"</span
          ><span 
            class="xml-node__attr-value xml-node__attr-value--editable" 
            :style="{ color: theme.colors.xmlAttributeValue }"
            :contenteditable="isEditingAttrValue === attrName"
            @dblclick="editAttrValue(attrName)"
            @keydown.enter.prevent="saveAttrValueEdit"
            @keydown.escape="cancelAttrValueEdit"
            @blur="saveAttrValueEdit"
            :ref="el => { if (isEditingAttrValue === attrName) attrValueRef = el as HTMLElement }"
            :title="'Double-click to edit attribute value'"
          >{{ isEditingAttrValue === attrName ? editingAttrValueValue : attrValue }}</span
          ><span class="xml-node__quote" :style="{ color: theme.colors.xmlQuote }">"</span></span
        ><span class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }"> /&gt;</span>
      </div>
      
      <!-- 空元素 - 配对标签格式 -->
      <div v-else-if="isEmptyElement" class="xml-node__line"
        ><span class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">&lt;</span
        ><span 
          class="xml-node__tag xml-node__tag--editable" 
          :style="{ color: theme.colors.xmlTag }"
          :contenteditable="isEditingTagName"
          @dblclick="editTagName"
          @contextmenu="handleContextMenu"
          @keydown.enter.prevent="saveTagNameEdit"
          @keydown.escape="cancelTagNameEdit"
          @blur="saveTagNameEdit"
          ref="tagNameRef"
          :title="'Double-click to edit tag name'"
        >{{ isEditingTagName ? editingTagNameValue : tagName }}</span
        ><span v-for="(attrValue, attrName) in attributes" :key="attrName" class="xml-node__attribute"
          ><span 
            class="xml-node__attr-name xml-node__attr-name--editable" 
            :style="{ color: theme.colors.xmlAttribute }"
            :contenteditable="isEditingAttrName === attrName"
            @dblclick="editAttrName(attrName)"
            @keydown.enter.prevent="saveAttrNameEdit"
            @keydown.escape="cancelAttrNameEdit"
            @blur="saveAttrNameEdit"
            :ref="el => { if (isEditingAttrName === attrName) attrNameRef = el as HTMLElement }"
            :title="'Double-click to edit attribute name'"
          >{{ isEditingAttrName === attrName ? editingAttrNameValue : attrName }}</span
          ><span class="xml-node__equals" :style="{ color: theme.colors.xmlEquals }">=</span
          ><span class="xml-node__quote" :style="{ color: theme.colors.xmlQuote }">"</span
          ><span 
            class="xml-node__attr-value xml-node__attr-value--editable" 
            :style="{ color: theme.colors.xmlAttributeValue }"
            :contenteditable="isEditingAttrValue === attrName"
            @dblclick="editAttrValue(attrName)"
            @keydown.enter.prevent="saveAttrValueEdit"
            @keydown.escape="cancelAttrValueEdit"
            @blur="saveAttrValueEdit"
            :ref="el => { if (isEditingAttrValue === attrName) attrValueRef = el as HTMLElement }"
            :title="'Double-click to edit attribute value'"
          >{{ isEditingAttrValue === attrName ? editingAttrValueValue : attrValue }}</span
          ><span class="xml-node__quote" :style="{ color: theme.colors.xmlQuote }">"</span></span
        ><span class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">&gt;&lt;/</span
        ><span 
          class="xml-node__tag" 
          :style="{ color: theme.colors.xmlTag }"
        >{{ isEditingTagName ? editingTagNameValue : tagName }}</span
        ><span class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">&gt;</span>
      </div>
      
      <!-- 有子元素或可折叠的复杂元素 -->
      <div v-else>
        <!-- 折叠状态：显示完整的开始和结束标签 -->
        <div v-if="!isExpanded && hasChildren" class="xml-node__line">
          <!-- 开始标签 - 可点击展开 -->
          <span
            class="xml-node__clickable-part"
            @click="toggleCollapse()"
            :title="'Click to expand'"
            ><span class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">&lt;</span
            ><span 
              class="xml-node__tag xml-node__tag--editable" 
              :style="{ color: theme.colors.xmlTag }"
              :contenteditable="isEditingTagName"
              @dblclick.stop="editTagName"
              @contextmenu="handleContextMenu"
              @keydown.enter.prevent="saveTagNameEdit"
              @keydown.escape="cancelTagNameEdit"
              @blur="saveTagNameEdit"
              ref="tagNameRef"
              :title="'Double-click or right-click to edit tag name'"
            >{{ isEditingTagName ? editingTagNameValue : tagName }}</span
          ></span>
          <!-- 属性列表 -->
          <span v-for="(attrValue, attrName) in attributes" :key="attrName" class="xml-node__attribute"
            ><span 
              class="xml-node__attr-name xml-node__attr-name--editable" 
              :style="{ color: theme.colors.xmlAttribute }"
              :contenteditable="isEditingAttrName === attrName"
              @dblclick="editAttrName(attrName)"
              @keydown.enter.prevent="saveAttrNameEdit"
              @keydown.escape="cancelAttrNameEdit"
              @blur="saveAttrNameEdit"
              :ref="el => { if (isEditingAttrName === attrName) attrNameRef = el as HTMLElement }"
              :title="'Double-click to edit attribute name'"
            >{{ isEditingAttrName === attrName ? editingAttrNameValue : attrName }}</span
            ><span class="xml-node__equals" :style="{ color: theme.colors.xmlEquals }">=</span
            ><span class="xml-node__quote" :style="{ color: theme.colors.xmlQuote }">"</span
            ><span 
              class="xml-node__attr-value xml-node__attr-value--editable" 
              :style="{ color: theme.colors.xmlAttributeValue }"
              :contenteditable="isEditingAttrValue === attrName"
              @dblclick="editAttrValue(attrName)"
              @keydown.enter.prevent="saveAttrValueEdit"
              @keydown.escape="cancelAttrValueEdit"
              @blur="saveAttrValueEdit"
              :ref="el => { if (isEditingAttrValue === attrName) attrValueRef = el as HTMLElement }"
              :title="'Double-click to edit attribute value'"
            >{{ isEditingAttrValue === attrName ? editingAttrValueValue : attrValue }}</span
            ><span class="xml-node__quote" :style="{ color: theme.colors.xmlQuote }">"</span
          ></span>
          <!-- 右括号 - 可点击展开 -->
          <span
            class="xml-node__clickable-part"
            @click="toggleCollapse()"
            :title="'Click to expand'"
            ><span class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">&gt;</span
          ></span>
          <!-- 折叠信息：显示子标签数量 -->
          <span 
            class="xml-node__collapsed-badge" 
            :style="{ 
              backgroundColor: theme.colors.collapsedBackground,
              color: theme.colors.collapsedText
            }"
            @click="toggleCollapse()"
            :title="`Click to expand ${collapsedChildrenCount} tag${collapsedChildrenCount > 1 ? 's' : ''}`"
          >{{ collapsedChildrenCount }} tag{{ collapsedChildrenCount > 1 ? 's' : '' }}</span>
          <!-- 结束标签 - 可点击展开 -->
          <span
            class="xml-node__clickable-part"
            @click="toggleCollapse()"
            :title="'Click to expand'"
          >
            <span class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">&lt;/</span>
            <span 
              class="xml-node__tag" 
              :style="{ color: theme.colors.xmlTag }"
            >{{ isEditingTagName ? editingTagNameValue : tagName }}</span>
            <span class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">&gt;</span>
          </span>
        </div>

        <!-- 展开状态：原有的结构 -->
        <template v-else>
        <!-- 开始标签 -->
        <div class="xml-node__line">
          <!-- 可点击的部分：左括号和标签名 -->
          <span
            v-if="hasChildren"
            class="xml-node__clickable-part"
            @click="toggleCollapse()"
            :title="isExpanded ? 'Click to collapse' : 'Click to expand'"
            ><span class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">&lt;</span
            ><span 
              class="xml-node__tag xml-node__tag--editable" 
              :style="{ color: theme.colors.xmlTag }"
              :contenteditable="isEditingTagName"
              @dblclick.stop="editTagName"
              @contextmenu="handleContextMenu"
              @keydown.enter.prevent="saveTagNameEdit"
              @keydown.escape="cancelTagNameEdit"
              @blur="saveTagNameEdit"
              ref="tagNameRef"
              :title="'Double-click or right-click to edit tag name'"
            >{{ isEditingTagName ? editingTagNameValue : tagName }}</span
          ></span>
          <!-- 无子节点时，不可点击 -->
          <span v-else
            ><span class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">&lt;</span
            ><span 
              class="xml-node__tag xml-node__tag--editable" 
              :style="{ color: theme.colors.xmlTag }"
              :contenteditable="isEditingTagName"
              @dblclick="editTagName"
              @keydown.enter.prevent="saveTagNameEdit"
              @keydown.escape="cancelTagNameEdit"
              @blur="saveTagNameEdit"
              ref="tagNameRef"
              :title="'Double-click to edit tag name'"
            >{{ isEditingTagName ? editingTagNameValue : tagName }}</span
          ></span>
          <!-- 属性列表：不可点击 -->
          <span v-for="(attrValue, attrName) in attributes" :key="attrName" class="xml-node__attribute"
            ><span 
              class="xml-node__attr-name xml-node__attr-name--editable" 
              :style="{ color: theme.colors.xmlAttribute }"
              :contenteditable="isEditingAttrName === attrName"
              @dblclick="editAttrName(attrName)"
              @keydown.enter.prevent="saveAttrNameEdit"
              @keydown.escape="cancelAttrNameEdit"
              @blur="saveAttrNameEdit"
              :ref="el => { if (isEditingAttrName === attrName) attrNameRef = el as HTMLElement }"
              :title="'Double-click to edit attribute name'"
            >{{ isEditingAttrName === attrName ? editingAttrNameValue : attrName }}</span
            ><span class="xml-node__equals" :style="{ color: theme.colors.xmlEquals }">=</span
            ><span class="xml-node__quote" :style="{ color: theme.colors.xmlQuote }">"</span
            ><span 
              class="xml-node__attr-value xml-node__attr-value--editable" 
              :style="{ color: theme.colors.xmlAttributeValue }"
              :contenteditable="isEditingAttrValue === attrName"
              @dblclick="editAttrValue(attrName)"
              @keydown.enter.prevent="saveAttrValueEdit"
              @keydown.escape="cancelAttrValueEdit"
              @blur="saveAttrValueEdit"
              :ref="el => { if (isEditingAttrValue === attrName) attrValueRef = el as HTMLElement }"
              :title="'Double-click to edit attribute value'"
            >{{ isEditingAttrValue === attrName ? editingAttrValueValue : attrValue }}</span
            ><span class="xml-node__quote" :style="{ color: theme.colors.xmlQuote }">"</span
          ></span>
          <!-- 可点击的部分：右括号 -->
          <span
            v-if="hasChildren"
            class="xml-node__clickable-part"
            @click="toggleCollapse()"
            :title="isExpanded ? 'Click to collapse' : 'Click to expand'"
            ><span class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">&gt;</span
          ></span>
          <!-- 无子节点时的自闭合标签 -->
          <span v-else class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">{{ hasChildren ? '&gt;' : '/&gt;' }}</span>
        </div>

        <!-- 子节点 -->
        <div v-if="isExpanded && hasChildren" class="xml-node__children">
          <!-- 文本内容（如果只有文本，无子元素） -->
          <div v-if="children.length === 0 && textContent.trim()" class="xml-node__text">
            <span 
              class="xml-node__text-content xml-node__text-content--editable" 
              :style="{ color: theme.colors.xmlText }"
              :contenteditable="isEditingTextContent"
              @dblclick="editTextContent"
              @keydown.enter.prevent="saveTextContentEdit"
              @keydown.escape="cancelTextContentEdit"
              @blur="saveTextContentEdit"
              ref="textContentRef"
              :title="'Double-click to edit text content'"
            >
              {{ isEditingTextContent ? editingTextContentValue : textContent }}
            </span>
          </div>
          
          <!-- 子元素节点（递归） -->
          <XmlNode
            v-for="(child, childIndex) in children"
            :key="getChildKey(child, childIndex)"
            :node="child"
            :index="childIndex"
            :level="level + 1"
            :parent-path="childPath()"
            :expanded="expanded"
            :theme="theme"
            :selfClosingTags="selfClosingTags"
            @toggle-expand="(path) => $emit('toggle-expand', path)"
            @copy="(value) => $emit('copy', value)"
            @update:tagName="(path, oldTag, newTag) => $emit('update:tagName', path, oldTag, newTag)"
            @update:attributeName="(path, oldAttr, newAttr) => $emit('update:attributeName', path, oldAttr, newAttr)"
            @update:attributeValue="(path, attr, newValue) => $emit('update:attributeValue', path, attr, newValue)"
            @update:textContent="(path, newContent) => $emit('update:textContent', path, newContent)"
            @update:cdataContent="(path, newContent) => $emit('update:cdataContent', path, newContent)"
          />
        </div>

        <!-- 结束标签 -->
        <div v-if="isExpanded && hasChildren" class="xml-node__line">
          <span
            class="xml-node__clickable-part"
            @click="toggleCollapse()"
            title="Click to collapse"
          >
            <span class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">&lt;/</span>
            <span 
              class="xml-node__tag" 
              :style="{ color: theme.colors.xmlTag }"
            >{{ isEditingTagName ? editingTagNameValue : tagName }}</span>
            <span class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">&gt;</span>
          </span>
        </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import type { ThemeConfig } from './types'

interface Props {
  node: any              // preserveOrder: true 的节点对象
  index: number          // 当前节点在父数组中的索引
  level: number
  parentPath?: string    // 父节点路径
  expanded: Set<string>
  theme: ThemeConfig
  selfClosingTags?: Set<string>  // 自闭合标签集合
}

const props = withDefaults(defineProps<Props>(), {
  parentPath: '',
  level: 0,
  selfClosingTags: () => new Set()
})

const emit = defineEmits<{
  'toggle-expand': [path: string]
  'copy': [value: any]
  'update:tagName': [path: string, oldTag: string, newTag: string]
  'update:attributeName': [path: string, oldAttrName: string, newAttrName: string]
  'update:attributeValue': [path: string, attrName: string, newValue: string]
  'update:textContent': [path: string, newContent: string]
  'update:cdataContent': [path: string, newContent: string]
}>()

// 编辑状态
const isEditingTagName = ref(false)
const isEditingAttrName = ref<string | null>(null)
const isEditingAttrValue = ref<string | null>(null)
const isEditingTextContent = ref(false)
const isEditingCdataContent = ref(false)

const editingTagNameValue = ref('')
const editingAttrNameValue = ref('')
const editingAttrValueValue = ref('')
const editingTextContentValue = ref('')
const editingCdataContentValue = ref('')

// 元素引用
const tagNameRef = ref<HTMLElement | null>(null)
const attrNameRef = ref<HTMLElement | null>(null)
const attrValueRef = ref<HTMLElement | null>(null)
const textContentRef = ref<HTMLElement | null>(null)
const cdataContentRef = ref<HTMLElement | null>(null)

// 获取节点的标签名
const tagName = computed(() => {
  // 查找非特殊属性的键名作为标签名
  const keys = Object.keys(props.node)
  return keys.find(key => !key.startsWith(':') && !key.startsWith('#')) || ''
})

// 当前节点路径
const currentPath = computed(() => {
  if (!tagName.value) return ''
  return props.parentPath 
    ? `${props.parentPath}.${tagName.value}[${props.index}]` 
    : `${tagName.value}[${props.index}]`
})

// 是否展开
const isExpanded = computed(() => props.expanded.has(currentPath.value))

// 节点类型判断
const nodeType = computed(() => {
  if (props.node['#comment']) return 'comment'
  if (props.node['__cdata']) return 'cdata'
  if (tagName.value) return 'element'
  return 'unknown'
})

// 属性对象（:@ 格式）
const attributes = computed(() => {
  const attrs = props.node[':@'] || {}
  const result: Record<string, string> = {}
  Object.keys(attrs).forEach(key => {
    if (key.startsWith('@_')) {
      result[key.substring(2)] = attrs[key]
    }
  })
  return result
})

// 子节点数组
const children = computed(() => {
  if (nodeType.value !== 'element' || !tagName.value) return []
  const childArray = props.node[tagName.value]
  return Array.isArray(childArray) ? childArray : []
})

// 检查是否包含 CDATA
const hasCdata = computed(() => {
  return children.value.some((child: any) => child['__cdata'])
})

// CDATA 内容
const cdataContent = computed(() => {
  if (!hasCdata.value) return ''
  const cdataNode = children.value.find((child: any) => child['__cdata'])
  if (cdataNode && Array.isArray(cdataNode['__cdata'])) {
    const cdataArray = cdataNode['__cdata']
    if (cdataArray.length > 0 && cdataArray[0]['#text']) {
      return cdataArray[0]['#text']
    }
  }
  return ''
})

// 文本内容
const textContent = computed(() => {
  if (nodeType.value !== 'element' || !tagName.value) return ''
  
  // 如果有 CDATA，不显示文本内容
  if (hasCdata.value) return ''
  
  const childArray = props.node[tagName.value]
  if (!Array.isArray(childArray)) return ''
  
  // 查找文本节点
  const textNode = childArray.find((child: any) => child['#text'])
  return textNode ? textNode['#text'] : ''
})

// 注释内容
const commentContent = computed(() => {
  if (nodeType.value !== 'comment') return ''
  const commentArray = props.node['#comment']
  if (Array.isArray(commentArray) && commentArray.length > 0) {
    return commentArray[0]['#text'] || ''
  }
  return ''
})

// 是否有子元素（不包括纯文本）
const hasChildren = computed(() => {
  return children.value.some((child: any) => {
    const keys = Object.keys(child)
    return keys.some(key => !key.startsWith('#') && !key.startsWith(':'))
  })
})

// 计算折叠的子标签数量
const collapsedChildrenCount = computed(() => {
  if (!hasChildren.value) return 0
  return children.value.filter((child: any) => {
    const keys = Object.keys(child)
    return keys.some(key => !key.startsWith('#') && !key.startsWith(':'))
  }).length
})

// 是否是简单文本元素（包括只有空白的元素）
const isSimpleTextElement = computed(() => {
  return nodeType.value === 'element' && 
         !hasChildren.value && 
         textContent.value !== '' // 只要有内容就算（包括空白字符）
})

// 是否是空元素（没有任何内容）
const isEmptyElement = computed(() => {
  return nodeType.value === 'element' && 
         !hasChildren.value && 
         textContent.value === ''
})

// 是否是自闭合标签
const isSelfClosing = computed(() => {
  if (!isEmptyElement.value) return false
  return props.selfClosingTags?.has(tagName.value) || false
})

// 切换展开/折叠
const toggleCollapse = () => {
  if (hasChildren.value) {
    emit('toggle-expand', currentPath.value)
  }
}

// 获取子节点的唯一 key
const getChildKey = (_child: any, index: number) => {
  return `${currentPath.value}-child-${index}`
}

// 生成子节点路径（用于递归传递给子组件）
const childPath = (): string => {
  // 返回的路径是父路径 + 当前标签名
  // 例如：library[0] → library[0].library
  return `${currentPath.value}.${tagName.value}`
}

// 编辑功能方法
const editTagName = () => {
  isEditingTagName.value = true
  editingTagNameValue.value = tagName.value
  
  nextTick(() => {
    if (tagNameRef.value) {
      tagNameRef.value.focus()
      const range = document.createRange()
      range.selectNodeContents(tagNameRef.value)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
    }
  })
}

const editAttrName = (attrName: string) => {
  isEditingAttrName.value = attrName
  editingAttrNameValue.value = attrName
  
  nextTick(() => {
    if (attrNameRef.value) {
      attrNameRef.value.focus()
      const range = document.createRange()
      range.selectNodeContents(attrNameRef.value)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
    }
  })
}

const editAttrValue = (attrName: string) => {
  isEditingAttrValue.value = attrName
  editingAttrValueValue.value = attributes.value[attrName] || ''
  
  nextTick(() => {
    if (attrValueRef.value) {
      attrValueRef.value.focus()
      const range = document.createRange()
      range.selectNodeContents(attrValueRef.value)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
    }
  })
}

const editTextContent = () => {
  isEditingTextContent.value = true
  editingTextContentValue.value = textContent.value
  
  nextTick(() => {
    if (textContentRef.value) {
      textContentRef.value.focus()
      const range = document.createRange()
      range.selectNodeContents(textContentRef.value)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
    }
  })
}

const saveTagNameEdit = () => {
  if (!isEditingTagName.value) return
  
  const newTag = tagNameRef.value?.innerText.trim() || ''
  
  if (!newTag || newTag === tagName.value) {
    isEditingTagName.value = false
    return
  }
  
  isEditingTagName.value = false
  emit('update:tagName', currentPath.value, tagName.value, newTag)
}

const saveAttrNameEdit = () => {
  if (!isEditingAttrName.value) return
  
  const oldAttrName = isEditingAttrName.value
  const newAttrName = attrNameRef.value?.innerText.trim() || ''
  
  if (!newAttrName || newAttrName === oldAttrName) {
    isEditingAttrName.value = null
    return
  }
  
  isEditingAttrName.value = null
  emit('update:attributeName', currentPath.value, oldAttrName, newAttrName)
}

const saveAttrValueEdit = () => {
  if (!isEditingAttrValue.value) return
  
  const attrName = isEditingAttrValue.value
  const newValue = attrValueRef.value?.innerText.trim() || ''
  
  isEditingAttrValue.value = null
  emit('update:attributeValue', currentPath.value, attrName, newValue)
}

const saveTextContentEdit = () => {
  if (!isEditingTextContent.value) return
  
  const newContent = textContentRef.value?.innerText || ''
  
  if (newContent === textContent.value) {
    isEditingTextContent.value = false
    return
  }
  
  isEditingTextContent.value = false
  emit('update:textContent', currentPath.value, newContent)
}

const cancelTagNameEdit = () => {
  isEditingTagName.value = false
  editingTagNameValue.value = tagName.value
}

const cancelAttrNameEdit = () => {
  if (isEditingAttrName.value) {
    editingAttrNameValue.value = isEditingAttrName.value
    isEditingAttrName.value = null
  }
}

const cancelAttrValueEdit = () => {
  if (isEditingAttrValue.value) {
    editingAttrValueValue.value = attributes.value[isEditingAttrValue.value] || ''
    isEditingAttrValue.value = null
  }
}

const cancelTextContentEdit = () => {
  isEditingTextContent.value = false
  editingTextContentValue.value = textContent.value
}

// CDATA 编辑方法
const editCdataContent = () => {
  isEditingCdataContent.value = true
  editingCdataContentValue.value = cdataContent.value
  
  nextTick(() => {
    if (cdataContentRef.value) {
      cdataContentRef.value.focus()
      const range = document.createRange()
      range.selectNodeContents(cdataContentRef.value)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
    }
  })
}

const saveCdataContentEdit = () => {
  if (!isEditingCdataContent.value) return
  
  const newContent = cdataContentRef.value?.innerText || ''
  
  if (newContent === cdataContent.value) {
    isEditingCdataContent.value = false
    return
  }
  
  isEditingCdataContent.value = false
  emit('update:cdataContent', currentPath.value, newContent)
}

const cancelCdataContentEdit = () => {
  isEditingCdataContent.value = false
  editingCdataContentValue.value = cdataContent.value
}

const handleContextMenu = (event: MouseEvent) => {
  if (hasChildren.value) {
    event.preventDefault()
    editTagName()
  }
}

</script>

<style scoped>
/* 字体由父组件 .xml-format 统一控制 */

.xml-node__line {
  display: inline-block;
  user-select: text;
}

.xml-node__clickable-part {
  cursor: pointer;
  /* user-select: none; */
  display: inline-block;
  border-radius: 3px;
  transition: background-color 0.15s ease;
}

.xml-node__clickable-part:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.xml-node__tag {
  font-weight: 600;
}

.xml-node__attribute {
  margin-left: 6px;
}

.xml-node__attr-name {
  font-weight: 500;
}

.xml-node__attr-value {
  font-style: normal;
}

.xml-node__collapsed-badge {
  margin: 0 6px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
  display: inline-block;
  vertical-align: middle;
}

.xml-node__collapsed-badge:hover {
  opacity: 0.85;
  transform: scale(1.05);
}

.xml-node__collapsed {
  margin-left: 4px;
  font-style: italic;
}

.xml-node__collapsed--clickable {
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 3px;
  transition: background-color 0.15s ease;
  user-select: none;
}

.xml-node__collapsed--clickable:hover {
  background-color: rgba(0, 0, 0, 0.08);
  font-weight: 500;
}

.xml-node__children {
  margin-left: 0;
  position: relative;
}

/* 缩进对齐线 */
.xml-node__children::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 1px;
  background: v-bind('theme.colors.indentLine');
  opacity: 0.3;
  pointer-events: none;
}

.xml-node__text-content {
  white-space: pre-wrap;
  word-break: break-word;
}

.xml-node__comment {
  font-style: italic;
  opacity: 0.8;
}

.xml-node__cdata {
  opacity: 0.9;
}

/* 编辑功能样式 */
.xml-node__tag--editable,
.xml-node__attr-name--editable,
.xml-node__attr-value--editable,
.xml-node__text-content--editable,
.xml-node__cdata-content--editable {
  cursor: pointer;
  padding: 1px 3px;
  border-radius: 3px;
  transition: background-color 0.15s ease;
}

.xml-node__tag--editable:hover,
.xml-node__attr-name--editable:hover,
.xml-node__attr-value--editable:hover,
.xml-node__text-content--editable:hover,
.xml-node__cdata-content--editable:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

/* 编辑状态样式 */
.xml-node__tag--editable[contenteditable="true"],
.xml-node__attr-name--editable[contenteditable="true"],
.xml-node__attr-value--editable[contenteditable="true"],
.xml-node__text-content--editable[contenteditable="true"],
.xml-node__cdata-content--editable[contenteditable="true"] {
  border: 1px solid #0969da;
  border-radius: 3px;
  padding: 1px 3px;
  background: rgba(9, 105, 218, 0.05);
  outline: none;
  cursor: text;
  min-width: 10px;
  display: inline-block;
}

.xml-node__tag--editable[contenteditable="true"]::selection,
.xml-node__attr-name--editable[contenteditable="true"]::selection,
.xml-node__attr-value--editable[contenteditable="true"]::selection,
.xml-node__text-content--editable[contenteditable="true"]::selection,
.xml-node__cdata-content--editable[contenteditable="true"]::selection {
  background-color: rgba(9, 105, 218, 0.2);
}
</style>
