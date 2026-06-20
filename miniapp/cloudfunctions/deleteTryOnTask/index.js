const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const ok = (data) => ({ ok: true, data })
const fail = (code, message) => ({ ok: false, error: { code, message } })

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return fail('UNAUTHORIZED', '无法识别当前用户')
  if (typeof event.taskId !== 'string') return fail('INVALID_TASK', '任务不存在')

  const result = await db.collection('tryon_tasks').doc(event.taskId).get().catch(() => null)
  const task = result?.data
  if (!task || task.ownerOpenId !== OPENID) {
    return fail('TASK_NOT_FOUND', '任务不存在')
  }

  const files = [task.resultImageFileId]
    .filter(Boolean)
    .filter((fileID) => fileID !== task.personImageFileId && fileID !== task.productImageFileId)
  if (files.length) await cloud.deleteFile({ fileList: files }).catch(() => undefined)
  await db.collection('tryon_tasks').doc(task._id).remove()

  return ok({ deleted: true })
}
