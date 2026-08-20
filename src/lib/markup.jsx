// Render a string containing **bold** and *muted* markers as React nodes.
export function rich(text) {
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return tokens.map((t, i) => {
    if (t.startsWith('**') && t.endsWith('**')) return <b key={i}>{t.slice(2, -2)}</b>
    if (t.startsWith('*') && t.endsWith('*')) return <span key={i} className="muted">{t.slice(1, -1)}</span>
    return <span key={i}>{t}</span>
  })
}
