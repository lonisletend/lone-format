import JsonFormat from '../../components/JsonFormat/index.vue'
import type { FormatAdapter } from '../types'

const basicNested = `{
  "name": "lone-format",
  "version": "0.16.2",
  "repository": { "type": "git", "url": "https://github.com/example/lone-format" },
  "components": {
    "JsonFormat": { "filter": ["jsonpath", "js"], "deps": ["jsonpath-plus"] },
    "XmlFormat": { "filter": ["xpath"], "deps": ["fast-xml-parser", "xpath"] },
    "SqlFormat": { "filter": [], "deps": ["sql-formatter"] }
  },
  "keywords": ["vue3", "json", "xml", "sql", "formatter"]
}`

const basicArray = `{
  "total": 4,
  "rows": [
    { "id": 1, "name": "alice", "active": true, "score": 97.5, "tags": ["admin"] },
    { "id": 2, "name": "bob", "active": false, "score": 0, "tags": [] },
    { "id": 3, "name": "carol", "active": true, "score": -12.25, "tags": ["dev", "ops"] },
    { "id": 4, "name": null, "active": null, "score": null, "tags": null }
  ],
  "mixed": [1, "two", true, null, { "k": "v" }, [1, 2, [3, [4]]]]
}`

const edgeBigNumber = `{
  "note": "16 位以上整数与带尾零小数走 __protected_number__ 哨兵，复制与再序列化都不应丢精度",
  "int16": 1234567890123456,
  "int19": 9007199254740993123,
  "orderNo": 10000000000000000001,
  "trailingZero": 1.10,
  "trailingZeros": 2.000,
  "negativeBig": -9223372036854775808,
  "exp": 1.2345678901234567e+21,
  "safeInt": 42,
  "normalFloat": 3.14
}`

const edgeDeep = `{
  "l1": { "l2": { "l3": { "l4": { "l5": { "l6": { "l7": { "l8": {
    "l9": { "l10": { "l11": { "l12": { "value": "maxDepth 默认 10，调小看截断行为" } } } }
  } } } } } } } }
}`

const edgeEmpty = `{
  "emptyObject": {},
  "emptyArray": [],
  "emptyString": "",
  "zero": 0,
  "false": false,
  "null": null,
  "nestedEmpty": { "a": {}, "b": [], "c": [{}], "d": [[]] }
}`

const edgeUnicode = `{
  "中文键": "中文值，含标点：，。！",
  "emoji": "🙂🚀🇨🇳",
  "escaped": "line1\\nline2\\ttab \\"quoted\\" back\\\\slash",
  "url": "https://example.com/a?b=1&c=2#hash",
  "html": "<script>alert(1)</script>",
  "longString": "0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789",
  "keyWith.Dot": "路径以 . 分隔，这个键用来验证路径不串台",
  "key with space": 1
}`

const edgeSortable = `{
  "zebra": 1,
  "apple": { "delta": 4, "bravo": 2, "alpha": 1, "charlie": 3 },
  "Mango": 2,
  "banana": [ { "z": 1, "a": 2 } ],
  "_underscore": 3,
  "10": "数字字符串键",
  "2": "数字字符串键"
}`

const errorTrailingComma = `{
  "name": "trailing comma",
  "items": [1, 2, 3,],
}`

const errorTruncated = `{
  "name": "truncated payload",
  "items": [1, 2, 3`

const errorNotJson = `这根本不是 JSON，只是一段纯文本。`

