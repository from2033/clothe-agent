import { defineConfig, type UserConfigExport } from '@tarojs/cli'
import path from 'node:path'
import devConfig from './dev'
import prodConfig from './prod'

export default defineConfig<'webpack5'>(async (merge, { mode }) => {
  const baseConfig: UserConfigExport<'webpack5'> = {
    projectName: 'cloth-agent-miniapp',
    date: '2026-06-20',
    designWidth: 750,
    deviceRatio: {
      375: 2,
      750: 1,
    },
    sourceRoot: 'src',
    outputRoot: 'dist',
    framework: 'react',
    compiler: 'webpack5',
    cache: { enable: true },
    alias: {
      '@': path.resolve(__dirname, '..', 'src'),
    },
    copy: {
      patterns: [
        { from: 'src/sitemap.json', to: 'dist/sitemap.json' },
      ],
      options: {},
    },
    mini: {
      postcss: {
        pxtransform: { enable: true, config: {} },
        cssModules: { enable: false },
      },
    },
  }

  return mode === 'development'
    ? merge({}, baseConfig, devConfig)
    : merge({}, baseConfig, prodConfig)
})
