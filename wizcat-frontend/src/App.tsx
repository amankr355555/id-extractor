import { useMemo, useState } from 'react'
import { ArrowDownToLine, ArrowRight, Check, ChevronDown, CircleHelp, Clipboard, FileText, Hash, ImagePlus, Link2, ListFilter, LoaderCircle, Menu, RotateCcw, ScanLine, Settings2, ShieldCheck, Sparkles, Upload, X } from 'lucide-react'
import Tesseract from 'tesseract.js'

type FoundId = { value: string; kind: string; source: string }

const sample = `Hey team, please check these records before the end of the day.\n\nCustomer 84729103 has a duplicate profile under ID: 591-204-778. The original account is https://example.com/users/USR_82FA19C3 and the invoice number is INV-2024-00841.\n\nFor the support ticket, reference #TK-9031842. The shipment tracking code is 1Z999AA10123456784.\n\nThanks!`

const patterns = [
  { name: 'Email addresses', regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
  { name: 'URLs', regex: /https?:\/\/[^\s)]+/gi },
  { name: 'UUIDs', regex: /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi },
  { name: 'Phone numbers', regex: /\b(?:\+?\d{1,3}[ .-]?)?(?:\(?\d{3}\)?[ .-]?)\d{3}[ .-]?\d{4}\b/g },
  { name: 'Numeric IDs', regex: /\b\d{6,}\b/g },
  { name: 'Alphanumeric IDs', regex: /\b(?=[A-Z0-9_-]*[A-Z])(?=[A-Z0-9_-]*\d)[A-Z0-9]+(?:[-_][A-Z0-9]+)+\b/gi },
]

