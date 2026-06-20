const cloud = require('wx-server-sdk')
const { createProvider } = require('./lib/provider')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const ok = (data) => ({ ok: true, data })
const fail = (code, message) => ({ ok: false, error: { code, message } })

async function tempUrls(fileIDs) {
  const result = await cloud.getTempFileURL({ fileList: fileIDs })
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
  if (typeof event.productId !== 'string') return fail('INVALID_PRODUCT', '商品不存在')

  const [profileResult, productResult] = await Promise.all([
    db.collection('profiles').where({ ownerOpenId: OPENID }).limit(1).get(),
    db.collection('products').doc(event.productId).get().catch(() => null),
  ])
  const profile = profileResult.data[0]
  const product = productResult?.data
  if (!profile?.photoFileId) return fail('PROFILE_REQUIRED', '请先上传正面全身照')
  if (!product || product.ownerOpenId !== OPENID || product.parseStatus !== 'succeeded') {
    return fail('PRODUCT_NOT_FOUND', '商品不存在或尚未解析完成')
  }

  const duplicate = await db
    .collection('tryon_tasks')
    .where({
      ownerOpenId: OPENID,
      productId: product._id,
      status: db.command.in(['pending', 'processing']),
    })
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get()
  if (duplicate.data[0] && Date.now() - duplicate.data[0].createdAt < 60_000) {
    const existing = duplicate.data[0]
    const urls = await tempUrls([
      existing.productImageFileId,
      existing.personImageFileId,
      existing.resultImageFileId,
    ].filter(Boolean))
    return ok(output(existing, urls))
  }

  const now = Date.now()
  const task = {
    ownerOpenId: OPENID,
    productId: product._id,
    originalUrl: product.originalUrl,
    productTitle: product.title,
    productImageFileId: product.imageFileId,
    personImageFileId: profile.photoFileId,
    provider: process.env.AI_PROVIDER || 'mock',
    providerTaskId: '',
    status: 'pending',
    failureReason: '',
    resultImageFileId: '',
    pollErrorCount: 0,
    createdAt: now,
    updatedAt: now,
  }
  const inserted = await db.collection('tryon_tasks').add({ data: task })
  task._id = inserted._id

  try {
    const urls = await tempUrls([profile.photoFileId, product.imageFileId])
    const provider = createProvider()
    const created = await provider.create({
      personImageUrl: urls.get(profile.photoFileId),
      productImageUrl: urls.get(product.imageFileId),
      measurements: {
        height: profile.height,
        weight: profile.weight,
        bust: profile.bust,
        waist: profile.waist,
        hips: profile.hips,
      },
    })
    task.provider = provider.name
    task.providerTaskId = created.externalTaskId
    task.status = 'processing'
    task.updatedAt = Date.now()
    await db.collection('tryon_tasks').doc(task._id).update({
      data: {
        provider: task.provider,
        providerTaskId: task.providerTaskId,
        status: task.status,
        updatedAt: task.updatedAt,
      },
    })
    return ok(output(task, urls))
  } catch (error) {
    task.status = 'failed'
    task.failureReason = error.message || 'AI 服务创建任务失败'
    task.updatedAt = Date.now()
    await db.collection('tryon_tasks').doc(task._id).update({
      data: {
        status: task.status,
        failureReason: task.failureReason,
        updatedAt: task.updatedAt,
      },
    })
    return ok(output(task, new Map()))
  }
}
