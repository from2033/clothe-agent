import dns from 'node:dns/promises'
import net from 'node:net'

const PRODUCT_SUFFIXES = ['taobao.com', 'tmall.com', 'tb.cn']
const IMAGE_SUFFIXES = [...PRODUCT_SUFFIXES, 'alicdn.com', 'tbcdn.cn', 'alicdn.net']

function matches(host: string, suffix: string) {
  return host === suffix || host.endsWith(`.${suffix}`)
}

export function isAllowedHost(hostname: string, type: 'product' | 'image' = 'product') {
  const host = hostname.toLowerCase().replace(/\.$/, '')
  return (type === 'image' ? IMAGE_SUFFIXES : PRODUCT_SUFFIXES).some((suffix) =>
    matches(host, suffix),
  )
}

export function isPrivateIp(address: string) {
  if (net.isIP(address) === 4) {
    const [a, b] = address.split('.').map(Number)
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
  const value = address.toLowerCase()
  return (
    !net.isIP(address) ||
    value === '::1' ||
    value === '::' ||
    value.startsWith('fc') ||
    value.startsWith('fd') ||
    /^fe[89ab]/.test(value)
  )
}

export async function assertSafeUrl(rawUrl: string, type: 'product' | 'image') {
  const parsed = new URL(rawUrl)
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('仅支持 HTTP/HTTPS')
  if (parsed.username || parsed.password || parsed.port) throw new Error('链接包含不支持的信息')
  if (!isAllowedHost(parsed.hostname, type)) {
    throw new Error(type === 'product' ? '仅支持淘宝或天猫链接' : '商品图片域名不受支持')
  }
  const addresses = await dns.lookup(parsed.hostname, { all: true })
  if (!addresses.length || addresses.some(({ address }) => isPrivateIp(address))) {
    throw new Error('链接目标不安全')
  }
  return parsed
}

export async function fetchLimited(
  rawUrl: string,
  type: 'product' | 'image',
  maxBytes: number,
  redirects = 0,
): Promise<{ buffer: Buffer; finalUrl: string; contentType: string }> {
  if (redirects > 5) throw new Error('链接跳转次数过多')
  const url = await assertSafeUrl(rawUrl, type)
  const response = await fetch(url, {
    redirect: 'manual',
    signal: AbortSignal.timeout(10_000),
    headers: {
      'User-Agent':
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile MicroMessenger',
    },
  })
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get('location')
    if (!location) throw new Error('商品链接跳转失败')
    return fetchLimited(new URL(location, url).toString(), type, maxBytes, redirects + 1)
  }
  if (!response.ok) throw new Error(`远端响应异常（${response.status}）`)
  const contentType = response.headers.get('content-type') || ''
  if (type === 'image' && !contentType.startsWith('image/')) throw new Error('商品主图格式不支持')
  const length = Number(response.headers.get('content-length') || 0)
  if (length > maxBytes) throw new Error('远端内容过大')
  const buffer = Buffer.from(await response.arrayBuffer())
  if (buffer.length > maxBytes) throw new Error('远端内容过大')
  return { buffer, finalUrl: url.toString(), contentType }
}
