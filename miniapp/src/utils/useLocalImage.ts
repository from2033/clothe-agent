import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'

// iOS 真机的 <Image> 不加载明文 http 图片（系统 ATS 拦截），但 downloadFile 可用。
// 该 hook 把远程 http(s) 图片下载成本地临时文件，返回可直接喂给 <Image src> 的本地路径。
// 本地路径（wxfile://）不受 ATS 限制，真机可正常显示。HTTPS 上线后此 hook 仍可无害保留。
const cache = new Map<string, string>()

export function useLocalImage(remoteUrl?: string | null): string {
  const isRemote = !!remoteUrl && /^https?:\/\//i.test(remoteUrl)
  const [local, setLocal] = useState(() => {
    if (!remoteUrl) return ''
    if (!isRemote) return remoteUrl
    return cache.get(remoteUrl) || ''
  })

  useEffect(() => {
    if (!remoteUrl) {
      setLocal('')
      return
    }
    if (!/^https?:\/\//i.test(remoteUrl)) {
      setLocal(remoteUrl)
      return
    }
    const cached = cache.get(remoteUrl)
    if (cached) {
      setLocal(cached)
      return
    }
    let cancelled = false
    Taro.downloadFile({ url: remoteUrl })
      .then((res) => {
        if (cancelled || res.statusCode !== 200) return
        cache.set(remoteUrl, res.tempFilePath)
        setLocal(res.tempFilePath)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [remoteUrl])

  return local
}
