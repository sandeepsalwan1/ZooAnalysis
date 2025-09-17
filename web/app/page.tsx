"use client"

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, Play, Eraser, PawPrint, Sparkles } from 'lucide-react'

export default function Page() {
  const inputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [report, setReport] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')

  function clickPick() {
    inputRef.current?.click()
  }
  function onFileChange(f?: File) {
    if (!f) return
    setFile(f)
    setReport('')
    setStatus(`${f.name} • ${(f.size / 1024 / 1024).toFixed(2)} MB`)
    const url = URL.createObjectURL(f)
    if (videoRef.current) videoRef.current.src = url
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) onFileChange(f)
  }
  function onDragOver(e: React.DragEvent) { e.preventDefault() }
  function clearAll() {
    setFile(null); setReport(''); setStatus('')
    if (inputRef.current) inputRef.current.value = ''
    if (videoRef.current) videoRef.current.src = ''
  }

  async function analyze() {
    if (!file) return
    setBusy(true)
    setReport('')
    setStatus('Extracting frames…')

    // Extract frames client-side using HTMLVideoElement + canvas
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.src = url
    video.muted = true
    await video.play().catch(() => {})
    await new Promise<void>((resolve) => { video.onloadedmetadata = () => resolve() })

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const sampleEvery = 50 // frames
    const maxFrames = 24
    const frames: string[] = []
    canvas.width = 768
    canvas.height = Math.round((video.videoHeight / video.videoWidth) * 768)

    const totalFrames = Math.floor(video.duration * 30)
    for (let i = 0; i < totalFrames && frames.length < maxFrames; i += sampleEvery) {
      const t = i / 30
      video.currentTime = Math.min(t, Math.max(0, video.duration - 0.05))
      await new Promise((r) => video.onseeked = () => r(null))
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
      frames.push(dataUrl)
    }

    setStatus('Uploading and analyzing…')
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ frames })
      })
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      const data = await res.json()
      setReport(data.report || '')
      setStatus('Done.')
    } catch (e: any) {
      setStatus(e.message)
    } finally {
      setBusy(false)
      URL.revokeObjectURL(url)
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand2 via-brand1 to-brand3 shadow-lg" />
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">AnimalCare</h1>
            <p className="text-sm text-slate-400">AI-driven animal behavior and health narratives</p>
          </div>
        </div>
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="hidden md:flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-slate-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Ready
        </motion.div>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-md shadow-2xl">
          <div onDrop={onDrop} onDragOver={onDragOver} className="group rounded-xl border-2 border-dashed border-white/20 p-5 text-center hover:border-brand1/60 transition-colors">
            <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={(e) => onFileChange(e.target.files?.[0] || undefined)} />
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-6 w-6 text-slate-300" />
              <p><span className="font-semibold">Drag & drop</span> a video here, or click to select</p>
              <p className="text-xs text-slate-400">Accepted: mp4, mov, avi, mkv</p>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <button onClick={clickPick} className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-tr from-brand2 via-brand1 to-brand3 px-3 py-2 text-sm font-semibold text-black shadow">
                <PawPrint className="h-4 w-4" /> Choose Video
              </button>
              <button disabled={!file || busy} onClick={analyze} className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm font-semibold text-white/90 disabled:opacity-50">
                <Play className="h-4 w-4" /> Analyze
              </button>
              <button onClick={clearAll} className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-white/0 px-3 py-2 text-sm font-semibold text-white/90">
                <Eraser className="h-4 w-4" /> Clear
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-400 min-h-[1rem]">{busy ? 'Uploading and analyzing…' : status}</p>
            <div className="mt-2">
              <video ref={videoRef} controls className="w-full rounded-lg border border-white/15" />
            </div>
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-md shadow-2xl">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand1" />
            <h3 className="m-0 text-base font-semibold">Behavior Report</h3>
          </div>
          <textarea className="h-[420px] w-full resize-vertical rounded-xl border border-white/15 bg-black/30 p-3 text-slate-100" placeholder="Report will appear here..." readOnly value={report} />
        </motion.section>
      </div>
    </main>
  )
}

