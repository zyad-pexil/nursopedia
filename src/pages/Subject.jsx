import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import Api from '../services/api.js'

export default function SubjectPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { state } = useLocation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lessons, setLessons] = useState([])
  const [sortBy, setSortBy] = useState('default') // default | incomplete | recent | title

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const res = await Api.getSubjectLessons(id)
        if (res.success && mounted) setLessons(res.lessons || [])
      } catch (e) {
        setError(e.message || 'تعذر تحميل الدروس')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [id])

  const subjectName = state?.name || 'المادة'
  const total = lessons.length
  const completed = lessons.filter(l => l.progress?.completed).length
  const progressPct = total ? Math.round((completed / total) * 100) : 0

  function formatDuration(sec){
    if (!sec && sec !== 0) return '-'
    const s = Math.max(0, Number(sec))
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const r = s % 60
    return h ? `${h}س ${m}د` : `${m}د ${r}ث`
  }
  function formatDate(d){
    if (!d) return ''
    try { return new Date(d).toLocaleString('ar-EG') } catch { return '' }
  }

  const sortedLessons = [...lessons].sort((a,b) => {
    if (sortBy === 'incomplete') {
      const av = a.progress?.completed ? 1 : 0
      const bv = b.progress?.completed ? 1 : 0
      if (av !== bv) return av - bv
    }
    if (sortBy === 'recent') {
      const ad = a.progress?.last_watched ? new Date(a.progress.last_watched).getTime() : 0
      const bd = b.progress?.last_watched ? new Date(b.progress.last_watched).getTime() : 0
      return bd - ad
    }
    if (sortBy === 'title') {
      return String(a.title).localeCompare(String(b.title), 'ar')
    }
    // default by lesson_order if present, else stable
    return (a.lesson_order ?? 0) - (b.lesson_order ?? 0)
  })

  const nextLesson = sortedLessons.find(l => !l.progress?.completed) || sortedLessons[0]

  return (
    <div className="p-0 md:p-0 nurso-section">
      <div className="nurso-container space-y-6">
        {/* Hero header */}
        <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-emerald-600 to-emerald-700 text-white nurso-hover-lift">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{subjectName}</h1>
                <p className="text-white/90 text-sm mt-1">الدروس المتاحة وتقدمك بالمادة</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <div className="text-3xl font-black">{progressPct}%</div>
                  <div className="text-xs text-white/80">نسبة التقدم</div>
                </div>
                <div className="h-10 w-px bg-white/20" />
                <div className="text-center">
                  <div className="text-lg font-bold">{completed} / {total}</div>
                  <div className="text-xs text-white/80">دروس مكتملة</div>
                </div>
              </div>
            </div>

            {nextLesson && (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Button onClick={() => navigate(`/lesson/${nextLesson.id}`)} className="bg-white text-emerald-700 hover:bg-white/90">
                  {nextLesson.progress?.completed ? 'عرض الدرس الأول' : 'متابعة الدرس التالي'}
                </Button>
                {nextLesson.progress?.last_watched && (
                  <span className="text-xs text-white/80">آخر متابعة: {formatDate(nextLesson.progress.last_watched)}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">ترتيب الدروس</div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="border rounded-md px-3 py-2 text-sm bg-background">
            <option value="default">الافتراضي</option>
            <option value="incomplete">غير المكتملة أولاً</option>
            <option value="recent">الأحدث متابعة</option>
            <option value="title">حسب العنوان</option>
          </select>
        </div>

        {/* Lessons list */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 nurso-stagger">
          {sortedLessons.map(l => {
            const unread = !l.progress?.completed
            const attCount = Array.isArray(l.attachments) ? l.attachments.length : 0
            return (
              <div key={l.id} className={[
                'group relative overflow-hidden rounded-xl border bg-white dark:bg-gray-900 ring-1 ring-black/5 hover:shadow-xl transition nurso-hover-lift',
                unread ? 'border-emerald-200/60' : 'border-gray-200/60'
              ].join(' ')}>
                <div className="p-4 space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 h-10 w-10 grid place-items-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40">
                      {/* book icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M4 4h13a3 3 0 013 3v12a1 1 0 01-1 1H7a3 3 0 01-3-3V4z"/></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold truncate">{l.title}</h3>
                        <span className={[
                          'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full',
                          l.progress?.completed ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30'
                        ].join(' ')}>
                          {l.progress?.completed ? 'مكتمل' : 'قيد المتابعة'}
                        </span>
                      </div>
                      {l.description && <p className="text-sm text-muted-foreground line-clamp-2">{l.description}</p>}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          {/* clock */}
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 11H7v-2h4V6h2v7z"/></svg>
                          {formatDuration(l.video_duration)}
                        </span>
                        {attCount > 0 && (
                          <span className="inline-flex items-center gap-1">
                            {/* paperclip */}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M16.5 6.5l-7.8 7.8a3 3 0 104.2 4.2l8-8a5 5 0 10-7.1-7.1l-8.8 8.8"/></svg>
                            {attCount} مرفق
                          </span>
                        )}
                        {l.progress?.last_watched && (
                          <span className="inline-flex items-center gap-1">
                            {/* activity */}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M13 3l-2 6h5l-4 12 2-8H9l4-10z"/></svg>
                            آخر متابعة: {formatDate(l.progress.last_watched)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button variant="secondary" onClick={() => navigate(`/lesson/${l.id}`)} className="border-emerald-600 text-emerald-700 hover:bg-emerald-50">
                      {l.progress?.completed ? 'عرض' : 'متابعة'}
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}

          {(!lessons || lessons.length === 0) && !loading && (
            <Card className="md:col-span-2">
              <CardContent className="py-10 text-center text-muted-foreground">لا توجد دروس متاحة</CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}