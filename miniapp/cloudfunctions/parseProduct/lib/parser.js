function decodeHtml(value = '') {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\\u002F/g, '/')
    .replace(/\\\//g, '/')
}

function metaContent(html, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      'i',
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`,
      'i',
    ),
  ]
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match) return decodeHtml(match[1].trim())
  }
  return ''
}

function extractJsonValue(html, keys) {
  for (const key of keys) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const match = html.match(new RegExp(`["']${escaped}["']\\s*:\\s*["']([^"']+)["']`, 'i'))
    if (match) return decodeHtml(match[1])
  }
  return ''
}

function parseProductHtml(html, finalUrl) {
  const lower = html.toLowerCase()
  if (
    lower.includes('验证码') ||
    lower.includes('滑块验证') ||
    lower.includes('captcha') ||
    lower.includes('访问过于频繁')
  ) {
    throw new Error('平台要求验证，请更换商品链接后重试')
  }

  const title =
    metaContent(html, 'og:title') ||
    extractJsonValue(html, ['title', 'itemTitle']) ||
    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ||
    '淘宝 / 天猫商品'
  const imageUrl =
    metaContent(html, 'og:image') ||
    extractJsonValue(html, ['picUrl', 'mainPic', 'image', 'img'])

  if (!imageUrl) throw new Error('未能从商品页面提取主图，请更换链接')
  const absoluteImageUrl = new URL(imageUrl, finalUrl).toString()

  return {
    title: decodeHtml(title).slice(0, 120),
    imageUrl: absoluteImageUrl,
  }
}

function platformFromUrl(url) {
  const hostname = new URL(url).hostname.toLowerCase()
  return hostname.includes('tmall.com') ? 'tmall' : 'taobao'
}

module.exports = {
  decodeHtml,
  parseProductHtml,
  platformFromUrl,
}