export const jsonAdapter: FormatAdapter = {
  id: 'json',
  label: 'JSON',
  sourcePath: 'src/components/JsonFormat/index.vue',
  component: JsonFormat,
  placeholder: '粘贴或编辑 JSON，实时生效',
  fixtures: [
    { id: 'json-basic-nested', group: 'basic', label: '嵌套对象', note: '常规对象 + 数组嵌套', source: basicNested },
    { id: 'json-basic-array', group: 'basic', label: '数组与混合类型', note: '覆盖 string/number/boolean/null 全部值类型', source: basicArray },
    { id: 'json-edge-bignum', group: 'edge', label: '大数与尾零精度', note: '验证 __protected_number__ 哨兵在渲染/复制/排序后不丢精度', source: edgeBigNumber },
    { id: 'json-edge-deep', group: 'edge', label: '12 层深嵌套', note: '配合右侧 maxDepth 调参观察截断', source: edgeDeep },
    { id: 'json-edge-empty', group: 'edge', label: '空值与假值', note: '{} [] "" 0 false null 的折叠与展示', source: edgeEmpty },
    { id: 'json-edge-unicode', group: 'edge', label: '转义与特殊字符', note: '含点号键，验证 path 不串台', source: edgeUnicode },
    { id: 'json-edge-sortable', group: 'edge', label: '乱序键（排序用）', note: '点"排序"观察大小写与数字字符串键的顺序', source: edgeSortable },
    { id: 'json-error-comma', group: 'error', label: '尾随逗号', note: '应落到错误态并给出解析信息', source: errorTrailingComma },
    { id: 'json-error-truncated', group: 'error', label: '截断输入', note: '模拟流式/网络截断', source: errorTruncated },
    { id: 'json-error-plain', group: 'error', label: '非 JSON 文本', source: errorNotJson },
  ],
  actions: [
    { id: 'expand', label: '展开全部', icon: 'expand', run: api => api.expandAll() },
    { id: 'collapse', label: '折叠全部', icon: 'collapse', run: api => api.collapseAll() },
    { id: 'sort', label: '按 Key 排序', icon: 'sort', variant: 'primary', run: api => api.sortKeys(), disabled: api => api.isSorted?.() === true },
    { id: 'clear-sort', label: '取消排序', icon: 'sort-off', run: api => api.clearSortKeys(), disabled: api => api.isSorted?.() !== true },
    { id: 'copy', label: '复制', icon: 'copy', run: api => api.copyJson(), toast: 'JSON 已复制到剪贴板' },
  ],
  props: [
    { key: 'readonly', label: 'readonly', type: 'boolean', default: false, note: '只读时禁止编辑键与值' },
    { key: 'maxDepth', label: 'maxDepth', type: 'number', default: 10, min: 1, max: 20 },
  ],
  state: [
    {
      key: 'isValidJson',
      label: 'isValidJson()',
      read: api => String(api.isValidJson()),
      tone: api => (api.isValidJson() ? 'ok' : 'error'),
    },
    {
      key: 'getParseError',
      label: 'getParseError()',
      read: api => api.getParseError() || '—',
      tone: api => (api.getParseError() ? 'error' : 'muted'),
    },
    { key: 'isSorted', label: 'isSorted()', read: api => String(api.isSorted()) },
    { key: 'expanded', label: 'getExpandedNodes().size', read: api => String(api.getExpandedNodes().size) },
    {
      key: 'rootType',
      label: '根节点类型',
      read: api => {
        const parsed = api.getParsedJson()
        if (parsed === null || parsed === undefined) return '—'
        if (Array.isArray(parsed)) return 'array[' + parsed.length + ']'
        if (typeof parsed === 'object') return 'object{' + Object.keys(parsed).length + '}'
        return typeof parsed
      },
    },
    {
      key: 'filtered',
      label: 'getFilteredJson()',
      read: api => {
        const filtered = api.getFilteredJson()
        if (filtered === null || filtered === undefined) return '未过滤'
        return Array.isArray(filtered) ? 'array[' + filtered.length + ']' : typeof filtered
      },
      tone: api => (api.getFilteredJson() == null ? 'muted' : 'ok'),
    },
  ],
  events: [
    'update:modelValue',
    'copy-success',
    'copy-error',
    'expand-all',
    'collapse-all',
    'filter-success',
    'filter-error',
  ],
  filter: {
    kinds: [
      {
        value: 'jsonpath',
        label: 'JSONPath',
        placeholder: '$.rows[*].name',
        samples: ['$.rows[*].name', '$..tags', '$.rows[?(@.active==true)]', '$.components.*'],
      },
      {
        value: 'js',
        label: 'JS 表达式',
        placeholder: 'data.rows.filter(r => r.active)',
        samples: ['data.rows.filter(r => r.active)', 'Object.keys(data)', 'data.rows.map(r => r.score)'],
      },
    ],
    apply: (api, kind, expression) => api.filter({ type: kind, expression }),
    clear: api => api.clearFilter(),
    error: api => api.getFilterError(),
  },
}
