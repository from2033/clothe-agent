import type { UserConfigExport } from '@tarojs/cli'

export default {
  env: {
    NODE_ENV: '"production"',
  },
  defineConstants: {
    API_BASE_URL: JSON.stringify(process.env.API_BASE_URL || 'https://api.example.com'),
    ALLOW_DEV_LOGIN: 'false',
  },
  mini: {},
} satisfies UserConfigExport<'webpack5'>
