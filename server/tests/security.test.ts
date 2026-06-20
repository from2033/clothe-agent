import assert from 'node:assert/strict'
import test from 'node:test'
import { isAllowedHost, isPrivateIp } from '../src/lib/http-security.js'
import { parseProductHtml } from '../src/lib/product-parser.js'

test('product host allowlist prevents suffix confusion', () => {
  assert.equal(isAllowedHost('item.taobao.com'), true)
  assert.equal(isAllowedHost('detail.tmall.com'), true)
  assert.equal(isAllowedHost('evil-taobao.com'), false)
  assert.equal(isAllowedHost('localhost'), false)
})

test('private address detection covers metadata endpoints', () => {
  assert.equal(isPrivateIp('127.0.0.1'), true)
  assert.equal(isPrivateIp('169.254.169.254'), true)
  assert.equal(isPrivateIp('192.168.1.2'), true)
  assert.equal(isPrivateIp('8.8.8.8'), false)
})

test('product parser extracts open graph metadata', () => {
  const html = `
    <meta property="og:title" content="春季外套 &amp; 风衣">
    <meta property="og:image" content="https://img.alicdn.com/demo.jpg">
  `
  assert.deepEqual(parseProductHtml(html, 'https://item.taobao.com/item.htm?id=1'), {
    title: '春季外套 & 风衣',
    imageUrl: 'https://img.alicdn.com/demo.jpg',
  })
})
