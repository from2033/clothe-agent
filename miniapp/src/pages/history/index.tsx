import { Button, Image, Text, View } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { useState } from 'react'
import { api } from '@/services/api'
import type { TryOnTask } from '@/types/domain'
import { formatRelativeTime, statusLabel } from '@/utils/format'
import './index.scss'

export default function HistoryPage() {
  const [tasks, setTasks] = useState<TryOnTask[]>([])
  const [loading, setLoading] = useState(true)

  useDidShow(() => {
    void loadTasks()
  })

  usePullDownRefresh(async () => {
    await loadTasks()
    Taro.stopPullDownRefresh()
  })

  async function loadTasks() {
    setLoading(true)
    try {
      setTasks(await api.listTryOnTasks())
    } catch (error) {
      Taro.showToast({
        title: error instanceof Error ? error.message : '加载失败',
        icon: 'none',
      })
    } finally {
      setLoading(false)
    }
  }

  async function removeTask(task: TryOnTask) {
    const confirmation = await Taro.showModal({
      title: '删除记录',
      content: '将同时删除对应的试穿结果图片。',
      confirmText: '删除',
      confirmColor: '#d93025',
    })
    if (!confirmation.confirm) return

    try {
      await api.deleteTryOnTask(task.id)
      setTasks((current) => current.filter((item) => item.id !== task.id))
      Taro.showToast({ title: '已删除', icon: 'success' })
    } catch (error) {
      Taro.showToast({
        title: error instanceof Error ? error.message : '删除失败',
        icon: 'none',
      })
    }
  }

  function retry(task: TryOnTask) {
    Taro.setStorageSync('pendingProductUrl', task.originalUrl)
    Taro.switchTab({ url: '/pages/try-on/index' })
  }

  const thisWeekCount = tasks.filter(
    (task) => Date.now() - task.createdAt < 7 * 86_400_000,
  ).length

  if (!loading && tasks.length === 0) {
    return (
      <View className='page history'>
        <View className='empty'>
          <Text className='empty__icon'>🕘</Text>
          <Text className='empty__title'>暂无试穿记录</Text>
          <Text className='empty__description'>
            创建试穿任务后，可在这里查看处理进度和结果
          </Text>
          <Button
            className='primary-button'
            onClick={() => Taro.switchTab({ url: '/pages/try-on/index' })}
          >
            开始试穿
          </Button>
        </View>
      </View>
    )
  }

  return (
    <View className='page history'>
      {tasks.length > 0 && (
        <View className='history__stats'>
          <View>
            <Text className='history__stat-value'>{tasks.length}</Text>
            <Text className='history__stat-label'>总试穿</Text>
          </View>
          <View>
            <Text className='history__stat-value'>{thisWeekCount}</Text>
            <Text className='history__stat-label'>本周</Text>
          </View>
          <View>
            <Text className='history__stat-value'>
              {tasks.filter((task) => task.status === 'succeeded').length}
            </Text>
            <Text className='history__stat-label'>已完成</Text>
          </View>
        </View>
      )}

      <View className='history__list'>
        {tasks.map((task) => (
          <View className='history-card' key={task.id}>
            <Image
              className='history-card__image'
              src={
                task.resultImageTempUrl ||
                task.productImageTempUrl ||
                task.personImageTempUrl ||
                ''
              }
              mode='aspectFill'
            />
            <View className='history-card__body'>
              <View className='history-card__meta'>
                <Text>{formatRelativeTime(task.createdAt)}</Text>
                <Text
                  className='history-card__delete'
                  onClick={() => void removeTask(task)}
                >
                  删除
                </Text>
              </View>
              <Text className='history-card__title'>
                {task.productTitle || '淘宝 / 天猫商品'}
              </Text>
              <Text className={`history-card__status status--${task.status}`}>
                {statusLabel(task.status)}
              </Text>
              {task.status === 'failed' && (
                <Text className='history-card__error'>
                  {task.failureReason || '生成失败'}
                </Text>
              )}
              <Button
                className='history-card__retry'
                onClick={() => retry(task)}
              >
                再次试穿
              </Button>
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}
