import type { UserConfigExport } from '@tarojs/cli'

export default {
  env: {
    NODE_ENV: '"production"',
  },
  defineConstants: {
    API_BASE_URL: JSON.stringify(process.env.API_BASE_URL || 'http://139.224.226.80:8080'),
    // 暂无微信 AppSecret，默认允许 dev 登录以便联调；正式发布前用 ALLOW_DEV_LOGIN=false 关闭。
    ALLOW_DEV_LOGIN: JSON.stringify(process.env.ALLOW_DEV_LOGIN !== 'false'),
  },
  mini: {},
} satisfies UserConfigExport<'webpack5'>
