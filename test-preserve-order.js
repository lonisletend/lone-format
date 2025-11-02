import { XMLParser } from 'fast-xml-parser'

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!-- 这是图书馆的 XML 数据 -->
<library>
  <!-- 第一本书：TypeScript -->
  <book id="1" category="programming">
    <title lang="en">Learning TypeScript</title>
    <author>Josh Goldberg</author>
    <year>2022</year>
    <price currency="USD">39.99</price>
    <example><![CDATA[const add = (a, b) => a + b; console.log(add(2, 3)); // 5]]></example>
  </book>

  <!-- 第二本书：Vue.js -->
  <book id="2" category="web">
    <title lang="en">Vue.js 3 Cookbook</title>
    <author>Heitor Ramon Ribeiro</author>
    <year>2023</year>
    <price currency="USD">44.99</price>
  </book>
</library>`

console.log('===== preserveOrder: true =====')
const parser2 = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  ignoreDeclaration: false,
  commentPropName: '#comment',
  cdataPropName: '__cdata',
  preserveOrder: true,
})
console.log(JSON.stringify(parser2.parse(xml), null, 2))
