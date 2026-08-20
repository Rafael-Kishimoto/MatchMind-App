import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { useMatch } from '../store/MatchStore'
import { generateReport } from '../lib/report'
import { rich } from '../lib/markup'

// Shown for the demo history cards (no real match attached).
const SAMPLE = {
  title: 'You won the close ones — once you settled your nerves.',
  resultLine: 'vs. Lucas Moreno · 6–4, 3–6, 10–7 · Won',
  insight: 'Your momentum dropped sharply right after you flagged **😟 frustration at 3–2 in Set 2** — you then lost 5 of 6 points. Settling your routine there is your single biggest lever.',
  summary: 'A hard-fought 3-set win. You controlled Set 1 with aggressive returning, lost focus mid-match, then regrouped to take the deciding tiebreak 10–7.',
  mental: 'Confidence was solid (7/10) but recovery after errors was your weak point. Frustration — your self-reported challenge — lined up with your worst momentum dip.',
  technical: 'Serve was a weapon (5 aces) but 19 unforced errors — mostly forehands in long rallies — leaked points. Crosscourt rallies favoured you.',
  strengths: ['First-serve weapon and net play (8/11 won)', 'Mental resilience in the deciding tiebreak'],
  improve: ['Resetting emotionally after double faults', 'Forehand consistency in rallies over 6 shots'],
}

export default function Report() {
  const navigate = useNavigate()
  const { activeMatch, finishToHistory } = useMatch()
  const [generating, setGenerating] = useState(true)

  // Simulate the AI "thinking" — replaced by a real Claude call in Step 7.
  useEffect(() => {
    const t = setTimeout(() => setGenerating(false), 1300)
    return () => clearTimeout(t)
  }, [])

  const report = useMemo(() => (activeMatch ? generateReport(activeMatch) : SAMPLE), [activeMatch])

  if (generating) {
    return (
      <div className="app">
        <div className="screen-scroll">
          <div className="spin-wrap">
            <div className="spinner" />
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>Analysing your match…</div>
              <div className="muted" style={{ fontSize: 12.5, marginTop: 6, lineHeight: 1.5 }}>
                Connecting your stats, momentum, and reflection.
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <div className="screen-scroll">
        <TopBar title="AI report" to="/" />

        <div className="rep-hero">
          <span className="rep-badge">✦ AI Report</span>
          <div className="rep-title">{report.title}</div>
          <div className="rep-sub">{report.resultLine}</div>
        </div>

        <div className="insight">
          <div className="il">★ Mind ↔ Match link</div>
          <div className="ix">{rich(report.insight)}</div>
        </div>

        <div className="sec">
          <div className="sec-h"><span className="si">📝</span><span className="st">Match summary</span></div>
          <p>{report.summary}</p>
        </div>

        <div className="sec">
          <div className="sec-h"><span className="si">🧠</span><span className="st">Mental analysis</span></div>
          <p>{report.mental}</p>
        </div>

        <div className="sec">
          <div className="sec-h"><span className="si">🎾</span><span className="st">Technical &amp; tactical</span></div>
          <p>{report.technical}</p>
        </div>

        <div className="divider" />

        <div className="sec">
          <div className="sec-h"><span className="si">💪</span><span className="st">Strengths</span></div>
          {report.strengths.map((b, i) => (
            <div className="bullet" key={i}><span className="bd">✓</span><span>{b}</span></div>
          ))}
        </div>

        <div className="sec">
          <div className="sec-h"><span className="si">⚑</span><span className="st">Areas to improve</span></div>
          {report.improve.map((b, i) => (
            <div className="bullet neg" key={i}><span className="bd">!</span><span>{b}</span></div>
          ))}
        </div>

        <div className="pad-lg">
          <button className="btn btn-ghost" onClick={() => { finishToHistory(); navigate('/') }}>Save to match history</button>
        </div>
      </div>
    </div>
  )
}
