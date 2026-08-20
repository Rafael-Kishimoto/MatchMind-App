// Builds a Word document (.docx) of the MatchMind mockups, one screen per page.
// Usage: node scripts/build-mockups-doc.cjs
const fs = require('fs')
const path = require('path')
const {
  Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType,
  HeadingLevel, PageBreak, BorderStyle, Footer, PageNumber, LevelFormat,
} = require('docx')

const root = path.resolve(__dirname, '..')
const shotsDir = path.join(root, 'design', 'screenshots')
const manifest = JSON.parse(fs.readFileSync(path.join(shotsDir, 'manifest.json'), 'utf8'))

// Read width/height straight from the PNG header (IHDR chunk)
function pngSize(buf) {
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

// Fit each phone image within a sensible box (pixels @ 96dpi) keeping aspect ratio
const MAX_W = 384 // ~4.0 in
const MAX_H = 672 // ~7.0 in

const ACCENT = '3F6212' // dark tennis green (readable on white)
const MUTED = '555B66'

// ---- Title page ----
const titlePage = [
  new Paragraph({ spacing: { before: 2400 }, children: [] }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'MatchMind', bold: true, size: 72, font: 'Arial', color: '111418' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 80 },
    children: [new TextRun({ text: 'AI Tennis Performance App', size: 28, color: ACCENT, bold: true })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 40, after: 240 },
    children: [new TextRun({ text: 'Design Mockups', size: 24, color: MUTED })],
  }),
  // thin divider rule
  new Paragraph({
    alignment: AlignmentType.CENTER,
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CCCCCC', space: 1 } },
    children: [],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 300 },
    children: [new TextRun({ text: 'MYP Personal Project', size: 26, bold: true })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60 },
    children: [new TextRun({ text: 'Prototype design — 8 core screens', size: 22, color: MUTED })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60 },
    children: [new TextRun({ text: 'Created 12 June 2026', size: 22, color: MUTED })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 600 },
    children: [new TextRun({ text: '“MatchMind” is a working title and may change.', size: 18, italics: true, color: '8A8F98' })],
  }),
]

// ---- About page ----
const aboutPage = [
  new Paragraph({ pageBreakBefore: true, heading: HeadingLevel.HEADING_1, children: [new TextRun('About these mockups')] }),
  new Paragraph({
    spacing: { after: 160 },
    children: [new TextRun({
      text: 'MatchMind helps junior and amateur tennis players understand their matches — both on the court and in their head. '
        + 'Someone courtside records the match in a few quick taps, the player completes a short mental reflection afterwards, '
        + 'and an AI generates a personalised report that connects how the player felt to what actually happened during the match.',
    })],
  }),
  new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text: 'These are the first interactive design mockups. The eight core screens are:', bold: true })],
  }),
  ...manifest.map((m) => new Paragraph({
    numbering: { reference: 'screens', level: 0 },
    children: [
      new TextRun({ text: `${m.title}. `, bold: true }),
      new TextRun({ text: shortDesc(m.caption), color: MUTED }),
    ],
  })),
  new Paragraph({
    spacing: { before: 200 },
    children: [new TextRun({ text: 'Each screen is shown full-size on the following pages.', italics: true, color: MUTED })],
  }),
]

// Trim a caption down to its first sentence for the summary list
function shortDesc(caption) {
  const firstSentence = caption.split(/(?<=\.)\s/)[0]
  return firstSentence.length > 110 ? firstSentence.slice(0, 107) + '…' : firstSentence
}

// ---- One page per screen ----
const screenPages = []
manifest.forEach((m) => {
  const buf = fs.readFileSync(path.join(shotsDir, m.file))
  const { width, height } = pngSize(buf)
  const scale = Math.min(MAX_W / width, MAX_H / height)
  const w = Math.round(width * scale)
  const h = Math.round(height * scale)

  screenPages.push(
    new Paragraph({
      pageBreakBefore: true,
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun(`${m.num} · ${m.title}`)],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 140 },
      children: [new ImageRun({
        type: 'png',
        data: buf,
        transformation: { width: w, height: h },
        altText: { title: m.title, description: m.caption, name: `screen-${m.num}` },
      })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: m.caption, italics: true, color: MUTED, size: 20 })],
    }),
  )
})

const doc = new Document({
  styles: {
    default: { document: { run: { font: 'Arial', size: 22 } } },
    paragraphStyles: [
      {
        id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 32, bold: true, font: 'Arial', color: '111418' },
        paragraph: { spacing: { before: 240, after: 200 }, outlineLevel: 0 },
      },
      {
        id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 26, bold: true, font: 'Arial', color: ACCENT },
        paragraph: { spacing: { before: 120, after: 120 }, outlineLevel: 1 },
      },
    ],
  },
  numbering: {
    config: [{
      reference: 'screens',
      levels: [{
        level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 540, hanging: 280 } } },
      }],
    }],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 }, // US Letter
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: 'MatchMind · Design Mockups · Page ', size: 16, color: '999999' }),
            new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '999999' }),
          ],
        })],
      }),
    },
    children: [...titlePage, ...aboutPage, ...screenPages],
  }],
})

const outPath = path.join(root, 'design', 'MatchMind-Design-Mockups.docx')
Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outPath, buffer)
  console.log('Wrote', outPath, '(' + (buffer.length / 1024).toFixed(0) + ' KB)')
})
