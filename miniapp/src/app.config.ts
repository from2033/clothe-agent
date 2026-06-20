export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/try-on/index',
    'pages/history/index',
    'pages/profile/index',
    'pages/privacy/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: '智能试衣间',
    navigationBarTextStyle: 'black',
    backgroundColor: '#f7f8fa',
  },
  tabBar: {
    color: '#666666',
    selectedColor: '#07c160',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      { pagePath: 'pages/home/index', text: '首页' },
      { pagePath: 'pages/try-on/index', text: '试穿' },
      { pagePath: 'pages/history/index', text: '记录' },
      { pagePath: 'pages/profile/index', text: '我的' },
    ],
  },
  permission: {
    'scope.writePhotosAlbum': {
      desc: '用于将试穿结果保存到相册',
    },
  },
  sitemapLocation: 'sitemap.json',
  lazyCodeLoading: 'requiredComponents',
})
