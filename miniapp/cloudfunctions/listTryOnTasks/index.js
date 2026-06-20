const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const ok = (data) => ({ ok: true, data })
const fail = (code, message) => ({ ok: false, error: { code, message } })

async function withTempUrls(tasks) {
  const fileIDs = [
    ...new Set(
      tasks
        .flatMap((task) => [
          task.productImageFileId,
          task.personImageFileId,
          task.resultImageFileId,
        ])
        .filter(Boolean),
    ),
  ]
  const urls = new Map()
  if (fileIDs.length) {
    const result = await cloud.getTempFileURL({ fileList: fileIDs })
    result.fileList.forEach((file) => urls.set(file.fileID, file.tempFileURL || ''))
  }
  return tasks.map((task) => ({
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
  }))
}

exports.main = async () => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return fail('UNAUTHORIZED', '无法识别当前用户')

  const result = await db
    .collection('tryon_tasks')
    .where({ ownerOpenId: OPENID })
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get()

  return ok(await withTempUrls(result.data))
}
