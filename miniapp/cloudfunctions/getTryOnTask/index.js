const cloud = require('wx-server-sdk')
const crypto = require('crypto')
const dns = require('dns').promises
const net = require('net')
const { createProvider } = require('./lib/provider')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const ok = (data) => ({ ok: true, data })
const fail = (code, message) => ({ ok: false, error: { code, message } })

function isPrivateIp(address) {
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
  const normalized = address.toLowerCase()
  return (
    !net.isIP(address) ||
    normalized === '::1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe8') ||
    normalized.startsWith('fe9') ||
    normalized.startsWith('fea') ||
    normalized.startsWith('feb')
  )
}

async function downloadResult(rawUrl) {
  const fetch = require('node-fetch')
  const url = new URL(rawUrl)
  if (url.protocol !== 'https:') throw new Error('AI 结果地址必须使用 HTTPS')
  const addresses = await dns.lookup(url.hostname, { all: true })
  if (!addresses.length || addresses.some(({ address }) => isPrivateIp(address))) {
    throw new Error('AI 结果地址不安全')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20000)
  try {
    const response = await fetch(url, { signal: controller.signal, redirect: 'error' })
    if (!response.ok) throw new Error(`下载 AI 结果失败（${response.status}）`)
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.startsWith('image/')) throw new Error('AI 结果不是图片')
    const contentLength = Number(response.headers.get('content-length') || 0)
    if (contentLength > 10 * 1024 * 1024) throw new Error('AI 结果图片超过 10MB')
    const buffer = Buffer.from(await response.arrayBuffer())
    if (buffer.length > 10 * 1024 * 1024) throw new Error('AI 结果图片超过 10MB')
    return { buffer, contentType }
  } finally {
    clearTimeout(timeout)
  }
}

async function tempUrls(fileIDs) {
  const unique = [...new Set(fileIDs.filter(Boolean))]
  if (!unique.length) return new Map()
  const result = await cloud.getTempFileURL({ fileList: unique })
  return new Map(result.fileList.map((item) => [item.fileID, item.tempFileURL || '']))
}

function output(task, urls) {
  return {
    id: task._id,
    status: task.status,
    originalUrl: task.originalUrl,
    productTitle: task.productTitle,
    productImageFileId: task.productImageFileId,
    productImageTempUrl: urls.get(task.productImageFileId) || '',
    personImageFileId: task.personImageFileId,
    personImageTempUrl: urls.get(task.personImageFileId) || '',
    resultImageFileId: task.resultImageFileId || '',
    resultImageTempUrl: urls.get(task.resultImageFileId) || '',
    failureReason: task.failureReason || '',
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  }
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return fail('UNAUTHORIZED', '无法识别当前用户')
  if (typeof event.taskId !== 'string') return fail('INVALID_TASK', '任务不存在')

  const taskResult = await db.collection('tryon_tasks').doc(event.taskId).get().catch(() => null)
  const task = taskResult?.data
  if (!task || task.ownerOpenId !== OPENID) return fail('TASK_NOT_FOUND', '任务不存在')

  if (['pending', 'processing'].includes(task.status)) {
    try {
      const provider = createProvider(task.provider)
      const result = await provider.status(task)
      if (result.status === 'succeeded') {
        if (result.existingResultFileId) {
          const source = await cloud.downloadFile({ fileID: result.existingResultFileId })
          const hash = crypto.createHash('sha256').update(source.fileContent).digest('hex')
          const userKey = crypto
            .createHash('sha256')
            .update(OPENID)
            .digest('hex')
            .slice(0, 24)
          const uploaded = await cloud.uploadFile({
            cloudPath: `users/${userKey}/results/${hash}.jpg`,
            fileContent: source.fileContent,
          })
          task.resultImageFileId = uploaded.fileID
        } else if (result.resultUrl) {
          const downloaded = await downloadResult(result.resultUrl)
          const hash = crypto.createHash('sha256').update(downloaded.buffer).digest('hex')
          const userKey = crypto
            .createHash('sha256')
            .update(OPENID)
            .digest('hex')
            .slice(0, 24)
          const extension = downloaded.contentType.includes('png')
            ? 'png'
            : downloaded.contentType.includes('webp')
              ? 'webp'
              : 'jpg'
          const uploaded = await cloud.uploadFile({
            cloudPath: `users/${userKey}/results/${hash}.${extension}`,
            fileContent: downloaded.buffer,
          })
          task.resultImageFileId = uploaded.fileID
        } else {
          throw new Error('AI 服务未返回结果图片')
        }
        task.status = 'succeeded'
        task.failureReason = ''
      } else if (result.status === 'failed') {
        task.status = 'failed'
        task.failureReason = result.failureReason || 'AI 生成失败'
      } else {
        task.status = 'processing'
      }
      task.updatedAt = Date.now()
      task.pollErrorCount = 0
      await db.collection('tryon_tasks').doc(task._id).update({
        data: {
          status: task.status,
          resultImageFileId: task.resultImageFileId || '',
          failureReason: task.failureReason || '',
          pollErrorCount: 0,
          updatedAt: task.updatedAt,
        },
      })
    } catch (error) {
      task.pollErrorCount = (task.pollErrorCount || 0) + 1
      if (task.pollErrorCount >= 5) {
        task.status = 'failed'
        task.failureReason = error.message || '多次查询 AI 任务失败'
      } else {
        task.status = 'processing'
      }
      task.updatedAt = Date.now()
      await db.collection('tryon_tasks').doc(task._id).update({
        data: {
          status: task.status,
          failureReason: task.failureReason || '',
          pollErrorCount: task.pollErrorCount,
          updatedAt: task.updatedAt,
        },
      })
    }
  }

  const urls = await tempUrls([
    task.productImageFileId,
    task.personImageFileId,
    task.resultImageFileId,
  ])
  return ok(output(task, urls))
}
