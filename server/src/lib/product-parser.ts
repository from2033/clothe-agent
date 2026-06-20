function decode(value = '') {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\\u002F/g, '/')
    .replace(/\\\//g, '/')
}

function meta(html: string, key: string) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["']`, 'i'),
  ]
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match) return decode(match[1])
  }
  return ''
}

function jsonValue(html: string, keys: string[]) {
  for (const key of keys) {
    const match = html.match(new RegExp(`["']${key}["']\\s*:\\s*["']([^"']+)`, 'i'))
    if (match) return decode(match[1])
  }
  return ''
}

export function parseProductHtml(html: string, finalUrl: string) {
  const lower = html.toLowerCase()
  if (['验证码', '滑块验证', 'captcha', '访问过于频繁'].some((word) => lower.includes(word))) {
    throw new Error('平台要求验证，请更换商品链接')
  }
  const title =
    meta(html, 'og:title') ||
    jsonValue(html, ['title', 'itemTitle']) ||
    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ||
    '淘宝 / 天猫商品'
  const image = meta(html, 'og:image') || jsonValue(html, ['picUrl', 'mainPic', 'image', 'img'])
  if (!image) throw new Error('未能提取商品主图，请更换链接')
  return {
    title: decode(title.trim()).slice(0, 120),
    imageUrl: new URL(image, finalUrl).toString(),
  }
}
