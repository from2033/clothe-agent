const cloud = require('wx-server-sdk')
const crypto = require('crypto')
const http = require('http')
const https = require('https')
const { assertSafeUrl } = require('./lib/security')
const { parseProductHtml, platformFromUrl } = require('./lib/parser')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const products = db.collection('products')

const ok = (data) => ({ ok: true, data })
const fail = (code, message) => ({ ok: false, error: { code, message } })
const USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 MicroMessenger/8.0'

async function request(rawUrl, options = {}, redirectCount = 0) {
  const type = options.type || 'product'
  const parsed = await assertSafeUrl(rawUrl, type)
  if (redirectCount > 5) throw new Error('商品链接跳转次数过多')

  return new Promise((resolve, reject) => {
    const transport = parsed.protocol === 'https:' ? https : http
    const req = transport.get(
      parsed,
      {
        headers: {
          'User-Agent': USER_AGENT,
          Accept:
            type === 'image'
              ? 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8'
              : 'text/html,application/xhtml+xml',
        },
        timeout: 8000,
      },
      (response) => {
        const status = response.statusCode || 0
        const location = response.headers.location
        if (status >= 300 && status < 400 && location) {
          response.resume()
          const nextUrl = new URL(location, parsed).toString()
          request(nextUrl, options, redirectCount + 1).then(resolve, reject)
          return
        }
        if (status < 200 || status >= 300) {
          response.resume()
          reject(new Error(`商品页面响应异常（${status}）`))
          return
        }

        const contentType = String(response.headers['content-type'] || '')
        if (type === 'image' && !contentType.startsWith('image/')) {
          response.resume()
          reject(new Error('商品主图格式不受支持'))
          return
        }

        const maxBytes = options.maxBytes || 2 * 1024 * 1024
        const chunks = []
        let size = 0
        response.on('data', (chunk) => {
          size += chunk.length
          if (size > maxBytes) {
            req.destroy(new Error(type === 'image' ? '商品主图超过 10MB' : '商品页面过大'))
            return
          }
          chunks.push(chunk)
        })
        response.on('end', () =>
          resolve({
            body: Buffer.concat(chunks),
            finalUrl: parsed.toString(),
            contentType,
          }),
        )
      },
    )
    req.on('timeout', () => req.destroy(new Error('商品链接请求超时')))
    req.on('error', reject)
  })
}

async function tempUrl(fileID) {
  const result = await cloud.getTempFileURL({ fileList: [fileID] })
  return result.fileList[0]?.tempFileURL || ''
}

function output(record) {
  return {
    id: record._id,
    originalUrl: record.originalUrl,
    normalizedUrl: record.normalizedUrl,
    platform: record.platform,
    title: record.title,
    imageFileId: record.imageFileId,
    parseStatus: record.parseStatus,
  }
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return fail('UNAUTHORIZED', '无法识别当前用户')
  if (typeof event.url !== 'string' || event.url.length > 2048) {
    return fail('INVALID_URL', '商品链接格式不正确')
  }

  try {
    const page = await request(event.url.trim(), { maxBytes: 2 * 1024 * 1024 })
    const normalizedUrl = page.finalUrl
    const cached = await products
      .where({ ownerOpenId: OPENID, normalizedUrl, parseStatus: 'succeeded' })
      .limit(1)
      .get()
    if (cached.data[0]) {
      return ok({
        ...output(cached.data[0]),
        imageTempUrl: await tempUrl(cached.data[0].imageFileId),
      })
    }

    const parsed = parseProductHtml(page.body.toString('utf8'), normalizedUrl)
    const image = await request(parsed.imageUrl, {
      type: 'image',
      maxBytes: 10 * 1024 * 1024,
    })
    const hash = crypto.createHash('sha256').update(image.body).digest('hex')
    const extension = image.contentType.includes('png')
      ? 'png'
      : image.contentType.includes('webp')
        ? 'webp'
        : 'jpg'
    const userKey = crypto.createHash('sha256').update(OPENID).digest('hex').slice(0, 24)
    const uploaded = await cloud.uploadFile({
      cloudPath: `users/${userKey}/products/${hash}.${extension}`,
      fileContent: image.body,
    })
    const record = {
      ownerOpenId: OPENID,
      originalUrl: event.url.trim(),
      normalizedUrl,
      platform: platformFromUrl(normalizedUrl),
      title: parsed.title,
      imageFileId: uploaded.fileID,
      parseStatus: 'succeeded',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    const inserted = await products.add({ data: record })
    const saved = { ...record, _id: inserted._id }

    return ok({
      ...output(saved),
      imageTempUrl: await tempUrl(uploaded.fileID),
    })
  } catch (error) {
    return fail('PRODUCT_PARSE_FAILED', error.message || '商品解析失败，请更换链接')
  }
}
