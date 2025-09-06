import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import Api from '../services/api.js'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button.jsx'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState(null)

  useEffect(() => {
    let mounted = true
    async function load(){
      setLoading(true)
      setError('')
      try {
        const res = await Api.getAdminStats()
        if (res.success && mounted) setStats(res)
      } catch (e) {
        setError(e.message || 'تعذر تحميل الإحصائيات')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

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
  if (!stats) return null

  const s = stats.stats || {}

  return (
    <div className="nurso-container nurso-section space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">لوحة التحكم الإدارية</h1>
          <p className="text-sm text-muted-foreground mt-1">نظرة عامة سريعة على أهم المؤشرات مع اختصارات لإدارة النظام</p>
        </div>
        <div className="shrink-0 flex gap-2">
          <Link to="/admin/manage#requests"><Button variant="outline">مراجعة الطلبات</Button></Link>
          <Link to="/admin/manage"><Button>إدارة المحتوى</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="nurso-hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">👥</span>
              <span>الطلاب</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold">{s.total_students ?? 0}</div>
            <div className="text-sm text-muted-foreground">نشطون: {s.active_students ?? 0}</div>
          </CardContent>
        </Card>

        <Card className="nurso-hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700">📚</span>
              <span>المحتوى</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">مواد</div>
              <div className="text-xl font-semibold">{s.total_subjects ?? 0}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">دروس</div>
              <div className="text-xl font-semibold">{s.total_lessons ?? 0}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">امتحانات</div>
              <div className="text-xl font-semibold">{s.total_exams ?? 0}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="nurso-hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700">💰</span>
              <span>الإيرادات</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{s.total_revenue ?? 0} <span className="text-base font-normal">جنيه</span></div>
          </CardContent>
        </Card>

        <Card className="nurso-hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-700">📝</span>
              <span>طلبات قيد المراجعة</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{s.pending_requests ?? '—'}</div>
              <Link to="/admin/manage#requests"><Button size="sm" variant="outline">استعراض</Button></Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}