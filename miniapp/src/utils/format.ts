export function formatRelativeTime(timestamp: number): string {
  const date = new Date(timestamp)
  const diff = Math.max(0, Date.now() - timestamp)
  const days = Math.floor(diff / 86_400_000)
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`

  if (days === 0) return `今天 ${time}`
  if (days === 1) return `昨天 ${time}`
  if (days < 7) return `${days} 天前`
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(date.getDate()).padStart(2, '0')}`
}

export function statusLabel(status: string): string {
  return {
    pending: '等待处理',
    processing: 'AI 生成中',
    succeeded: '试穿完成',
    failed: '生成失败',
  }[status] || status
}
