import { Button, Image, Input, Text, View } from '@tarojs/components'
import Taro, { useDidHide, useDidShow } from '@tarojs/taro'
import { useRef, useState } from 'react'
import { api } from '@/services/api'
import type { Product, Profile, TryOnTask } from '@/types/domain'
import { statusLabel } from '@/utils/format'
import './index.scss'

const POLL_INTERVAL = 2500

export default function TryOnPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [url, setUrl] = useState('')
  const [product, setProduct] = useState<Product | null>(null)
  const [task, setTask] = useState<TryOnTask | null>(null)
  const [busy, setBusy] = useState(false)
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useDidShow(() => {
    void loadProfile()
    const pendingUrl = Taro.getStorageSync<string>('pendingProductUrl')
    if (pendingUrl) {
      setUrl(pendingUrl)
      Taro.removeStorageSync('pendingProductUrl')
    }
    if (task && ['pending', 'processing'].includes(task.status)) {
      schedulePoll(task.id)
    }
  })

  useDidHide(stopPolling)

  async function loadProfile() {
    try {
      setProfile(await api.getProfile())
    } catch {
      setProfile(null)
    }
  }

  function stopPolling() {
    if (pollTimer.current) {
      clearTimeout(pollTimer.current)
      pollTimer.current = null
    }
  }

  function schedulePoll(taskId: string) {
    stopPolling()
    pollTimer.current = setTimeout(() => void pollTask(taskId), POLL_INTERVAL)
  }

  async function pollTask(taskId: string) {
    try {
      const latest = await api.getTryOnTask(taskId)
      setTask(latest)
      if (['pending', 'processing'].includes(latest.status)) {
        schedulePoll(taskId)
      }
    } catch {
      schedulePoll(taskId)
    }
  }

  async function pasteUrl() {
    try {
      const clipboard = await Taro.getClipboardData()
      setUrl(clipboard.data.trim())
      setProduct(null)
      setTask(null)
    } catch {
      Taro.showToast({ title: '无法读取剪贴板', icon: 'none' })
    }
  }

  async function startTryOn() {
    if (!profile?.photoFileId) {
      Taro.showModal({
        title: '请先完善资料',
        content: '试穿前需要上传一张正面全身照。',
        confirmText: '去设置',
        success: ({ confirm }) => {
          if (confirm) Taro.switchTab({ url: '/pages/profile/index' })
        },
      })
      return
    }
    if (!url.trim()) {
      Taro.showToast({ title: '请粘贴商品链接', icon: 'none' })
      return
    }

    const accepted = Taro.getStorageSync<boolean>('privacyAccepted')
    if (!accepted) {
      const confirmation = await Taro.showModal({
        title: '照片使用确认',
        content:
          '你的人像和商品图将发送给 AI 服务生成试穿效果，并保存在云端至你主动删除。',
        confirmText: '同意并继续',
      })
      if (!confirmation.confirm) return
      Taro.setStorageSync('privacyAccepted', true)
    }

    setBusy(true)
    Taro.showLoading({ title: '解析商品中', mask: true })
    try {
      const parsed = await api.parseProduct(url.trim())
      setProduct(parsed)
      Taro.showLoading({ title: '创建任务中', mask: true })
      const created = await api.createTryOnTask(parsed.id)
      setTask(created)
      schedulePoll(created.id)
    } catch (error) {
      Taro.showToast({
        title: error instanceof Error ? error.message : '创建试穿失败',
        icon: 'none',
        duration: 3000,
      })
    } finally {
      Taro.hideLoading()
      setBusy(false)
    }
  }

  function reset() {
    stopPolling()
    setProduct(null)
    setTask(null)
    setUrl('')
  }

  async function saveResult() {
    if (!task?.resultImageTempUrl) return
    Taro.showLoading({ title: '保存中', mask: true })
    try {
      const download = await Taro.downloadFile({ url: task.resultImageTempUrl })
      await Taro.saveImageToPhotosAlbum({ filePath: download.tempFilePath })
      Taro.showToast({ title: '已保存到相册', icon: 'success' })
    } catch {
      Taro.showToast({ title: '保存失败，请检查相册权限', icon: 'none' })
    } finally {
      Taro.hideLoading()
    }
  }

  const processing = task && ['pending', 'processing'].includes(task.status)

  return (
    <View className='page try-on'>
      {!profile?.photoFileId && (
        <View className='try-on__warning'>
          <Text className='try-on__warning-title'>尚未上传个人照片</Text>
          <Text className='try-on__warning-text'>
            请先在“我的”页面完善资料后再开始试穿。
          </Text>
          <Button
            className='try-on__warning-button'
            onClick={() => Taro.switchTab({ url: '/pages/profile/index' })}
          >
            去设置
          </Button>
        </View>
      )}

      {profile?.photoFileId && !task && (
        <View className='section profile-card'>
          {profile.photoTempUrl && (
            <Image
              className='profile-card__image'
              src={profile.photoTempUrl}
              mode='aspectFill'
            />
          )}
          <View className='profile-card__body'>
            <Text className='profile-card__title'>个人资料已就绪</Text>
            <Text className='profile-card__description'>
              AI 将使用这张照片生成试穿效果
            </Text>
          </View>
          <Text
            className='profile-card__link'
            onClick={() => Taro.switchTab({ url: '/pages/profile/index' })}
          >
            修改
          </Text>
        </View>
      )}

      {!task ? (
        <>
          <View className='section'>
            <Text className='section-title'>淘宝 / 天猫商品链接</Text>
            <View className='url-field'>
              <Input
                className='url-field__input'
                value={url}
                placeholder='粘贴商品链接或淘口令中的链接'
                onInput={(event) => {
                  setUrl(event.detail.value)
                  setProduct(null)
                }}
              />
              <Text className='url-field__paste' onClick={pasteUrl}>
                粘贴
              </Text>
            </View>
            <Text className='url-field__tip'>
              首版仅支持可公开访问的淘宝、天猫链接。若解析失败，请更换链接后重试。
            </Text>
          </View>

          <View className='try-on__action'>
            <Button
              className='primary-button'
              disabled={busy || !profile?.photoFileId}
              onClick={startTryOn}
            >
              一键试穿
            </Button>
          </View>

          <View className='try-on__tips'>
            <Text className='try-on__tips-title'>使用提示</Text>
            <Text>• 使用正面、无遮挡的全身照效果更好</Text>
            <Text>• 商品页需包含清晰的单件服装主图</Text>
            <Text>• 任务在云端处理，切换页面不会中断</Text>
          </View>
        </>
      ) : (
        <View className='section result'>
          <View className='result__image-wrap'>
            <Image
              className='result__image'
              src={
                task.resultImageTempUrl ||
                product?.imageTempUrl ||
                profile?.photoTempUrl ||
                ''
              }
              mode='aspectFit'
            />
            <Text className={`result__status result__status--${task.status}`}>
              {statusLabel(task.status)}
            </Text>
          </View>

          <Text className='result__title'>
            {task.productTitle || product?.title || '试穿商品'}
          </Text>
          {processing && (
            <Text className='result__description'>
              AI 正在生成结果，你可以离开此页面并稍后到“记录”中查看。
            </Text>
          )}
          {task.status === 'failed' && (
            <Text className='result__error'>
              {task.failureReason || '生成失败，请稍后重试。'}
            </Text>
          )}

          <View className='result__actions'>
            <Button className='secondary-button' onClick={reset}>
              重新试穿
            </Button>
            {task.status === 'succeeded' && (
              <Button className='primary-button' onClick={saveResult}>
                保存到相册
              </Button>
            )}
          </View>
        </View>
      )}
    </View>
  )
}
