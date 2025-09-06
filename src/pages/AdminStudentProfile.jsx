import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Api from '@/services/api.js'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Button } from '@/components/ui/button.jsx'

export default function AdminStudentProfile(){
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)

  useEffect(() => {
    let mounted = true
    async function load(){
      setLoading(true)
      setError('')
      try {
        const res = await Api.getAdminUserProfile(id)
        if (mounted) setData(res.profile || res)
      } catch (e) {
        if (mounted) setError(e.message || 'تعذر تحميل بيانات الطالب')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [id])

  if (loading) return (<div className="nurso-container nurso-section">جاري التحميل...</div>)
  if (error) return (<div className="nurso-container nurso-section text-red-600">{error}</div>)
  if (!data) return null

  const { basic={}, stats={}, subjects=[] } = data

  return (
    <div className="nurso-container nurso-section space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">ملف الطالب</h1>
        <Button variant="outline" onClick={()=>navigate(-1)}>رجوع</Button>
      </div>

      <Card className="nurso-hover-lift">
        <CardHeader><CardTitle>البيانات الأساسية</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div><span className="text-gray-600">الاسم:</span> <span className="font-medium">{basic.full_name || '-'}</span></div>
          <div><span className="text-gray-600">اسم المستخدم:</span> <Badge variant="secondary">@{basic.username}</Badge></div>
          <div><span className="text-gray-600">البريد:</span> <span className="font-medium">{basic.email || '-'}</span></div>
          <div><span className="text-gray-600">الهاتف:</span> <span className="font-medium">{basic.phone_number || '-'}</span></div>
          <div><span className="text-gray-600">الفرقة:</span> <Badge className="bg-emerald-600 text-white">{basic.academic_year || '-'}</Badge></div>
          <div><span className="text-gray-600">الحالة:</span> <span className="font-medium">{basic.status || '-'}</span></div>
        </CardContent>
      </Card>

      <Card className="nurso-hover-lift">
        <CardHeader><CardTitle>المواد المشترك بها</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(subjects||[]).map(s => (
            <div key={s.id} className="p-3 border rounded-lg">
              <div className="font-medium mb-1 truncate" title={s.name}>{s.name}</div>
              <div className="text-xs text-gray-600 mb-2">تاريخ الاشتراك: {s.subscription_date ? new Date(s.subscription_date).toLocaleDateString() : '—'}</div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>نسبة التقدم</span>
                  <span>{Number(s.progress_percentage||0)}%</span>
                </div>
                <Progress value={Number(s.progress_percentage||0)} />
              </div>
            </div>
          ))}
          {(subjects||[]).length === 0 && (
            <div className="text-sm text-gray-600">لا توجد مواد</div>
          )}
        </CardContent>
      </Card>

      <Card className="nurso-hover-lift">
        <CardHeader><CardTitle>إحصائيات</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-lg border bg-muted/30">
            <div className="text-xs text-gray-600">امتحانات</div>
            <div className="text-2xl font-bold">{stats.exams_taken ?? 0}</div>
          </div>
          <div className="p-3 rounded-lg border bg-muted/30">
            <div className="text-xs text-gray-600">نسبة النجاح</div>
            <div className="text-2xl font-bold">{stats.overall_success_percentage ?? 0}%</div>
          </div>
          <div className="p-3 rounded-lg border bg-muted/30">
            <div className="text-xs text-gray-600">دروس مكتملة</div>
            <div className="text-2xl font-bold">{stats.completed_lessons ?? 0}</div>
          </div>
          <div className="p-3 rounded-lg border bg-muted/30">
            <div className="text-xs text-gray-600">آخر نشاط</div>
            <div className="text-sm font-medium">{stats.last_activity ? new Date(stats.last_activity).toLocaleString('ar-EG') : '—'}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


