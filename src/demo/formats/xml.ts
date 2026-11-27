import XmlFormat from '../../components/XmlFormat/index.vue'
import type { FormatAdapter } from '../types'

const basicLibrary = `<?xml version="1.0" encoding="UTF-8"?>
<!-- 图书馆示例数据 -->
<library name="city-central" updated="2026-11-13">
  <book id="1" category="programming">
    <title lang="en">Learning TypeScript</title>
    <author>Josh Goldberg</author>
    <price currency="USD">49.99</price>
  </book>
  <book id="2" category="web">
    <title lang="en">Vue.js 3 Cookbook</title>
    <author>Heitor Ramon Ribeiro</author>
    <price currency="CNY">128.00</price>
  </book>
</library>`

const basicSoap = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:ns="http://example.com/order">
  <soap:Header>
    <ns:auth token="abc-123" />
  </soap:Header>
  <soap:Body>
    <ns:QueryOrderRequest>
      <ns:orderNo>SO20261113001</ns:orderNo>
      <ns:warehouse code="WH-01">北京仓</ns:warehouse>
    </ns:QueryOrderRequest>
  </soap:Body>
</soap:Envelope>`

const edgeCdataComment = `<?xml version="1.0" encoding="UTF-8"?>
<config>
  <!-- 顶层注释：showComments 关掉后应消失 -->
  <script type="text/javascript"><![CDATA[
    if (a < b && c > d) { render("<div>"); }
  ]]></script>
  <template><![CDATA[<p>raw & unescaped</p>]]></template>
  <!-- 行内注释 --><value>42</value>
  <escaped>a &lt; b &amp;&amp; c &gt; d</escaped>
</config>`

const edgeSelfClosing = `<root>
  <selfClosing />
  <emptyPair></emptyPair>
  <withAttrOnly a="1" b="2" />
  <whitespace>   </whitespace>
  <mixed>text <b>bold</b> tail</mixed>
  <Field source="o.test"></Field>
  <Field source="o.test1"/>
</root>`

const edgeDeep = `<l1><l2><l3><l4><l5><l6><l7><l8><l9><l10>
  <l11><l12>maxDepth 默认 10，调小看截断</l12></l11>
</l10></l9></l8></l7></l6></l5></l4></l3></l2></l1>`

const edgeSortable = `<catalog zeta="1" alpha="2" Mike="3" beta="4">
  <zebra id="z" />
  <apple weight="10" color="red" />
  <Mango ripe="true" />
  <banana>
    <delta /><bravo /><alpha /><charlie />
  </banana>
</catalog>`

const edgeLargeList = `<orders>
${Array.from({ length: 40 }, (_, i) => {
  const no = String(i + 1).padStart(3, '0')
  return `  <order no="SO${no}" status="${i % 3 === 0 ? 'paid' : 'pending'}"><amount>${(i + 1) * 13.5}</amount></order>`
}).join('\n')}
</orders>`

const errorUnclosed = `<root>
  <item>1</item>
  <item>2
</root>`

const errorBadAmp = `<root>
  <query>a=1 & b=2</query>
</root>`

const errorNotXml = `{ "this": "是 JSON 不是 XML" }`

export const xmlAdapter: FormatAdapter = {
  id: 'xml',
  label: 'XML',
  sourcePath: 'src/components/XmlFormat/index.vue',
  component: XmlFormat,
  placeholder: '粘贴或编辑 XML，实时生效',
  fixtures: [
    { id: 'xml-basic-library', group: 'basic', label: '元素与属性', note: '声明 + 注释 + 多层元素', source: basicLibrary },
    { id: 'xml-basic-soap', group: 'basic', label: '命名空间 (SOAP)', note: '带 prefix 的标签与属性', source: basicSoap },
    { id: 'xml-edge-cdata', group: 'edge', label: 'CDATA 与注释', note: '配合 showComments / showCdata 开关观察', source: edgeCdataComment },
    { id: 'xml-edge-selfclosing', group: 'edge', label: '自闭合与空元素', note: '<a/> 与 <a></a> 往返后应保持原形', source: edgeSelfClosing },
    { id: 'xml-edge-deep', group: 'edge', label: '12 层深嵌套', source: edgeDeep },
    { id: 'xml-edge-sortable', group: 'edge', label: '乱序属性与子元素', note: '点"排序"同时验证属性序与标签序', source: edgeSortable },
    { id: 'xml-edge-large', group: 'edge', label: '40 条列表', note: '展开全部时的渲染量', source: edgeLargeList },
    { id: 'xml-error-unclosed', group: 'error', label: '未闭合标签', source: errorUnclosed },
    { id: 'xml-error-amp', group: 'error', label: '裸 & 字符', note: '未转义实体', source: errorBadAmp },
    { id: 'xml-error-notxml', group: 'error', label: '非 XML 文本', source: errorNotXml },
  ],
  actions: [
    { id: 'expand', label: '展开全部', icon: 'expand', run: api => api.expandAll() },
    { id: 'collapse', label: '折叠全部', icon: 'collapse', run: api => api.collapseAll() },
    { id: 'sort', label: '排序', icon: 'sort', variant: 'primary', run: api => api.sort(), disabled: api => api.isSorted?.() === true },
    { id: 'clear-sort', label: '取消排序', icon: 'sort-off', run: api => api.clearSort(), disabled: api => api.isSorted?.() !== true },
    { id: 'format', label: '格式化', icon: 'format', run: api => api.formatSource() },
    { id: 'compress', label: '压缩', icon: 'compress', run: api => api.compressSource() },
    { id: 'copy', label: '复制', icon: 'copy', run: api => api.copyXml(), toast: 'XML 已复制到剪贴板' },
  ],
  props: [
    { key: 'readonly', label: 'readonly', type: 'boolean', default: false },
    { key: 'maxDepth', label: 'maxDepth', type: 'number', default: 10, min: 1, max: 20 },
    { key: 'showComments', label: 'showComments', type: 'boolean', default: true },
    { key: 'showCdata', label: 'showCdata', type: 'boolean', default: true },
    { key: 'preserveWhitespace', label: 'preserveWhitespace', type: 'boolean', default: false },
  ],
  state: [
    {
      key: 'isValidXml',
      label: 'isValidXml()',
      read: api => String(api.isValidXml()),
      tone: api => (api.isValidXml() ? 'ok' : 'error'),
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
      key: 'rootNodes',
      label: 'getParsedXml() 顶层节点',
      read: api => {
        const parsed = api.getParsedXml()
        if (!parsed) return '—'
        return Array.isArray(parsed) ? String(parsed.length) : '1'
      },
    },
    {
      key: 'filtered',
      label: 'getFilteredXml()',
      read: api => {
        const filtered = api.getFilteredXml()
        if (!filtered) return '未过滤'
        return Array.isArray(filtered) ? 'nodes[' + filtered.length + ']' : 'object'
      },
      tone: api => (api.getFilteredXml() ? 'ok' : 'muted'),
    },
  ],
  events: [
    'update:modelValue',
    'copy-success',
    'copy-error',
    'expand-all',
    'collapse-all',
    'compress',
    'format',
  ],
  filter: {
    kinds: [
      {
        value: 'xpath',
        label: 'XPath',
        placeholder: '//book/title',
        samples: ['//book/title', '//book[@category="web"]', '//*[@id]', '//book/@id', 'count(//book)'],
      },
    ],
    apply: (api, kind, expression) => api.filter({ type: kind, expression }),
    clear: api => api.clearFilter(),
    error: api => api.getFilterError(),
  },
}
