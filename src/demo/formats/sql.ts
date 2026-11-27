import SqlFormat from '../../components/SqlFormat/index.vue'
import type { FormatAdapter } from '../types'

const mysqlJoin = `SELECT
  u.id,
  u.username,
  u.email,
  COUNT(o.id) AS order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.status = 'active'
GROUP BY u.id, u.username, u.email
HAVING COUNT(o.id) > 0
ORDER BY order_count DESC
LIMIT 10;`

const pgDistinctOn = `SELECT DISTINCT ON (u.id)
  u.id,
  u.username,
  l.logged_at
FROM users u
JOIN login_logs l ON l.user_id = u.id
ORDER BY u.id, l.logged_at DESC;`

const updateDelete = `UPDATE orders
SET status = 'cancelled',
    updated_at = NOW()
WHERE created_at < '2026-01-01'
  AND status IN ('pending', 'paid');

DELETE FROM order_items
WHERE order_id NOT IN (SELECT id FROM orders);`

const tsqlTop = `SELECT TOP (5) WITH TIES
  [u].[id],
  [u].[username]
FROM [dbo].[users] AS [u]
ORDER BY [u].[created_at] DESC;`

const snowflakeVariant = `SELECT
  payload:customer.name::STRING AS customer_name,
  payload:order.total::NUMBER(10,2) AS order_total
FROM raw_events
WHERE payload:order.status::STRING = 'paid';`

const insertTuples = `INSERT INTO warehouse_task (task_no, warehouse_no, status, qty, created_at)
VALUES
  ('T20261113001', 'WH-01', 10, 3, '2026-11-13 09:00:00'),
  ('T20261113002', 'WH-01', 20, 7, '2026-11-13 09:01:00'),
  ('T20261113003', 'WH-02', 10, 1, '2026-11-13 09:02:00'),
  ('T20261113004', 'WH-02', 30, 12, '2026-11-13 09:03:00');`

const subquery = `SELECT
  w.warehouse_no,
  (SELECT COUNT(*) FROM task t WHERE t.warehouse_no = w.warehouse_no AND t.status = 10) AS pending,
  stat.total
FROM warehouse w
JOIN (
  SELECT warehouse_no, COUNT(*) AS total
  FROM task
  WHERE created_at >= '2026-11-01'
  GROUP BY warehouse_no
) stat ON stat.warehouse_no = w.warehouse_no
WHERE w.warehouse_no IN (
  SELECT warehouse_no FROM warehouse_config WHERE enabled = 1
)
ORDER BY pending DESC;`

const oneLiner = `select a.id,a.name,b.amount from account a inner join bill b on b.account_id=a.id where a.deleted=0 and b.created_at between '2026-01-01' and '2026-12-31' and b.amount>100 order by b.amount desc limit 50 offset 100;`

const withComments = `-- 近 7 天拣货效率
/* 多行注释
   第二行 */
SELECT
  p.picker_no,  -- 拣货人
  AVG(p.cost_ms) / 1000 AS avg_seconds
FROM pick_log p
WHERE p.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY p.picker_no;`

const ddl = `CREATE TABLE IF NOT EXISTS pick_task (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  task_no VARCHAR(32) NOT NULL,
  status TINYINT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_task_no (task_no),
  KEY idx_status_created (status, created_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

ALTER TABLE pick_task ADD COLUMN warehouse_no VARCHAR(16) NOT NULL DEFAULT '';`

const errorSyntax = `SELEC * FORM users WHER id = ;`

const errorUnbalanced = `SELECT id, name FROM users WHERE id IN (1, 2, 3;`

