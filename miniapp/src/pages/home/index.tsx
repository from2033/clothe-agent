import { Button, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

const steps = [
  ['1', '完善个人信息', '上传正面全身照，填写身高及三围数据'],
  ['2', '粘贴商品链接', '首版支持淘宝、天猫商品链接'],
  ['3', '查看试穿效果', 'AI 异步生成，记录页可继续查看进度'],
]

export default function HomePage() {
  const switchTab = (url: string) => Taro.switchTab({ url })

  return (
    <View className='page home'>
      <View className='hero'>
        <View className='hero__mark'>衣</View>
        <View className='hero__body'>
          <Text className='hero__title'>智能虚拟试衣</Text>
          <Text className='hero__subtitle'>AI 驱动 · 快速查看上身效果</Text>
        </View>
      </View>

      <View className='hero__actions'>
        <Button
          className='secondary-button'
          onClick={() => switchTab('/pages/profile/index')}
        >
          设置资料
        </Button>
        <Button
          className='primary-button'
          onClick={() => switchTab('/pages/try-on/index')}
        >
          开始试穿
        </Button>
      </View>

      <View className='section'>
        <Text className='section-title'>快速入口</Text>
        <View
          className='quick-row'
          onClick={() => switchTab('/pages/try-on/index')}
        >
          <Text className='quick-row__icon'>👕</Text>
          <Text className='quick-row__label'>开始试穿</Text>
          <Text className='quick-row__arrow'>›</Text>
        </View>
        <View
          className='quick-row'
          onClick={() => switchTab('/pages/profile/index')}
        >
          <Text className='quick-row__icon'>👤</Text>
          <Text className='quick-row__label'>个人信息</Text>
          <Text className='quick-row__arrow'>›</Text>
        </View>
        <View
          className='quick-row'
          onClick={() => switchTab('/pages/history/index')}
        >
          <Text className='quick-row__icon'>🕘</Text>
          <Text className='quick-row__label'>试穿记录</Text>
          <Text className='quick-row__arrow'>›</Text>
        </View>
      </View>

      <View className='section'>
        <Text className='section-title'>使用步骤</Text>
        {steps.map(([number, title, description]) => (
          <View className='step' key={number}>
            <Text className='step__number'>{number}</Text>
            <View>
              <Text className='step__title'>{title}</Text>
              <Text className='step__description'>{description}</Text>
            </View>
          </View>
        ))}
      </View>

      <View className='home__tip'>
        <Text className='home__tip-title'>隐私说明</Text>
        <Text className='home__tip-content'>
          人像照片仅用于生成试穿效果，保存至你主动删除为止。你可以随时在“我的”页面清空全部数据。
        </Text>
        <Text
          className='home__tip-link'
          onClick={() => Taro.navigateTo({ url: '/pages/privacy/index' })}
        >
          查看完整说明
        </Text>
      </View>
    </View>
  )
}
