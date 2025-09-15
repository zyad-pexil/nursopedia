import { useEffect, useMemo, useState } from 'react'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import Api from '../services/api.js'
import { Link } from 'react-router-dom'
import logo from '../assets/LOGO.webp'
import { Button } from '@/components/ui/button.jsx'
import { BookOpen, TrendingUp, Layers, Search, ArrowRightCircle } from 'lucide-react'

// Manual image paths for specific subjects
const IMG_ASASIAT_TAMREED_AMALI = new URL('../assets/اساسيات تمريض عملي.webp', import.meta.url).href
const IMG_ASASIAT_TAMREED_NAZARI = new URL('../assets/اساسيات تمريض نظري.webp', import.meta.url).href
const IMG_TASHREEH = new URL('../assets/تشريح.webp', import.meta.url).href
const IMG_MIKRO_BIOLOGY = new URL('../assets/ميكرو بيولوجي.webp', import.meta.url).href
const IMG_WAZAEF_ALAADA = new URL('../assets/وضائف الاعظاء.webp', import.meta.url).href
const IMG_KIMYA_HAYAWIA = new URL('../assets/كيمياء حيويه.webp', import.meta.url).href
const IMG_NESA_W_TAWLEED_AMALI = new URL('../assets/النساء والتوليد عملي.webp', import.meta.url).href
const IMG_NESA_W_TAWLEED_NAZARI = new URL('../assets/النساء والتوليد نظري.webp', import.meta.url).href
const IMG_TIB_ALNISA_W_TAWLEED = new URL('../assets/طب النساء والتوليد.webp', import.meta.url).href
const IMG_JARAHA_ATFAL = new URL('../assets/جراحه اطفال.webp', import.meta.url).href
const IMG_TAMREED_ATFAL_AMALI = new URL('../assets/تمريض اطفال عملي.webp', import.meta.url).href
const IMG_TAMREED_ATFAL_NAZARI = new URL('../assets/تمريض اطفال نظري.webp', import.meta.url).href
const IMG_TIB_ATFAL = new URL('../assets/طب اطفال.webp', import.meta.url).href

// Use direct image path provided by API/data. No name matching.
function getSubjectImage(subject){
  // Prefer manually injected image first, then API-provided
  return subject?.image || subject?.image_url || subject?.imagePath || logo
}

// Normalize Arabic names: remove NBSP, Tatweel, diacritics, collapse spaces
function normalizeName(str){
  if (!str) return ''
  return `${str}`
    .replace(/\u00A0/g, ' ')
    .replace(/\u0640/g, '')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[\u0622\u0623\u0625]/g, '\u0627') // normalize Alif variants to Alif
    .replace(/\u0629/g, '\u0647') // Ta marbuta to Ha for lenient matching
    .replace(/\s+/g, ' ')
    .trim()
}


