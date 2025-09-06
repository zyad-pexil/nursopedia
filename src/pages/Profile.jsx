import { useEffect, useState } from 'react'
import Api from '../services/api.js'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card.jsx'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import { Skeleton } from '@/components/ui/skeleton.jsx'

// Use direct image path for Profile subject cards. No matching.
import logo from '../assets/LOGO.png'
const IMG_ASASIAT_TAMREED_AMALI = new URL('../assets/اساسيات تمريض عملي.jpg', import.meta.url).href
const IMG_ASASIAT_TAMREED_NAZARI = new URL('../assets/اساسيات تمريض نظري.png', import.meta.url).href
const IMG_TASHREEH = new URL('../assets/تشريح.png', import.meta.url).href
const IMG_MIKRO_BIOLOGY = new URL('../assets/ميكرو بيولوجي.jpg', import.meta.url).href
const IMG_WAZAEF_ALAADA = new URL('../assets/وضائف الاعظاء.jpg', import.meta.url).href
const IMG_KIMYA_HAYAWIA = new URL('../assets/كيمياء حيويه.jpg', import.meta.url).href
const IMG_NESA_W_TAWLEED_AMALI = new URL('../assets/النساء والتوليد عملي.jpg', import.meta.url).href
const IMG_NESA_W_TAWLEED_NAZARI = new URL('../assets/النساء والتوليد نظري.jpg', import.meta.url).href
const IMG_TIB_ALNISA_W_TAWLEED = new URL('../assets/طب النساء والتوليد.jpg', import.meta.url).href
const IMG_JARAHA_ATFAL = new URL('../assets/جراحه اطفال.jpg', import.meta.url).href
const IMG_TAMREED_ATFAL_AMALI = new URL('../assets/تمريض اطفال عملي.jpg', import.meta.url).href
const IMG_TAMREED_ATFAL_NAZARI = new URL('../assets/تمريض اطفال نظري.jpg', import.meta.url).href
const IMG_TIB_ATFAL = new URL('../assets/طب اطفال.jpg', import.meta.url).href
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
    .replace(/\s+/g, ' ')
    .trim()
}

function HeaderSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="h-24 w-full bg-gradient-to-l from-emerald-600/60 to-emerald-500/50" />
      <CardContent className="relative pt-0">
        <div className="-mt-10 flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full ring-4 ring-white dark:ring-gray-950" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-72" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Profile() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    let mounted = true
    async function load(){
      setLoading(true)
      setError('')
      try {
        const res = await Api.getProfile()
        if (res.success && mounted) {
          // inject manual images for known subjects by exact name
          const injected = { ...res.profile }
          if (Array.isArray(injected.subjects)) {
            injected.subjects = injected.subjects.map(s => {
              const name = normalizeName(s.name)
              if (name === normalizeName('أساسيات تمريض (عملي)')) return { ...s, image: IMG_ASASIAT_TAMREED_AMALI }
              if (name === normalizeName('أساسيات تمريض(نظري)')) return { ...s, image: IMG_ASASIAT_TAMREED_NAZARI }
              if (name === normalizeName('تشريح')) return { ...s, image: IMG_TASHREEH }
              if (name === normalizeName('ميكروبيولوجي')) return { ...s, image: IMG_MIKRO_BIOLOGY }
              if (name === normalizeName('وظائف الاعضاء')) return { ...s, image: IMG_WAZAEF_ALAADA }
              if (name === normalizeName('كيمياء حيوية')) return { ...s, image: IMG_KIMYA_HAYAWIA }
              if (name === normalizeName('النساء والتوليد عملي')) return { ...s, image: IMG_NESA_W_TAWLEED_AMALI }
              if (name === normalizeName('النساء والتوليد نظري')) return { ...s, image: IMG_NESA_W_TAWLEED_NAZARI }
              if (name === normalizeName('طب النساء والتوليد')) return { ...s, image: IMG_TIB_ALNISA_W_TAWLEED }
              if (name === normalizeName('جراحة اطفال') || name === normalizeName('جراحه اطفال')) return { ...s, image: IMG_JARAHA_ATFAL }
              if (name === normalizeName('تمريض اطفال عملي')) return { ...s, image: IMG_TAMREED_ATFAL_AMALI }
              if (name === normalizeName('تمريض اطفال نظري')) return { ...s, image: IMG_TAMREED_ATFAL_NAZARI }
              if (name === normalizeName('طب اطفال')) return { ...s, image: IMG_TIB_ATFAL }
              return s
            })
          }
          setProfile(injected)
        }
      } catch (e) {
        setError(e.message || 'تعذر تحميل البروفايل')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <HeaderSkeleton />
        <div className="grid md:grid-cols-12 gap-6">
          <div className="md:col-span-8 space-y-6">
            <Card><CardContent className="p-4 space-y-3"><Skeleton className="h-6 w-56"/><Skeleton className="h-40 w-full rounded-xl"/></CardContent></Card>
            <Card><CardContent className="p-4 grid sm:grid-cols-2 xl:grid-cols-3 gap-4">{Array.from({length:6}).map((_,i)=>(<Skeleton key={i} className="h-32 w-full rounded-xl" />))}</CardContent></Card>
          </div>
          <div className="md:col-span-4 space-y-6">
            <Card><CardContent className="p-4 space-y-3"><Skeleton className="h-5 w-40"/><Skeleton className="h-4 w-full"/><Skeleton className="h-4 w-2/3"/></CardContent></Card>
            <Card><CardContent className="p-4 grid grid-cols-3 gap-3">{Array.from({length:3}).map((_,i)=>(<Skeleton key={i} className="h-16 w-full" />))}<div className="col-span-3"><Skeleton className="h-2 w-full"/></div></CardContent></Card>
          </div>
        </div>
      </div>
    )
  }

  if (error) return <div className="p-6 text-red-600">{error}</div>
  if (!profile) return null

  const { basic, academic_year, subjects = [], stats = {}, per_subject = [] } = profile

  return (
    <div className="nurso-container nurso-section space-y-6">
      {/* Header with cover */}
      <Card className="overflow-hidden">
        <div className="relative h-32 w-full bg-gradient-to-l from-emerald-600 to-emerald-500">
          <div className="absolute inset-0 opacity-15 [background-image:radial-gradient(circle_at_20%_20%,white_2px,transparent_2px)] [background-size:24px_24px]" />
        </div>
        <CardContent className="relative pt-0">
          <div className="-mt-14 flex items-center gap-4">
            <Avatar className="h-24 w-24 ring-4 ring-white dark:ring-gray-950 rounded-2xl">
              <AvatarImage src={basic?.avatarUrl || ''} alt={basic?.full_name || 'user'} />
              <AvatarFallback className="font-bold bg-emerald-700 text-white">
                {basic?.full_name?.slice(0,2) || 'NU'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center flex-wrap gap-2">
                <h2 className="text-2xl font-extrabold tracking-tight truncate">{basic?.full_name}</h2>
                <Badge variant="secondary" className="text-xs">@{basic?.username}</Badge>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mt-1 truncate">
                {basic?.email} • {basic?.phone_number}
              </div>
              <div className="mt-2">
                <Badge className="bg-emerald-600 text-white">الفرقة: {academic_year}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-column professional layout */}
      <div className="grid md:grid-cols-12 gap-6">
        {/* Main column */}
        <div className="md:col-span-8 space-y-6">
          {/* Detailed per-subject reports FIRST */}
          <Card className="nurso-hover-lift">
            <CardHeader>
              <CardTitle>التقارير التفصيلية</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(per_subject || []).length > 0 ? (
                per_subject.map(ps => (
                  <div key={ps.subject.id} className="p-4 border rounded-xl bg-background/60">
                    <div className="border-l-4 border-emerald-600 pl-3 mb-2">
                      <div className="font-semibold truncate" title={ps.subject.name}>{ps.subject.name}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="p-2 rounded-md bg-muted/30">
                        <div className="text-xs text-gray-600 dark:text-gray-400">دروس مكتملة</div>
                        <div className="font-medium">{ps.lessons_completed}</div>
                      </div>
                      <div className="p-2 rounded-md bg-muted/30">
                        <div className="text-xs text-gray-600 dark:text-gray-400">امتحانات مجرّبة</div>
                        <div className="font-medium">{ps.exams_attempted}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-600 dark:text-gray-400">نسبة النجاح</span>
                          <Badge variant="secondary" className="text-[10px]">{ps.success_percentage}%</Badge>
                        </div>
                        <Progress value={Number(ps.success_percentage) || 0} />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-sm text-gray-600">لا توجد تقارير حتى الآن</div>
              )}
            </CardContent>
          </Card>

          {/* Subjects compact grid SECOND (reduced size) */}
          <Card className="nurso-hover-lift">
            <CardHeader>
              <CardTitle>المواد المشترك بها</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {(subjects || []).length > 0 ? (
                subjects.map(s => (
                  <div key={s.id} className="border rounded-lg overflow-hidden hover:shadow-sm transition bg-muted/10">
                    <div className="w-full aspect-[4/3] bg-gray-100 dark:bg-gray-800">
                      <img
                        src={getSubjectImage(s)}
                        alt={`صورة مادة ${s.name}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => { e.currentTarget.src = logo }}
                      />
                    </div>
                    <div className="p-2 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium text-sm truncate" title={s.name}>{s.name}</div>
                        <Badge variant="outline" className="text-[10px] whitespace-nowrap">{s.price} جنيه</Badge>
                      </div>
                      <div className="text-[11px] text-gray-600 dark:text-gray-400">
                        تاريخ الاشتراك: {s.subscription_date ? new Date(s.subscription_date).toLocaleDateString() : '—'}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-sm text-gray-600">لا توجد مواد حتى الآن</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="md:col-span-4 space-y-6">
          <Card className="nurso-hover-lift">
            <CardHeader><CardTitle>معلومات سريعة</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">البريد الإلكتروني</span>
                <span className="font-medium truncate max-w-[55%] text-right">{basic?.email || '-'}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">رقم الهاتف</span>
                <span className="font-medium">{basic?.phone_number || '-'}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">الفرقة</span>
                <Badge className="bg-emerald-600 text-white">{academic_year}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="nurso-hover-lift">
            <CardHeader><CardTitle>إحصائيات</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg border bg-muted/30 text-center">
                  <div className="text-xs text-gray-600 dark:text-gray-300">امتحانات</div>
                  <div className="text-2xl font-bold">{stats?.exams_taken ?? 0}</div>
                </div>
                <div className="p-3 rounded-lg border bg-muted/30 text-center">
                  <div className="text-xs text-gray-600 dark:text-gray-300">النجاح</div>
                  <div className="text-2xl font-bold">{stats?.overall_success_percentage ?? 0}%</div>
                </div>
                <div className="p-3 rounded-lg border bg-muted/30 text-center">
                  <div className="text-xs text-gray-600 dark:text-gray-300">آخر نتيجة</div>
                  <div className="text-2xl font-bold">{stats?.last_result ? stats.last_result.score : '—'}</div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-400">نسبة النجاح الكلية</span>
                  <span className="font-medium">{stats?.overall_success_percentage ?? 0}%</span>
                </div>
                <Progress value={Number(stats?.overall_success_percentage) || 0} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}