function App() {
  const [text, setText] = useState('')
  const [detected, setDetected] = useState<string[]>(patterns.map(p => p.name))
  const [results, setResults] = useState<FoundId[]>([])
  const [copied, setCopied] = useState(false)
  const [done, setDone] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [imageName, setImageName] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [ocrBusy, setOcrBusy] = useState(false)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrError, setOcrError] = useState('')

  const wordCount = useMemo(() => text.trim() ? text.trim().split(/\s+/).length : 0, [text])
  const extract = (input = text) => {
    const found: FoundId[] = []
    patterns.filter(p => detected.includes(p.name)).forEach(pattern => {
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags)
      for (const match of input.matchAll(regex)) {
        const value = match[0].replace(/[.,;!?]+$/, '')
        if (!found.some(item => item.value.toLowerCase() === value.toLowerCase())) {
          found.push({ value, kind: pattern.name, source: input.slice(Math.max(0, (match.index ?? 0) - 28), Math.min(input.length, (match.index ?? 0) + value.length + 28)).replace(/\s+/g, ' ') })
        }
      }
    })
    setResults(found)
    setDone(true)
  }
  const loadSample = () => { setText(sample); extract(sample) }
  const readImage = async (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { setOcrError('Choose an image file such as JPG, PNG, or WEBP.'); return }
    if (file.size > 10 * 1024 * 1024) { setOcrError('That image is over 10 MB. Choose a smaller photo.'); return }
    setOcrError(''); setImageName(file.name); setImagePreview(URL.createObjectURL(file)); setOcrBusy(true); setOcrProgress(0)
    try {
      const { data } = await Tesseract.recognize(file, 'eng', { logger: message => { if (message.status === 'recognizing text') setOcrProgress(Math.round(message.progress * 100)) } })
      const recognized = data.text.trim()
      if (!recognized) { setOcrError('We couldn’t find readable text in that image. Try a sharper, well-lit photo.'); return }
      const combined = [text.trim(), recognized].filter(Boolean).join('\n\n')
      setText(combined); extract(combined)
    } catch {
      setOcrError('Couldn’t read this image. Try another photo or paste the text instead.')
    } finally { setOcrBusy(false) }
  }
  const copyResults = async () => {
    await navigator.clipboard?.writeText(results.map(item => item.value).join('\n'))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }
  const exportCsv = () => {
    const csv = ['Identifier,Type', ...results.map(r => `"${r.value.replace(/"/g, '""')}","${r.kind}"`)].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'extracted-ids.csv'; anchor.click(); URL.revokeObjectURL(url)
  }

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#top" aria-label="ID Extractor home"><span className="brand-mark"><ScanLine size={19} strokeWidth={2.5} /></span><span>ID<span className="brand-light">Extractor</span></span></a>
      <button className="mobile-menu" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle navigation">{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button>
      <nav className={mobileOpen ? 'nav-links open' : 'nav-links'}><a className="nav-active" href="#workspace">Extractor</a><a href="#how-it-works">How it works</a><a href="#privacy">Privacy</a></nav>
      <div className="top-actions"><button className="help-btn"><CircleHelp size={16} /> Help</button><button className="avatar">A</button></div>
    </header>

    <main id="top">
      <section className="hero"><div className="eyebrow"><span className="eyebrow-dot" /> SMART TEXT PARSER</div><h1>Find the IDs hiding<br className="desktop-break" /> in your <span>text.</span></h1><p>Paste any text. Get every identifier, neatly extracted and ready to use.</p><div className="hero-note"><ShieldCheck size={15} /> Your text stays in your browser. Always.</div></section>

      <section className="workspace" id="workspace">
        <div className="input-card card"><div className="card-head"><div className="card-title"><span className="title-icon purple"><FileText size={17} /></span><div><h2>Your text</h2><span className="subheading">Paste text or upload a photo to scan</span></div></div><div className="input-actions"><label className="header-upload"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { void readImage(e.target.files?.[0]); e.currentTarget.value = '' }} disabled={ocrBusy} /><ImagePlus size={14} /> Upload photo</label><button className="sample-btn" onClick={loadSample}><Sparkles size={14} /> Try a sample</button></div></div>
          <div className="input-wrap"><textarea aria-label="Text to scan" value={text} onChange={e => { setText(e.target.value); setDone(false) }} placeholder="Paste your text here...\n\nEmails, tracking numbers, user IDs, URLs — we'll find them all." /><div className="input-footer"><span>{wordCount} words <i /> {text.length} characters</span><button onClick={() => { setText(''); setResults([]); setDone(false) }} disabled={!text}><RotateCcw size={13} /> Clear</button></div></div>
          <div className="photo-upload"><label className={`upload-drop ${ocrBusy ? 'uploading' : ''}`} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); void readImage(e.dataTransfer.files[0]) }}><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { void readImage(e.target.files?.[0]); e.currentTarget.value = '' }} disabled={ocrBusy} /><span className="upload-icon">{ocrBusy ? <LoaderCircle size={17} className="spin" /> : <ImagePlus size={17} />}</span><span className="upload-copy"><strong>{ocrBusy ? `Reading photo… ${ocrProgress}%` : 'Or drop a photo here'}</strong><small>{ocrBusy ? 'OCR runs locally in your browser' : 'JPG, PNG, or WEBP · up to 10 MB'}</small></span><span className="upload-action">{ocrBusy ? 'Please wait' : <><Upload size={13} /> Browse</>}</span></label>{imagePreview && <div className="photo-file"><img src={imagePreview} alt="Uploaded photo preview" /><span title={imageName}>{imageName}</span>{!ocrBusy && <button aria-label="Remove photo" onClick={() => { setImagePreview(''); setImageName(''); setOcrError('') }}><X size={14} /></button>}</div>}{ocrError && <p className="upload-error">{ocrError}</p>}</div>
          <div className="options-row"><div className="option-heading"><Settings2 size={15} /><span>Find these identifiers</span></div><div className="chips">{patterns.map((p, i) => <button key={p.name} onClick={() => setDetected(detected.includes(p.name) ? detected.filter(n => n !== p.name) : [...detected, p.name])} className={`chip ${detected.includes(p.name) ? 'selected' : ''}`}><span className={`chip-dot dot-${i}`} />{p.name}{detected.includes(p.name) && <Check size={12} />}</button>)}</div></div>
          <div className="scan-row"><span className="secure-hint"><ShieldCheck size={14} /> Processed locally on your device</span><button className="primary-btn" onClick={() => extract()} disabled={!text.trim() || !detected.length}>Extract IDs <ArrowRight size={16} /></button></div>
        </div>

        <div className={`results-card card ${done ? 'has-results' : ''}`}><div className="card-head results-head"><div className="card-title"><span className="title-icon green"><Hash size={17} /></span><div><h2>Extracted IDs <span className="count-pill">{done ? results.length : '—'}</span></h2><span className="subheading">{done ? results.length ? 'Found in your text' : 'No identifiers found in your text' : 'Your results will appear here'}</span></div></div>{results.length > 0 && <button className="export-btn" onClick={exportCsv}><ArrowDownToLine size={14} /> Export CSV <ChevronDown size={13} /></button>}</div>
          {results.length ? <><div className="result-toolbar"><span><ListFilter size={14} /> {results.length} unique {results.length === 1 ? 'identifier' : 'identifiers'}</span><button className="copy-btn" onClick={copyResults}>{copied ? <Check size={14} /> : <Clipboard size={14} />}{copied ? 'Copied!' : 'Copy all'}</button></div><div className="result-list">{results.map((item, index) => <div className="result-item" key={`${item.value}-${index}`}><span className="result-symbol"><Link2 size={15} /></span><div className="result-main"><strong>{item.value}</strong><span className="result-context">…{item.source}…</span></div><span className="type-label">{item.kind}</span></div>)}</div></> : <div className="empty-state"><div className="empty-illustration"><span className="empty-paper"><span /><span /><span /></span><span className="empty-search"><Hash size={18} /></span><Sparkles className="empty-spark" size={15} /></div><strong>{done ? 'Nothing to show just yet' : 'Ready when you are'}</strong><p>{done ? 'Try selecting more identifier types or paste different text.' : 'Your extracted identifiers will show up here. Give it a try with some text.'}</p><button onClick={loadSample}><Sparkles size={14} /> See how it works</button></div>}
          <div className="result-foot"><span><span className="foot-dot" /> {done ? 'Scan complete' : 'Waiting for input'}</span><span><ShieldCheck size={13} /> Private by design</span></div>
        </div>
      </section>

      <section className="how-section" id="how-it-works"><div className="section-heading"><span>QUICK & SIMPLE</span><h2>From messy text to <em>clear data.</em></h2><p>Three steps. A few seconds. All the IDs you need.</p></div><div className="steps"><div className="step"><div className="step-number">01</div><div className="step-icon lavender"><Clipboard size={19} /></div><h3>Drop in your text</h3><p>Paste emails, logs, support tickets, or any text you need to search.</p></div><div className="step-connector" /><div className="step"><div className="step-number">02</div><div className="step-icon mint"><ListFilter size={19} /></div><h3>Choose what to find</h3><p>Pick the identifier types you care about. We’ll do the careful scanning.</p></div><div className="step-connector" /><div className="step"><div className="step-number">03</div><div className="step-icon peach"><ArrowDownToLine size={19} /></div><h3>Copy or export</h3><p>Review your results, copy them in a click, or take them with you as CSV.</p></div></div></section>
      <section className="privacy-banner" id="privacy"><div className="privacy-icon"><ShieldCheck size={21} /></div><div><strong>Your data doesn’t leave your device.</strong><span>Everything is processed locally in your browser. Nothing is uploaded or stored.</span></div><span className="privacy-badge"><Check size={13} /> 100% private</span></section>
    </main>
    <footer><a className="brand footer-brand" href="#top"><span className="brand-mark"><ScanLine size={17} strokeWidth={2.5} /></span><span>ID<span className="brand-light">Extractor</span></span></a><span>Made for the little things that save a lot of time.</span><a href="#privacy">Privacy first <ShieldCheck size={13} /></a></footer>
  </div>
}

export default App
