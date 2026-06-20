import type { UserConfigExport } from '@tarojs/cli'

export default {
  env: {
    NODE_ENV: '"development"',
  },
  defineConstants: {
    API_BASE_URL: JSON.stringify(process.env.API_BASE_URL || 'http://139.224.226.80:8080'),
    ALLOW_DEV_LOGIN: JSON.stringify(process.env.ALLOW_DEV_LOGIN !== 'false'),
  },
  mini: {},
} satisfies UserConfigExport<'webpack5'>
