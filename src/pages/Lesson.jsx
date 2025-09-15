import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Separator } from '@/components/ui/separator.jsx'

import Api, { resolveFileUrl } from '../services/api.js'

// Convert Google Drive URLs to embeddable preview links
function getEmbeddablePdfUrl(u) {
  if (!u) return u;
  try {
    const url = new URL(u);
    if (url.hostname.includes('drive.google.com')) {
      // Pattern 1: /file/d/FILE_ID/...  -> use that ID
      const m1 = u.match(/\/file\/d\/([^/]+)/);
      const id = m1 ? m1[1] : url.searchParams.get('id'); // Pattern 2: ?id=FILE_ID (open, uc, etc.)
      if (id) return `https://drive.google.com/file/d/${id}/preview`;
    }
  } catch (e) { /* ignore */ }
  return u;
}

export default function LessonPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lesson, setLesson] = useState(null)
  const [updating, setUpdating] = useState(false)

  // PDF inline viewer state
  const [pdfSrc, setPdfSrc] = useState(null)
  const [pdfTitle, setPdfTitle] = useState('')

  const [isPlaying, setIsPlaying] = useState(false)
  const playerRef = useRef(null) // YouTube player instance
  const iframeRef = useRef(null) // iframe element ref
  const wrapperRef = useRef(null) // wrapper element for fullscreen with overlay
  const pdfWrapperRef = useRef(null) // PDF viewer container for fullscreen
  const [ytReady, setYtReady] = useState(false) // YouTube API readiness
  const [isFullscreen, setIsFullscreen] = useState(false) // fullscreen toggle (video)
  const [pdfIsFullscreen, setPdfIsFullscreen] = useState(false) // fullscreen toggle (pdf)
  const [controlsVisible, setControlsVisible] = useState(true) // إظهار/إخفاء عناصر التحكم حسب النشاط
  const activityTimeoutRef = useRef(null) // مؤقت السكون

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const res = await Api.getLessonDetails(id)
        if (res.success && mounted) setLesson(res.lesson)
      } catch (e) {
        setError(e.message || 'تعذر تحميل الدرس')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [id])

  // تحميل YouTube IFrame API مرة واحدة ومراقبة جاهزيته
  useEffect(() => {
    if (window.YT && window.YT.Player) { setYtReady(true); return }
    const onReady = () => setYtReady(true)
    window.onYouTubeIframeAPIReady = onReady
    const scriptId = 'yt-iframe-api'
    if (!document.getElementById(scriptId)) {
      const tag = document.createElement('script')
      tag.id = scriptId
      tag.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(tag)
    }
    return () => {
      if (window.onYouTubeIframeAPIReady === onReady) window.onYouTubeIframeAPIReady = null
    }
  }, [])

  // مراقبة وضع ملء الشاشة وتحديث الحالة (للفيديو والـPDF)
  useEffect(() => {
    const handler = () => {
      const fsEl = document.fullscreenElement
      setIsFullscreen(!!fsEl && (wrapperRef.current && fsEl === wrapperRef.current))
      setPdfIsFullscreen(!!fsEl && (pdfWrapperRef.current && fsEl === pdfWrapperRef.current))
      // عند الدخول لملء الشاشة نظهر العناصر ثم نبدأ مؤقت السكون
      setControlsVisible(true)
    }
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  // إخفاء عناصر التحكم بعد فترة من عدم وجود نشاط (حركة ماوس/كيبورد)
  useEffect(() => {
    const container = wrapperRef.current
    if (!container) return

    const resetTimer = () => {
      setControlsVisible(true)
      if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current)
      activityTimeoutRef.current = setTimeout(() => setControlsVisible(false), 2000)
    }

    // نظهرها فورًا ثم نبدأ العد
    resetTimer()

    const onMouseMove = () => resetTimer()
    const onKeyDown = () => resetTimer()
    const onClick = () => resetTimer()

    // نسمع على الحاوية كاملة (تشمل الطبقة)
    container.addEventListener('mousemove', onMouseMove)
    window.addEventListener('keydown', onKeyDown)
    container.addEventListener('click', onClick)

    return () => {
      container.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('keydown', onKeyDown)
      container.removeEventListener('click', onClick)
      if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current)
    }
  }, [wrapperRef, isFullscreen])

  // عند تغيير الدرس نعيد إظهار زر التشغيل ونضبط اللاعب من الصفر
  useEffect(() => {
    setIsPlaying(false)
    if (playerRef.current?.destroy) playerRef.current.destroy()
    playerRef.current = null
  }, [id])

  async function markCompleted() {
    try {
      setUpdating(true)
      await Api.updateLessonProgress(id, { completed: true })
      setLesson({ ...lesson, progress: { ...(lesson.progress||{}), completed: true } })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return (
    <div className="min-h-[60vh] nurso-section flex flex-col items-center justify-center text-3xl font-bold text-gray-800 gap-4">
      <div
        className="w-32 aspect-square rounded-full relative flex justify-center items-center animate-[spin_3s_linear_infinite] z-40 bg-[conic-gradient(white_0deg,white_300deg,transparent_270deg,transparent_360deg)] before:animate-[spin_2s_linear_infinite] before:absolute before:w-[60%] before:aspect-square before:rounded-full before:z-[80] before:bg-[conic-gradient(white_0deg,white_270deg,transparent_180deg,transparent_360deg)] after:absolute after:w-3/4 after:aspect-square after:rounded-full after:z-[60] after:animate-[spin_3s_linear_infinite] after:bg-[conic-gradient(#065f46_0deg,#065f46_180deg,transparent_180deg,transparent_360deg)]"
      >
        <span
          className="absolute w-[85%] aspect-square rounded-full z-[60] animate-[spin_5s_linear_infinite] bg-[conic-gradient(#34d399_0deg,#34d399_180deg,transparent_180deg,transparent_360deg)]"
        >
        </span>
      </div>
      جاري التحميل...
    </div>
  )
  if (error) return <div className="p-6 text-red-600">{error}</div>
  if (!lesson) return null

  // Assume YouTube URL in video_url
  const yt = lesson.video_url
  const embed = yt && yt.includes('youtube') ? yt.replace('watch?v=', 'embed/') : yt
  const videoId = yt && yt.includes('youtube') ? (new URL(yt)).searchParams.get('v') : null
  const embedSrc = embed ? (embed.includes('?') ? embed + '&enablejsapi=1&controls=0&modestbranding=1' : embed + '?enablejsapi=1&controls=0&modestbranding=1') : ''

  // Back navigation target (subject page if available, else previous page)
  const subjectId = lesson?.subject?.id ?? lesson?.subject_id ?? lesson?.subjectId
  const onBack = () => {
    if (subjectId) navigate(`/subject/${subjectId}`, { replace: true })
    else navigate('/dashboard', { replace: true })
  }

  return (
    <div className="p-0 md:p-0 bg-gradient-to-b from-emerald-50/70 via-white to-white dark:from-gray-950 dark:via-gray-950 dark:to-gray-900 min-h-[calc(100vh-80px)] nurso-section relative">
      <div className="nurso-container space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
                {/* play icon */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
              {lesson.title}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              {/* Subject/extra info if available */}
              {lesson?.subject?.title ? (
                <span className="inline-flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-emerald-600"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 14H7v-2h6v2zm4-4H7V8h10v4z"/></svg>
                  {lesson.subject.title}
                </span>
              ) : null}
              {lesson?.progress?.completed ? (
                <Badge className="bg-emerald-600 hover:bg-emerald-700">مكتمل</Badge>
              ) : (
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">قيد المتابعة</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={onBack}
              variant="outline"
              className="h-10 rounded-lg border-emerald-600 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 px-4 inline-flex items-center gap-2 shadow-sm"
              title={subjectId ? `العودة إلى مادة: ${lesson?.subject?.title || 'المادة'}` : 'رجوع'}
            >
              {/* back arrow */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              <span className="font-medium">عودة</span>
            </Button>
          </div>
        </div>

        <Card className="border-0 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)] ring-1 ring-black/5 dark:ring-white/10 bg-white/70 dark:bg-gray-900/70 backdrop-blur nurso-hover-lift">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">تفاصيل الدرس</CardTitle>
          </CardHeader>
          <div className="px-6">
            <Separator />
          </div>
          <CardContent className="space-y-6 pt-6">

            {/* Video */}
            {embed ? (
              <div className="space-y-3">
                <div ref={wrapperRef} className="relative mx-auto aspect-video w-full rounded-2xl overflow-hidden ring-1 ring-black/10 dark:ring-white/10 shadow-xl bg-black">
                  {/* منع التفاعل المباشر مع الفيديو */}
                  <iframe
                    ref={iframeRef}
                    className="w-full h-full pointer-events-none"
                    src={embedSrc}
                    title={lesson.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />

                  {/* طبقة تحكم دائمة فوق الفيديو */}
                  <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between">
                    {/* شريط علوي شفاف */}
                    <div className={`pointer-events-none p-3 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent text-white transition-opacity duration-300 ${controlsVisible ? 'opacity-100' : 'opacity-0'}`}>
                      <span className="text-sm font-medium truncate">{lesson.title}</span>
                    </div>

                    {/* زر تشغيل/إيقاف في الوسط */}
                    <div className={`pointer-events-auto flex items-center justify-center select-none transition-opacity duration-300 ${controlsVisible ? 'opacity-100' : 'opacity-0'}`}>
                      <button
                        type="button"
                        onClick={() => {
                          if (!playerRef.current && window.YT && window.YT.Player && iframeRef.current) {
                            playerRef.current = new window.YT.Player(iframeRef.current, {
                              events: {
                                onReady: () => {
                                  playerRef.current.playVideo()
                                  setIsPlaying(true)
                                },
                                onStateChange: (e) => {
                                  // 1 playing, 2 paused, 0 ended
                                  if (e.data === 1) setIsPlaying(true)
                                  if (e.data === 2 || e.data === 0) setIsPlaying(false)
                                }
                              }
                            })
                          } else if (playerRef.current) {
                            if (isPlaying) { playerRef.current.pauseVideo(); setIsPlaying(false) } else { playerRef.current.playVideo(); setIsPlaying(true) }
                          }
                        }}
                        aria-label={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
                        className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/95 text-black shadow-xl ring-1 ring-black/10 hover:bg-white transition-colors"
                      >
                        {isPlaying ? (
                          // إيقاف مؤقت
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                            <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                          </svg>
                        ) : (
                          // تشغيل
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 ml-1">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        )}
                      </button>
                    </div>

                    {/* شريط تحكم سفلي دائم */}
                    <div className={`pointer-events-auto p-3 bg-gradient-to-t from-black/60 to-transparent text-white select-none transition-opacity duration-300 ${controlsVisible ? 'opacity-100' : 'opacity-0'}`}>
                      <div className="flex items-center gap-3">
                        {/* تشغيل/إيقاف */}
                        <Button size="sm" variant="secondary" aria-label={isPlaying ? 'إيقاف' : 'تشغيل'} className="hidden md:inline-flex bg-white/90 text-gray-900 hover:bg-white shadow-sm"
                          onClick={() => {
                            if (playerRef.current) {
                              isPlaying ? playerRef.current.pauseVideo() : playerRef.current.playVideo()
                              setIsPlaying(!isPlaying)
                            } else if (window.YT && window.YT.Player && iframeRef.current) {
                              playerRef.current = new window.YT.Player(iframeRef.current, { events: { onReady: () => playerRef.current.playVideo() } })
                              setIsPlaying(true)
                            }
                          }}>
                          {isPlaying ? 'إيقاف' : 'تشغيل'}
                        </Button>

                        {/* تقديم/ترجيع 10 ثواني */}
                        <Button size="sm" variant="secondary" className="bg-white/90 text-gray-900 hover:bg-white shadow-sm" onClick={() => playerRef.current && playerRef.current.seekTo(Math.max(0, playerRef.current.getCurrentTime() - 10), true)}>
                          -10s
                        </Button>
                        <Button size="sm" variant="secondary" className="bg-white/90 text-gray-900 hover:bg-white shadow-sm" onClick={() => playerRef.current && playerRef.current.seekTo(playerRef.current.getCurrentTime() + 10, true)}>
                          +10s
                        </Button>

                        {/* الصوت */}
                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 opacity-80"><path d="M3 9v6h4l5 5V4L7 9H3z"/></svg>
                          <input type="range" min="0" max="100" defaultValue="100" className="w-32 accent-emerald-500" onChange={(e) => playerRef.current && playerRef.current.setVolume(parseInt(e.target.value, 10))} />
                        </div>

                        {/* السرعة */}
                        <select className="bg-white/90 dark:bg-white/80 text-gray-900 rounded px-2 py-1 shadow-sm" onChange={(e) => playerRef.current && playerRef.current.setPlaybackRate(parseFloat(e.target.value))} defaultValue="1">
                          <option value="0.5">0.5x</option>
                          <option value="0.75">0.75x</option>
                          <option value="1">1x</option>
                          <option value="1.25">1.25x</option>
                          <option value="1.5">1.5x</option>
                          <option value="2">2x</option>
                        </select>

                        {/* ملء الشاشة */}
                        <Button
                          size="sm"
                          variant="secondary"
                          className="ml-auto bg-white/90 text-gray-900 hover:bg-white shadow-sm"
                          onClick={() => {
                            const container = wrapperRef.current
                            if (!container) return
                            if (!document.fullscreenElement) {
                              if (container.requestFullscreen) container.requestFullscreen()
                            } else {
                              if (document.exitFullscreen) document.exitFullscreen()
                            }
                          }}
                        >{isFullscreen ? 'تصغير الفيديو' : 'تكبير الفيديو'}</Button>
                      </div>
                    </div>

                    {/* زر تكبير دائم في أسفل يمين الفيديو لضمان ظهوره على الشاشات الصغيرة */}
                    <button
                      type="button"
                      aria-label={isFullscreen ? 'تصغير الفيديو' : 'تكبير الفيديو'}
                      className="pointer-events-auto absolute bottom-3 right-3 z-30 inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/95 text-gray-900 shadow-lg ring-1 ring-black/10 md:hidden"
                      onClick={() => {
                        const container = wrapperRef.current
                        if (!container) return
                        if (!document.fullscreenElement) {
                          if (container.requestFullscreen) container.requestFullscreen()
                        } else {
                          if (document.exitFullscreen) document.exitFullscreen()
                        }
                      }}
                    >
                      {/* icon */}
                      {isFullscreen ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M14 10h6V4h-2v4h-4v2zM4 10h6V8H6V4H4v6zm10 4v2h4v4h2v-6h-6zM4 14v6h2v-4h4v-2H4z"/></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M14 4h6v6h-2V6h-4V4zM4 4h6v2H6v4H4V4zm16 16h-6v-2h4v-4h2v6zM10 20H4v-6h2v4h4v2z"/></svg>
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 text-center">اضغط على تشغيل لبدء الفيديو. عناصر التحكم تظهر تلقائيًا مع الحركة.</p>
              </div>
            ) : (
              <div className="text-sm text-gray-600">لا يوجد فيديو</div>
            )}

            {/* Description */}
            <div className="rounded-xl bg-emerald-50/60 dark:bg-white/5 ring-1 ring-emerald-100 dark:ring-white/10 p-4">
              <div className="text-sm font-semibold text-emerald-900/90 dark:text-white mb-2">وصف الدرس</div>
              <div className="text-gray-700 dark:text-gray-300 leading-relaxed">{lesson.description || ''}</div>
            </div>

            {/* Attachments */}
            {lesson.attachments?.length ? (
              <div>
                <div className="font-medium text-gray-900 mb-2">المرفقات</div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {lesson.attachments.map((a, i) => {
                    const raw = a.url || a
                    const url = getEmbeddablePdfUrl(resolveFileUrl(raw))
                    const name = a.name || (typeof a === 'string' ? raw.split('/').pop() : (a.url || 'مرفق'))
                    return (
                      <button
                        key={i}
                        type="button"
                        className="group flex items-center gap-3 rounded-lg border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur p-3 text-right transition hover:shadow-md hover:bg-white dark:hover:bg-white/10"
                        onClick={() => {
                          setPdfSrc(`${url}#toolbar=0&navpanes=0&scrollbar=0`)
                          setPdfTitle(name)
                        }}
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm1 7H8V7h7v2z"/></svg>
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-300">{name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}

            {/* Inline PDF viewer */}
            {pdfSrc ? (
              <div className="mt-4">
                <div className="sticky top-0 z-10 p-2 border rounded-t-xl bg-gradient-to-r from-emerald-600 to-emerald-500 dark:from-emerald-700 dark:to-emerald-600 text-white text-sm flex items-center justify-between shadow">
                  <span className="font-medium truncate">عرض: {pdfTitle || 'مرفق'}</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="underline underline-offset-2 hover:opacity-90"
                      onClick={() => {
                        const el = pdfWrapperRef.current
                        if (!el) return
                        if (!document.fullscreenElement) {
                          el.requestFullscreen && el.requestFullscreen()
                        } else {
                          document.exitFullscreen && document.exitFullscreen()
                        }
                      }}
                    >{pdfIsFullscreen ? 'خروج من ملء الشاشة' : 'ملء الشاشة'}</button>
                    <button type="button" className="text-white/90 hover:text-white" onClick={() => { setPdfSrc(null); setPdfTitle('') }}>إغلاق</button>
                  </div>
                </div>
                <div ref={pdfWrapperRef} className="relative bg-white dark:bg-gray-900 rounded-b-xl border border-t-0 dark:border-white/10 overflow-hidden shadow">
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center select-none">
                    <span className="text-black/5 text-6xl font-black -rotate-12 tracking-widest">NURSOPEDIA</span>
                  </div>
                  <iframe
                    title={pdfTitle || 'pdf'}
                    className={`w-full ${pdfIsFullscreen ? 'h-[100vh]' : 'h-[80vh]'} border-0`}
                    src={pdfSrc}
                    sandbox="allow-scripts allow-same-origin"
                    allow="autoplay; fullscreen"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="text-xs text-gray-500 mt-2">العرض فقط بدون تنزيل (قد لا يمكن منعه تمامًا حسب المتصفح)</div>
              </div>
            ) : null}

            {/* Actions */}
            <div className="flex gap-3 items-center flex-wrap">
              <Button onClick={markCompleted} disabled={updating || lesson?.progress?.completed} className="h-11 px-5 rounded-xl bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-600/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M9 16.2l-3.5-3.5L4 14.2 9 19l11-11-1.5-1.5z"/></svg>
                <span>{lesson?.progress?.completed ? 'مكتمل' : 'متابعة'}</span>
              </Button>
              {lesson?.exams?.map(ex => (
                <a key={ex.id} href={`/exam/${ex.id}`} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M3 4h18v2H3V4zm0 14h18v2H3v-2zM3 9h12v6H3V9zm14 0h4v6h-4V9z"/></svg>
                  بدء الامتحان: {ex.title}
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}