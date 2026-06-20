const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const command = db.command

const ok = (data) => ({ ok: true, data })
const fail = (code, message) => ({ ok: false, error: { code, message } })

async function removeAll(collectionName, openid) {
  while (true) {
    const batch = await db
      .collection(collectionName)
      .where({ ownerOpenId: openid })
      .limit(100)
      .get()
    if (!batch.data.length) return
    await db
      .collection(collectionName)
      .where({ _id: command.in(batch.data.map((item) => item._id)) })
      .remove()
  }
}

async function listAll(collectionName, openid) {
  const records = []
  let offset = 0
  while (true) {
    const batch = await db
      .collection(collectionName)
      .where({ ownerOpenId: openid })
      .skip(offset)
      .limit(100)
      .get()
    records.push(...batch.data)
    if (batch.data.length < 100) return records
    offset += batch.data.length
  }
}

exports.main = async () => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return fail('UNAUTHORIZED', '无法识别当前用户')

  const [profiles, products, tasks] = await Promise.all([
    listAll('profiles', OPENID),
    listAll('products', OPENID),
    listAll('tryon_tasks', OPENID),
  ])

  const files = [...new Set([
    ...profiles.map((item) => item.photoFileId),
    ...products.map((item) => item.imageFileId),
    ...tasks.map((item) => item.resultImageFileId),
  ].filter(Boolean))]

  for (let index = 0; index < files.length; index += 50) {
    await cloud.deleteFile({ fileList: files.slice(index, index + 50) }).catch(() => undefined)
  }

  await Promise.all([
    removeAll('tryon_tasks', OPENID),
    removeAll('products', OPENID),
    removeAll('profiles', OPENID),
  ])

  return ok({ deleted: true })
}
