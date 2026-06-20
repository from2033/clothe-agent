import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import test from 'node:test'

const require = createRequire(import.meta.url)
const {
  decodeHtml,
  parseProductHtml,
  platformFromUrl,
} = require('../cloudfunctions/parseProduct/lib/parser.js')
const {
  isAllowedHost,
  isPrivateIp,
} = require('../cloudfunctions/parseProduct/lib/security.js')

test('allows only supported product hosts', () => {
  assert.equal(isAllowedHost('item.taobao.com'), true)
  assert.equal(isAllowedHost('detail.tmall.com'), true)
  assert.equal(isAllowedHost('m.tb.cn'), true)
  assert.equal(isAllowedHost('evil-taobao.com'), false)
  assert.equal(isAllowedHost('example.com'), false)
})

test('allows known image CDN hosts only for images', () => {
  assert.equal(isAllowedHost('img.alicdn.com', 'image'), true)
  assert.equal(isAllowedHost('img.alicdn.com', 'product'), false)
})

test('rejects private and special IP ranges', () => {
  assert.equal(isPrivateIp('127.0.0.1'), true)
  assert.equal(isPrivateIp('10.0.0.1'), true)
  assert.equal(isPrivateIp('169.254.169.254'), true)
  assert.equal(isPrivateIp('192.168.1.1'), true)
  assert.equal(isPrivateIp('8.8.8.8'), false)
  assert.equal(isPrivateIp('::1'), true)
})

test('extracts Open Graph product metadata', () => {
  const html = `
    <html>
      <head>
        <meta property="og:title" content="春季外套 &amp; 风衣">
        <meta property="og:image" content="https://img.alicdn.com/example.jpg">
      </head>
    </html>
  `
  assert.deepEqual(parseProductHtml(html, 'https://item.taobao.com/item.htm?id=1'), {
    title: '春季外套 & 风衣',
    imageUrl: 'https://img.alicdn.com/example.jpg',
  })
})

test('detects verification pages and platform', () => {
  assert.throws(
    () => parseProductHtml('<html>请完成滑块验证</html>', 'https://item.taobao.com'),
    /验证/,
  )
  assert.equal(platformFromUrl('https://detail.tmall.com/item.htm?id=1'), 'tmall')
  assert.equal(platformFromUrl('https://item.taobao.com/item.htm?id=1'), 'taobao')
  assert.equal(decodeHtml('a&amp;b'), 'a&b')
})
