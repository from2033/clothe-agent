import { Text, View } from '@tarojs/components'
import './index.scss'

export default function PrivacyPage() {
  return (
    <View className='page privacy'>
      <View className='section'>
        <Text className='privacy__title'>我们如何使用你的数据</Text>
        <Text className='privacy__paragraph'>
          小程序使用微信提供的静默身份标识区分不同用户，不读取微信昵称、头像或手机号。
        </Text>
        <Text className='privacy__paragraph'>
          你主动上传的人像照片、身高及三围数据仅用于创建虚拟试穿任务。商品链接用于提取公开商品信息和服装主图。
        </Text>
        <Text className='privacy__paragraph'>
          创建试穿任务时，人像和服装图片可能发送给已配置的第三方 AI
          服务商。正式上线前，运营方应在此处补充具体服务商名称、隐私政策链接和数据处理区域。
        </Text>
      </View>
      <View className='section'>
        <Text className='privacy__title'>保存与删除</Text>
        <Text className='privacy__paragraph'>
          资料、原图和结果默认保留至你主动删除。你可以删除单条试穿记录，也可以在“我的”页面清空全部数据。
        </Text>
        <Text className='privacy__paragraph'>
          云端备份、日志和服务商侧数据的实际清理周期，应在选定正式 AI
          服务商后按其协议补充，并与微信小程序隐私保护指引保持一致。
        </Text>
      </View>
      <View className='privacy__notice'>
        <Text>
          本页面是产品内说明模板，不替代微信公众平台中需要配置并提交审核的《小程序隐私保护指引》。
        </Text>
      </View>
    </View>
  )
}
