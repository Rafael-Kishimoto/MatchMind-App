// Sample data used to bring the screens to life in Step 3.
// In later steps this is replaced by real saved matches (localStorage, then Supabase).

export const profile = {
  name: 'Rafael C.',
  initial: 'R',
  role: 'player',
}

export const linkedPeople = [
  { id: 'p1', name: 'Mum', initial: 'M', role: 'Parent / Scout', permission: 'can record', tint: 'linear-gradient(135deg,#3a2b49,#1f1620)' },
  { id: 'p2', name: 'Coach Diego', initial: 'D', role: 'Parent / Scout', permission: 'view only', tint: 'linear-gradient(135deg,#2b3a49,#16202a)' },
]

export const inviteCode = '7K2-9QX'

export const careerStats = {
  matches: 12,
  winRate: 67,
  avgMindset: 7.4,
}

// momentum spark points (0 = top/best, used purely for the little sparkline)
export const matches = [
  {
    id: 'm1',
    opponent: 'Lucas Moreno',
    result: 'W',
    score: '6–4, 3–6, 10–7',
    surface: 'Hard',
    when: 'Today',
    spark: '0,20 8,14 16,18 24,8 32,16 40,6 48,10 54,4',
  },
  {
    id: 'm2',
    opponent: 'T. Hofer',
    result: 'L',
    score: '4–6, 5–7',
    surface: 'Clay',
    when: 'Sat',
    spark: '0,12 8,16 16,10 24,18 32,15 40,22 48,19 54,25',
  },
  {
    id: 'm3',
    opponent: 'D. Park',
    result: 'W',
    score: '6–2, 6–3',
    surface: 'Hard',
    when: 'Apr 28',
    spark: '0,18 8,12 16,14 24,9 32,11 40,6 48,8 54,5',
  },
]

// The mental reflection questionnaire (sliders, faces, choice, text)
export const reflectionQuestions = [
  { id: 'confidence', type: 'slider', label: 'How **confident** did you feel during the match?', low: 'Not at all', high: 'Very', value: 7 },
  { id: 'nerves', type: 'slider', label: 'How **nervous** were you before the match?', low: 'Calm', high: 'Very', value: 4 },
  { id: 'focus', type: 'slider', label: 'How well did you **stay focused** between points?', low: 'Poorly', high: 'Locked in', value: 6 },
  { id: 'recovery', type: 'faces', label: 'How well did you **recover after mistakes**?', faces: [
    { emoji: '😩', label: 'Poorly' }, { emoji: '😐', label: 'So-so' }, { emoji: '🙂', label: 'Well' }, { emoji: '😎', label: 'Great' },
  ], value: 1 },
  { id: 'challenge', type: 'choice', label: 'Biggest **mental challenge** today?', options: ['Frustration', 'Nerves', 'Focus', 'Confidence', 'Energy'], value: 'Frustration' },
  { id: 'selftalk', type: 'slider', label: 'How **positive** was your self-talk?', low: 'Negative', high: 'Positive', value: 5 },
  { id: 'motivation', type: 'slider', label: 'How **motivated** did you feel throughout?', low: 'Low', high: 'High', value: 8 },
  { id: 'notes', type: 'text', label: "Anything you'd do differently mentally? *(optional)*", placeholder: 'e.g. Stay calmer after double faults instead of rushing the next point…', value: '' },
]
