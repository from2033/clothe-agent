const cloud = require('wx-server-sdk')
const crypto = require('crypto')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const profiles = db.collection('profiles')

const ok = (data) => ({ ok: true, data })
const fail = (code, message) => ({ ok: false, error: { code, message } })

function cleanText(value, maxLength = 30) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function cleanNumber(value, min, max) {
  const text = cleanText(value, 10)
  if (!text) return ''
  const number = Number(text)
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new Error(`数值应在 ${min} 到 ${max} 之间`)
  }
  return String(number)
}

async function tempUrl(fileID) {
  if (!fileID) return ''
  const result = await cloud.getTempFileURL({ fileList: [fileID] })
  return result.fileList[0]?.tempFileURL || ''
}

async function movePhotoToUserFolder(fileID, openid) {
  if (!fileID) return ''
  const userKey = crypto.createHash('sha256').update(openid).digest('hex').slice(0, 24)
  if (fileID.includes(`users/${userKey}/profile/`)) return fileID

  const downloaded = await cloud.downloadFile({ fileID })
  const uploaded = await cloud.uploadFile({
    cloudPath: `users/${userKey}/profile/${Date.now()}.jpg`,
    fileContent: downloaded.fileContent,
  })
  await cloud.deleteFile({ fileList: [fileID] }).catch(() => undefined)
  return uploaded.fileID
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return fail('UNAUTHORIZED', '无法识别当前用户')

  const existing = await profiles.where({ ownerOpenId: OPENID }).limit(1).get()
  const record = existing.data[0]

  if (event.action === 'get') {
    if (!record) return ok(null)
    return ok({
      name: record.name || '',
      height: record.height || '',
      weight: record.weight || '',
      bust: record.bust || '',
      waist: record.waist || '',
      hips: record.hips || '',
      photoFileId: record.photoFileId || '',
      photoTempUrl: await tempUrl(record.photoFileId),
      updatedAt: record.updatedAt,
    })
  }

  if (event.action !== 'save' || !event.profile) {
    return fail('INVALID_ACTION', '不支持的操作')
  }

  try {
    const input = event.profile
    if (!input.photoFileId) return fail('PHOTO_REQUIRED', '请上传正面全身照')
    const photoFileId = await movePhotoToUserFolder(input.photoFileId, OPENID)
    const profile = {
      name: cleanText(input.name),
      height: cleanNumber(input.height, 80, 250),
      weight: cleanNumber(input.weight, 20, 300),
      bust: cleanNumber(input.bust, 40, 250),
      waist: cleanNumber(input.waist, 30, 250),
      hips: cleanNumber(input.hips, 40, 250),
      photoFileId,
      updatedAt: Date.now(),
    }

    if (record) {
      await profiles.doc(record._id).update({ data: profile })
      if (record.photoFileId && record.photoFileId !== photoFileId) {
        await cloud.deleteFile({ fileList: [record.photoFileId] }).catch(() => undefined)
      }
    } else {
      await profiles.add({ data: { ...profile, ownerOpenId: OPENID, createdAt: Date.now() } })
    }

    return ok({
      ...profile,
      photoTempUrl: await tempUrl(photoFileId),
    })
  } catch (error) {
    return fail('INVALID_PROFILE', error.message || '资料格式不正确')
  }
}
