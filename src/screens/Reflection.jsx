import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { reflectionQuestions } from '../data/sample'
import { rich } from '../lib/markup'
import { useMatch } from '../store/MatchStore'

export default function Reflection() {
  const navigate = useNavigate()
  const { saveReflection } = useMatch()
  const [answers, setAnswers] = useState(() =>
    Object.fromEntries(reflectionQuestions.map((q) => [q.id, q.value])),
  )
  const [touched, setTouched] = useState(() => new Set())

  const set = (id, value) => {
    setAnswers((a) => ({ ...a, [id]: value }))
    setTouched((t) => new Set(t).add(id))
  }

  const progress = Math.round((touched.size / reflectionQuestions.length) * 100)

  return (
    <div className="app">
      <div className="screen-scroll">
        <TopBar title="Reflection" subtitle="~2 min · how was your head?" to="/momentum" />

        <div className="pad" style={{ paddingTop: 0, paddingBottom: 10 }}>
          <div className="progress"><div className="pf" style={{ width: `${progress}%` }} /></div>
        </div>

        <div className="pad-lg" style={{ paddingTop: 6 }}>
          {reflectionQuestions.map((q) => (
            <div className="q-block" key={q.id}>
              <div className="qt">{rich(q.label)}</div>

              {q.type === 'slider' && (
                <>
                  <input
                    className="range" type="range" min="1" max="10" value={answers[q.id]}
                    onChange={(e) => set(q.id, Number(e.target.value))}
                  />
                  <div className="slider-foot">
                    <span>{q.low}</span>
                    <span className="slider-val">{answers[q.id]}</span>
                    <span>{q.high}</span>
                  </div>
                </>
              )}

              {q.type === 'faces' && (
                <div className="face-row">
                  {q.faces.map((f, i) => (
                    <button key={i} className={`face${answers[q.id] === i ? ' on' : ''}`} onClick={() => set(q.id, i)}>
                      {f.emoji}<small>{f.label}</small>
                    </button>
                  ))}
                </div>
              )}

              {q.type === 'choice' && (
                <div className="chips">
                  {q.options.map((o) => (
                    <button key={o} className={`chip${answers[q.id] === o ? ' on' : ''}`} onClick={() => set(q.id, o)}>{o}</button>
                  ))}
                </div>
              )}

              {q.type === 'text' && (
                <textarea
                  className="ta" placeholder={q.placeholder} value={answers[q.id]}
                  onChange={(e) => set(q.id, e.target.value)}
                />
              )}
            </div>
          ))}

          <button className="btn btn-accent" onClick={() => { saveReflection(answers); navigate('/report') }}>Generate AI report&nbsp;&nbsp;✦</button>
        </div>
      </div>
    </div>
  )
}