export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [subjects, setSubjects] = useState([])
  const [search, setSearch] = useState('')
  const [progressBySubject, setProgressBySubject] = useState({})

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const res = await Api.getUserSubjects()
        if (res.success) {
          const list = (res.subjects || []).map(s => {
            const name = normalizeName(s.name)
            // Assign manual images for specific subjects by normalized name
            if (name === normalizeName('أساسيات تمريض (عملي)')) {
              return { ...s, image: IMG_ASASIAT_TAMREED_AMALI }
            }
            if (name === normalizeName('أساسيات تمريض(نظري)')) {
              return { ...s, image: IMG_ASASIAT_TAMREED_NAZARI }
            }
            if (name === normalizeName('تشريح')) {
              return { ...s, image: IMG_TASHREEH }
            }
            if (name === normalizeName('ميكروبيولوجي')) {
              return { ...s, image: IMG_MIKRO_BIOLOGY }
            }
            if (name === normalizeName('وظائف الاعضاء')) {
              return { ...s, image: IMG_WAZAEF_ALAADA }
            }
            if (name === normalizeName('كيمياء حيوية')) {
              return { ...s, image: IMG_KIMYA_HAYAWIA }
            }
            if (name === normalizeName('النساء والتوليد عملي')) {
              return { ...s, image: IMG_NESA_W_TAWLEED_AMALI }
            }
            if (name === normalizeName('النساء والتوليد نظري')) {
              return { ...s, image: IMG_NESA_W_TAWLEED_NAZARI }
            }
            if (name === normalizeName('طب النساء والتوليد')) {
              return { ...s, image: IMG_TIB_ALNISA_W_TAWLEED }
            }
            if (name === normalizeName('جراحة اطفال') || name === normalizeName('جراحه اطفال')) {
              return { ...s, image: IMG_JARAHA_ATFAL }
            }
            if (name === normalizeName('تمريض اطفال عملي')) {
              return { ...s, image: IMG_TAMREED_ATFAL_AMALI }
            }
            if (name === normalizeName('تمريض اطفال نظري')) {
              return { ...s, image: IMG_TAMREED_ATFAL_NAZARI }
            }
            if (name === normalizeName('طب اطفال')) {
              return { ...s, image: IMG_TIB_ATFAL }
            }
            return s
          })
          if (mounted) setSubjects(list)
          // calculate progress per subject by fetching lessons and counting completed
          const progressEntries = {}
          for (const s of list) {
            try {
              const lr = await Api.getSubjectLessons(s.id)
              if (lr.success) {
                const lessons = lr.lessons || []
                const completed = lessons.filter(l => l.progress?.completed).length
                const pct = lessons.length ? Math.round((completed / lessons.length) * 100) : 0
                progressEntries[s.id] = pct
              }
            } catch {}
          }
          if (mounted) setProgressBySubject(progressEntries)
        }
      } catch (e) {
        setError(e.message || 'حدث خطأ في تحميل المواد')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? subjects.filter(s => `${s.name}`.toLowerCase().includes(q)) : subjects
  }, [search, subjects])

  if (loading) return (
    <div className="min-h-[60vh] nurso-section flex flex-col items-center justify-center gap-4">
      <div className="flex items-center gap-3 text-2xl font-bold text-gray-800 dark:text-white">
        <TrendingUp className="w-6 h-6 text-primary" />
        <span>جاري تحميل لوحتك</span>
      </div>
      <div className="w-full max-w-md h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full w-1/3 bg-primary animate-[loading_1.2s_ease-in-out_infinite]" style={{
          maskImage: 'linear-gradient(to right, transparent, black 20%, black 80%, transparent)'
        }} />
      </div>
      <style>{`@keyframes loading { 0%{transform:translateX(-100%)} 50%{transform:translateX(20%)} 100%{transform:translateX(100%)} }`}</style>
    </div>
  )
  if (error) return <div className="p-6 text-red-600">{error}</div>

  return (
    <div className="nurso-container nurso-section space-y-8 px-4 sm:px-6 md:px-0">
      {/* هيدر ترحيبي صغير */}
      <section className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">مرحبًا بك في لوحتك 👋</h1>
        <p className="text-gray-600 dark:text-gray-300">تابع تقدمك وابدأ من حيث توقفت.</p>
      </section>

      {/* شريط أدوات */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input className="pr-9" placeholder="ابحث عن مادة..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button variant="outline" className="hidden md:inline-flex">
          <Layers className="w-4 h-4" />
          تصفية
        </Button>
      </div>

      {/* شبكة المواد */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 nurso-stagger">
        {filtered.map(s => (
          <Card key={s.id} className="hover:shadow-md transition overflow-hidden nurso-hover-lift group">
            <div className="w-full aspect-[16/9] bg-gray-100 dark:bg-gray-800 overflow-hidden relative">
              <img
                src={getSubjectImage(s)}
                alt={s.name}
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                loading="lazy"
                onError={(e) => { e.currentTarget.src = logo }}
              />
              {/* شارة نسبة التقدم على الصورة */}
              <div className="absolute top-2 left-2 text-[11px] px-2 py-1 rounded-full bg-black/60 text-white backdrop-blur">
                {progressBySubject[s.id] ?? 0}% مكتمل
              </div>
            </div>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <span className="truncate" title={s.name}>{s.name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs text-gray-500 dark:text-gray-400">اشتركت بتاريخ: {new Date(s.subscription_date).toLocaleDateString()}</div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>نسبة التقدم</span>
                  <span>{progressBySubject[s.id] ?? 0}%</span>
                </div>
                <Progress value={progressBySubject[s.id] ?? 0} />
              </div>
              <div className="pt-2">
                <Button asChild className="w-full">
                  <Link to={{ pathname: `/subject/${s.id}` }} state={{ name: s.name }}>
                    ابدأ التعلم الآن
                    <ArrowRightCircle className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* حالة عدم وجود نتائج */}
      {filtered.length === 0 && (
        <div className="text-center text-gray-500 dark:text-gray-400 py-10">لا توجد مواد مطابقة لبحثك.</div>
      )}
    </div>
  )
}