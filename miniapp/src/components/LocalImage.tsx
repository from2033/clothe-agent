import { Image } from '@tarojs/components'
import type { ComponentProps } from 'react'
import { useLocalImage } from '@/utils/useLocalImage'

// 包装 <Image>，自动把远程 http(s) 图下载成本地路径再渲染，
// 解决 iOS 真机不显示明文 http 图的问题。可在列表中安全使用。
type Props = Omit<ComponentProps<typeof Image>, 'src'> & { src?: string }

export function LocalImage({ src, ...rest }: Props) {
  const local = useLocalImage(src)
  return <Image src={local} {...rest} />
}
