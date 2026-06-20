import { Button, Image, Input, Text, View } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { api, uploadProfilePhoto } from '@/services/api'
import type { Profile } from '@/types/domain'
import './index.scss'

const emptyProfile: Profile = {
  name: '',
  height: '',
  weight: '',
  bust: '',
  waist: '',
  hips: '',
  photoFileId: '',
}

const fields: Array<{
  key: keyof Pick<Profile, 'height' | 'weight' | 'bust' | 'waist' | 'hips'>
  label: string
  placeholder: string
}> = [
  { key: 'height', label: '身高 (cm)', placeholder: '170' },
  { key: 'weight', label: '体重 (kg)', placeholder: '55' },
  { key: 'bust', label: '胸围 (cm)', placeholder: '85' },
  { key: 'waist', label: '腰围 (cm)', placeholder: '65' },
  { key: 'hips', label: '臀围 (cm)', placeholder: '90' },
]

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(emptyProfile)
  const [photoPreview, setPhotoPreview] = useState('')
  const [photoTempPath, setPhotoTempPath] = useState('')
  const [loading, setLoading] = useState(false)

  useDidShow(() => {
    void loadProfile()
  })

  async function loadProfile() {
    try {
      const saved = await api.getProfile()
      if (saved) {
        setProfile(saved)
        setPhotoPreview(saved.photoTempUrl || '')
      }
    } catch {
      // 首次使用或离线时保持空表单。
    }
  }

  async function choosePhoto() {
    try {
      const result = await Taro.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        sizeType: ['compressed'],
      })
      const file = result.tempFiles[0]
      if (file.size > 10 * 1024 * 1024) {
        Taro.showToast({ title: '照片不能超过 10MB', icon: 'none' })
        return
      }
      setPhotoTempPath(file.tempFilePath)
      setPhotoPreview(file.tempFilePath)
    } catch (error) {
      const message = String(error)
      if (!message.includes('cancel')) {
        Taro.showToast({ title: '无法读取照片', icon: 'none' })
      }
    }
  }

  function updateField(key: keyof Profile, value: string) {
    setProfile((current) => ({ ...current, [key]: value }))
  }

  async function save() {
    if (!photoPreview) {
      Taro.showToast({ title: '请先上传正面全身照', icon: 'none' })
      return
    }
    if (!profile.height || !profile.weight) {
      Taro.showToast({ title: '请填写身高和体重', icon: 'none' })
      return
    }

    setLoading(true)
    Taro.showLoading({ title: '保存中', mask: true })
    try {
      const photoFileId = photoTempPath
        ? await uploadProfilePhoto(photoTempPath)
        : profile.photoFileId
      const saved = await api.saveProfile({ ...profile, photoFileId })
      setProfile(saved)
      setPhotoTempPath('')
      if (saved.photoTempUrl) setPhotoPreview(saved.photoTempUrl)
      Taro.showToast({ title: '保存成功', icon: 'success' })
    } catch (error) {
      Taro.showToast({
        title: error instanceof Error ? error.message : '保存失败',
        icon: 'none',
      })
    } finally {
      Taro.hideLoading()
      setLoading(false)
    }
  }

  async function clearAll() {
    const confirmation = await Taro.showModal({
      title: '清空全部数据',
      content: '将删除个人资料、照片和所有试穿记录，且无法恢复。',
      confirmText: '确认清空',
      confirmColor: '#d93025',
    })
    if (!confirmation.confirm) return

    Taro.showLoading({ title: '清理中', mask: true })
    try {
      await api.clearUserData()
      setProfile(emptyProfile)
      setPhotoPreview('')
      setPhotoTempPath('')
      Taro.showToast({ title: '已清空', icon: 'success' })
    } catch (error) {
      Taro.showToast({
        title: error instanceof Error ? error.message : '清理失败',
        icon: 'none',
      })
    } finally {
      Taro.hideLoading()
    }
  }

  return (
    <View className='page profile'>
      <View className='section profile__photo-section'>
        <View className='profile__photo' onClick={choosePhoto}>
          {photoPreview ? (
            <Image
              className='profile__photo-image'
              src={photoPreview}
              mode='aspectFill'
            />
          ) : (
            <Text className='profile__photo-placeholder'>👤</Text>
          )}
          <Text className='profile__camera'>📷</Text>
        </View>
        <Text className='profile__photo-tip'>
          建议上传正面全身照，确保光线充足、背景简洁
        </Text>
      </View>

      <View className='section'>
        <Text className='section-title'>基本信息</Text>
        <Text className='field__label'>姓名（选填）</Text>
        <Input
          className='field__input'
          value={profile.name}
          maxlength={30}
          placeholder='请输入姓名'
          onInput={(event) => updateField('name', event.detail.value)}
        />
        <View className='field-grid'>
          {fields.slice(0, 2).map((field) => (
            <View key={field.key}>
              <Text className='field__label'>{field.label}</Text>
              <Input
                className='field__input'
                type='digit'
                value={profile[field.key]}
                placeholder={field.placeholder}
                onInput={(event) => updateField(field.key, event.detail.value)}
              />
            </View>
          ))}
        </View>
      </View>

      <View className='section'>
        <Text className='section-title'>三围数据（选填）</Text>
        {fields.slice(2).map((field) => (
          <View className='field' key={field.key}>
            <Text className='field__label'>{field.label}</Text>
            <Input
              className='field__input'
              type='digit'
              value={profile[field.key]}
              placeholder={field.placeholder}
              onInput={(event) => updateField(field.key, event.detail.value)}
            />
          </View>
        ))}
      </View>

      <View className='profile__actions'>
        <Button className='primary-button' disabled={loading} onClick={save}>
          保存信息
        </Button>
        <Button
          className='profile__privacy'
          onClick={() => Taro.navigateTo({ url: '/pages/privacy/index' })}
        >
          隐私与照片使用说明
        </Button>
        <Button className='danger-button' onClick={clearAll}>
          清空全部数据
        </Button>
      </View>
    </View>
  )
}
