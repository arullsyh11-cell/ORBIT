const palette = [
  { border: 'var(--event-red)', background: 'var(--event-red-soft)', ink: 'var(--event-red-ink)' },
  { border: 'var(--event-charcoal)', background: 'var(--event-charcoal-soft)', ink: 'var(--event-charcoal-ink)' },
  { border: 'var(--event-olive)', background: 'var(--event-olive-soft)', ink: 'var(--event-olive-ink)' },
  { border: 'var(--event-slate)', background: 'var(--event-slate-soft)', ink: 'var(--event-slate-ink)' },
  { border: 'var(--event-sand)', background: 'var(--event-sand-soft)', ink: 'var(--event-sand-ink)' },
  { border: 'var(--event-muted)', background: 'var(--event-muted-soft)', ink: 'var(--event-muted-ink)' },
]

export function categoryColor(category = '') {
  let hash = 0
  for (const character of category.toLocaleLowerCase('id-ID')) hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  return palette[hash % palette.length]
}
