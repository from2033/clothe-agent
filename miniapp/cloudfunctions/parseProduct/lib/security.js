const dns = require('dns').promises
const net = require('net')

const PRODUCT_HOST_SUFFIXES = ['taobao.com', 'tmall.com', 'tb.cn']
const IMAGE_HOST_SUFFIXES = [
  ...PRODUCT_HOST_SUFFIXES,
  'alicdn.com',
  'tbcdn.cn',
  'alicdn.net',
]

function matchesSuffix(hostname, suffix) {
  return hostname === suffix || hostname.endsWith(`.${suffix}`)
}

function isAllowedHost(hostname, type = 'product') {
  const normalized = String(hostname || '').toLowerCase().replace(/\.$/, '')
  const suffixes = type === 'image' ? IMAGE_HOST_SUFFIXES : PRODUCT_HOST_SUFFIXES
  return suffixes.some((suffix) => matchesSuffix(normalized, suffix))
}

function isPrivateIpv4(address) {
  const parts = address.split('.').map(Number)
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) return true
  const [a, b] = parts
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  )
}

function isPrivateIp(address) {
  const version = net.isIP(address)
  if (version === 4) return isPrivateIpv4(address)
  if (version === 6) {
    const normalized = address.toLowerCase()
    return (
      normalized === '::1' ||
      normalized === '::' ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      normalized.startsWith('fe8') ||
      normalized.startsWith('fe9') ||
      normalized.startsWith('fea') ||
      normalized.startsWith('feb')
    )
  }
  return true
}

async function assertSafeUrl(rawUrl, type = 'product') {
  let parsed
  try {
    parsed = new URL(rawUrl)
  } catch {
    throw new Error('链接格式不正确')
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('仅支持 HTTP 或 HTTPS 链接')
  }
  if (parsed.username || parsed.password || parsed.port) {
    throw new Error('链接包含不支持的认证信息或端口')
  }
  if (!isAllowedHost(parsed.hostname, type)) {
    throw new Error(type === 'image' ? '商品图片域名不受支持' : '仅支持淘宝或天猫链接')
  }
  const addresses = await dns.lookup(parsed.hostname, { all: true })
  if (!addresses.length || addresses.some(({ address }) => isPrivateIp(address))) {
    throw new Error('链接目标不安全')
  }
  return parsed
}

module.exports = {
  assertSafeUrl,
  isAllowedHost,
  isPrivateIp,
}