export const sqlAdapter: FormatAdapter = {
  id: 'sql',
  label: 'SQL',
  sourcePath: 'src/components/SqlFormat/index.vue',
  component: SqlFormat,
  placeholder: '粘贴或编辑 SQL，实时生效',
  fixtures: [
    { id: 'sql-basic-mysql', group: 'basic', label: 'MySQL join + group', note: '覆盖主要子句类型', source: mysqlJoin, props: { dialect: 'mysql' } },
    { id: 'sql-basic-pg', group: 'basic', label: 'PostgreSQL DISTINCT ON', source: pgDistinctOn, props: { dialect: 'postgresql' } },
    { id: 'sql-basic-dml', group: 'basic', label: 'UPDATE / DELETE', note: '多语句 + 非 SELECT 子句', source: updateDelete, props: { dialect: 'mysql' } },
    { id: 'sql-edge-tsql', group: 'edge', label: 'T-SQL TOP WITH TIES', note: '方括号标识符', source: tsqlTop, props: { dialect: 'tsql' } },
    { id: 'sql-edge-snowflake', group: 'edge', label: 'Snowflake VARIANT', note: 'payload:a.b::TYPE 取值语法', source: snowflakeVariant, props: { dialect: 'snowflake' } },
    { id: 'sql-edge-insert', group: 'edge', label: 'INSERT 多值元组', note: '每个元组应成为独立可折叠的 VALUE_TUPLE', source: insertTuples, props: { dialect: 'mysql' } },
    { id: 'sql-edge-subquery', group: 'edge', label: '嵌套子查询', note: '验证子句内嵌套 clause 的折叠', source: subquery, props: { dialect: 'mysql' } },
    { id: 'sql-edge-oneline', group: 'edge', label: '单行小写长 SQL', note: '点"格式化"观察关键字大写与换行', source: oneLiner, props: { dialect: 'mysql' } },
    { id: 'sql-edge-comments', group: 'edge', label: '行内与多行注释', source: withComments, props: { dialect: 'mysql' } },
    { id: 'sql-edge-ddl', group: 'edge', label: 'DDL (CREATE / ALTER)', source: ddl, props: { dialect: 'mysql' } },
    { id: 'sql-error-syntax', group: 'error', label: '拼写错误的语句', source: errorSyntax, props: { dialect: 'mysql' } },
    { id: 'sql-error-paren', group: 'error', label: '括号不匹配', source: errorUnbalanced, props: { dialect: 'mysql' } },
  ],
  actions: [
    { id: 'expand', label: '展开全部', icon: 'expand', run: api => api.expandAll() },
    { id: 'collapse', label: '折叠全部', icon: 'collapse', run: api => api.collapseAll() },
    { id: 'format', label: '格式化', icon: 'format', variant: 'primary', run: api => api.formatSource() },
    { id: 'compress', label: '压缩', icon: 'compress', run: api => api.compressSource() },
    { id: 'copy', label: '复制', icon: 'copy', run: api => api.copySql(), toast: 'SQL 已复制到剪贴板' },
  ],
  props: [
    { key: 'readonly', label: 'readonly', type: 'boolean', default: false },
    {
      key: 'dialect',
      label: 'dialect',
      type: 'select',
      default: 'mysql',
      allowCustom: true,
      note: '选"自定义"可注入非法方言，验证降级行为',
      options: [
        { label: 'sql (generic)', value: 'sql' },
        { label: 'mysql', value: 'mysql' },
        { label: 'postgresql', value: 'postgresql' },
        { label: 'sqlite', value: 'sqlite' },
        { label: 'tsql', value: 'tsql' },
        { label: 'plsql', value: 'plsql' },
        { label: 'snowflake', value: 'snowflake' },
        { label: 'trino', value: 'trino' },
        { label: 'bigquery', value: 'bigquery' },
        { label: 'spark', value: 'spark' },
      ],
    },
    { key: 'tabWidth', label: 'tabWidth', type: 'number', default: 2, min: 1, max: 8 },
  ],
  state: [
    {
      key: 'isValidSql',
      label: 'isValidSql()',
      read: api => String(api.isValidSql()),
      tone: api => (api.isValidSql() ? 'ok' : 'error'),
    },
    {
      key: 'getParseError',
      label: 'getParseError()',
      read: api => api.getParseError() || '—',
      tone: api => (api.getParseError() ? 'error' : 'muted'),
    },
    {
      key: 'clauses',
      label: 'getParsedSql() 子句数',
      read: api => String(api.getParsedSql()?.length ?? 0),
    },
    {
      key: 'clauseTypes',
      label: '子句类型',
      read: api => {
        const clauses = api.getParsedSql()
        if (!clauses || !clauses.length) return '—'
        return Array.from(new Set(clauses.map((c: { type: string }) => c.type))).join(', ')
      },
    },
    { key: 'length', label: 'getValue().length', read: api => String(api.getValue().length) },
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
  filterUnavailable: 'SqlFormat 未提供 filter() API —— 过滤能力目前只有 JsonFormat（JSONPath / JS）与 XmlFormat（XPath）支持。',
}
