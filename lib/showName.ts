export function showName(
  name: string,
  lookup: { name: string; name_en?: string }[],
  lang: string
): string {
  if (!name) return '—'
  if (lang === 'en') {
    const found = lookup.find(l => l.name === name)
    return found?.name_en || name
  }
  return name
}