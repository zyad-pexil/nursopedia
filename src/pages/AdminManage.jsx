import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Api, { resolveFileUrl } from '@/services/api.js'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx'
import { toast } from 'sonner'

export default function AdminManage(){
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [processing, setProcessing] = useState({})
  const [sectionOpen, setSectionOpen] = useState(()=>{
    try {
      const saved = localStorage.getItem('adminManage.sectionOpen')
      const defaults = { lessons: true, exams: true, questions: true, subjectExams: true }
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults
    } catch (e) { return { lessons: true, exams: true, questions: true, subjectExams: true } }
  })

  useEffect(()=>{
    try { localStorage.setItem('adminManage.sectionOpen', JSON.stringify(sectionOpen)) } catch (e) {}
  }, [sectionOpen])

  // Requests
  const [requests, setRequests] = useState([])
  const [reqFilter, setReqFilter] = useState({ status: 'pending', search: '' })
  // Additional Subject Requests
  const [addRequests, setAddRequests] = useState([])
  const [addReqFilter, setAddReqFilter] = useState({ status: 'pending' })

  // Subjects/Lessons/Exams tree
  const [subjects, setSubjects] = useState([])
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [lessons, setLessons] = useState([])
  const [selectedLesson, setSelectedLesson] = useState(null)
  const [exams, setExams] = useState([])
  const [subjectExams, setSubjectExams] = useState([])
  const [selectedExam, setSelectedExam] = useState(null)
  const [questions, setQuestions] = useState([])

  // Forms
  const [subjectForm, setSubjectForm] = useState({ name: '', description: '', academic_year_id: '', price: '' })
  const [lessonForm, setLessonForm] = useState({ subject_id: '', title: '', description: '', video_url: '', lesson_order: 1, is_active: true })
  const [examForm, setExamForm] = useState({ subject_id: '', lesson_id: '', title: '', description: '', duration_minutes: 30, passing_score: 60, show_results_immediately: true, is_active: true })
  const [questionForm, setQuestionForm] = useState({ exam_id: '', question_text: '', question_type: 'multiple_choice', order: 1, is_active: true, answers: [] })
  const [answerForm, setAnswerForm] = useState({ question_id: '', answer_text: '', is_correct: false, order: 1, is_active: true })
  const [attachDrafts, setAttachDrafts] = useState({}) // { [lessonId]: { name:'', url:'' } }

  useEffect(() => { loadRequests(); loadAddRequests(); loadSubjects(); }, [])

  async function loadRequests(filter = reqFilter){
    try {
      const res = await Api.getSubscriptionRequests(filter)
      if (res.success) setRequests(res.requests || [])
    } catch(e){ setMessage(e.message) }
  }
  async function loadAddRequests(filter = addReqFilter){
    try {
      const res = await Api.getAdditionalSubjectRequests(filter)
      if (res.success) setAddRequests(res.requests || [])
    } catch(e){ setMessage(e.message); toast.error(e?.message || 'تعذر تحميل طلبات إضافة المواد') }
  }
  async function loadSubjects(){
    try {
      const res = await Api.getAdminSubjects()
      if (res.success) {
        const list = res.subjects || []
        setSubjects(list)
        if (!selectedSubject && list.length > 0) {
          const firstId = list[0].id
          setSelectedSubject(firstId)
          setLessonForm(f => ({ ...f, subject_id: firstId }))
          await loadLessons(firstId)
          await loadSubjectExams(firstId)
        }
      }
    } catch(e){ setMessage(e.message) }
  }
  async function loadLessons(subjId){
    try {
      const res = await Api.getLessons(subjId)
      if (res.success) setLessons(res.lessons || [])
    } catch(e){ setMessage(e.message) }
  }
  async function loadSubjectExams(subjId){
    try {
      const res = await Api.getSubjectLevelExams(subjId)
      if (res.success) setSubjectExams(res.exams || [])
    } catch(e){ setMessage(e.message) }
  }
  async function loadExams(lessonId){
    try {
      const res = await Api.getExams(lessonId)
      if (res.success) setExams(res.exams || [])
    } catch(e){ setMessage(e.message) }
  }
  async function loadQuestions(examId){
    try {
      const res = await Api.getQuestions(examId)
      if (res.success) setQuestions(res.questions || [])
    } catch(e){ setMessage(e.message) }
  }

  // Requests actions
  async function approve(id){
    setProcessing(p=>({...p,[id]:true}))
    setMessage('')
    try { await Api.approveRequest(id); await loadRequests() }
    catch(e){ setMessage(e.message || 'فشل القبول') }
    finally { setProcessing(p=>({...p,[id]:false})) }
  }
  async function reject(id){
    setProcessing(p=>({...p,[id]:true}))
    setMessage('')
    try { await Api.rejectRequest(id); await loadRequests() }
    catch(e){ setMessage(e.message || 'فشل الرفض') }
    finally { setProcessing(p=>({...p,[id]:false})) }
  }

  // Subject actions
  async function createSubject(){
    setLoading(true)
    try {
      const payload = { ...subjectForm, price: Number(subjectForm.price || 0) }
      const res = await Api.createSubject(payload)
      if (res.success){ setSubjectForm({ name:'', description:'', academic_year_id:'', price:'' }); await loadSubjects() }
    } finally { setLoading(false) }
  }

  // Lesson actions
  async function createLesson(){
    setLoading(true)
    try {
      const payload = { ...lessonForm, lesson_order: Number(lessonForm.lesson_order || 1), subject_id: Number(lessonForm.subject_id) }
      const res = await Api.createLesson(payload)
      if (res.success && payload.subject_id){ setLessonForm({ subject_id: payload.subject_id, title:'', description:'', video_url:'', lesson_order: 1, is_active: true }); await loadLessons(payload.subject_id) }
    } finally { setLoading(false) }
  }
  async function updateLesson(l){
    setLoading(true)
    setMessage('')
    try {
      const payload = { title:l.title, description:l.description, video_url:l.video_url, lesson_order:Number(l.lesson_order||1), is_active:!!l.is_active }
      if (Array.isArray(l.attachments)) payload.attachments = l.attachments
      const res = await Api.updateLesson(l.id, payload)
      if (res?.success) await loadLessons(l.subject_id)
    } catch (e) {
      setMessage(e.message || 'فشل الحفظ')
    } finally {
      setLoading(false)
    }
  }
  async function deleteLesson(l){
    setLoading(true)
    setMessage('')
    try {
      const res = await Api.deleteLesson(l.id)
      if (res?.success) await loadLessons(l.subject_id)
    } catch (e) {
      setMessage(e.message || 'فشل الحذف')
    } finally {
      setLoading(false)
    }
  }

  // Exam actions
  async function createExam(){
    setLoading(true)
    try {
      const payload = {
        ...examForm,
        duration_minutes: Number(examForm.duration_minutes || 30),
        passing_score: Number(examForm.passing_score || 60),
        subject_id: examForm.subject_id ? Number(examForm.subject_id) : undefined,
        lesson_id: examForm.lesson_id ? Number(examForm.lesson_id) : undefined,
      }
      const res = await Api.createExam(payload)
      if (res.success){
        // Reset form keeping current context
        setExamForm({ subject_id: payload.subject_id || '', lesson_id: payload.lesson_id || '', title:'', description:'', duration_minutes:30, passing_score:60, show_results_immediately:true, is_active:true })
        if (payload.lesson_id) await loadExams(payload.lesson_id)
      }
    } finally { setLoading(false) }
  }

  async function quickCreateExam(lessonId){
    setExamForm({ lesson_id: lessonId, title: 'امتحان الدرس', description: '', duration_minutes: 30, passing_score: 60, show_results_immediately: true, is_active: true })
    await createExam()
  }
  async function updateExam(e){
    setLoading(true)
    setMessage('')
    try {
      const payload = {
        title: e.title,
        description: e.description,
        duration_minutes: Number(e.duration_minutes || 0),
        max_attempts: e.max_attempts != null ? Number(e.max_attempts) : undefined,
        passing_score: Number(e.passing_score || 0),
        show_results_immediately: !!e.show_results_immediately,
        is_active: !!e.is_active,
      }
      const res = await Api.updateExam(e.id, payload)
      if (res?.success) await loadExams(e.lesson_id)
    } catch (err) {
      setMessage(err.message || 'فشل الحفظ')
    } finally {
      setLoading(false)
    }
  }
  async function deleteExam(e){
    setLoading(true)
    setMessage('')
    try {
      const res = await Api.deleteExam(e.id)
      if (res?.success) await loadExams(e.lesson_id)
    } catch (err) {
      setMessage(err.message || 'فشل الحذف')
    } finally {
      setLoading(false)
    }
  }

  // Question/Answer actions
  async function createQuestion(){
    setLoading(true)
    try {
      const payload = { ...questionForm, order: Number(questionForm.order || 1), exam_id: Number(questionForm.exam_id) }
      const res = await Api.createQuestion(payload)
      if (res.success && payload.exam_id){ setQuestionForm({ exam_id: payload.exam_id, question_text:'', question_type:'multiple_choice', order:1, is_active:true, answers: [] }); await loadQuestions(payload.exam_id) }
    } finally { setLoading(false) }
  }
  async function updateQuestion(q){
    setLoading(true)
    setMessage('')
    try {
      const res = await Api.updateQuestion(q.id, { question_text:q.question_text, question_type:q.question_type, order:q.order, is_active:q.is_active })
      if (res?.success) await loadQuestions(q.exam_id)
    } catch (err) {
      setMessage(err.message || 'فشل الحفظ')
    } finally {
      setLoading(false)
    }
  }
  async function deleteQuestion(q){
    setLoading(true)
    setMessage('')
    try {
      const res = await Api.deleteQuestion(q.id)
      if (res?.success) await loadQuestions(q.exam_id)
    } catch (err) {
      setMessage(err.message || 'فشل الحذف')
    } finally {
      setLoading(false)
    }
  }

  async function createAnswer(){
    setLoading(true)
    try {
      const payload = { ...answerForm, order: Number(answerForm.order || 1), question_id: Number(answerForm.question_id) }
      const res = await Api.createAnswer(payload)
      if (res.success && payload.question_id){ setAnswerForm({ question_id: payload.question_id, answer_text:'', is_correct:false, order:1, is_active:true }); const q = questions.find(qq => qq.id === payload.question_id); if (q) await loadQuestions(q.exam_id) }
    } finally { setLoading(false) }
  }

  const selectedSubjectObj = useMemo(() => subjects.find(s => s.id === Number(selectedSubject)) || null, [subjects, selectedSubject])

  // افتح تبويب معين عبر الهاش (#requests أو #content)
  const defaultTab = (typeof window !== 'undefined' && window.location.hash === '#requests') ? 'requests' : 'content'

  return (
    <div className="nurso-container nurso-section space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">إدارة المحتوى والطلبات</h1>
        <Link to="/admin"><Button variant="outline">رجوع إلى لوحة الأدمن</Button></Link>
      </div>
      {message ? <div className="text-red-600">{message}</div> : null}
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="mb-4 bg-white/70 dark:bg-gray-900/70 border border-black/10 dark:border-white/10 rounded-xl p-1 shadow-sm backdrop-blur">
          <TabsTrigger value="requests">طلبات الاشتراك</TabsTrigger>
          <TabsTrigger value="add">طلبات إضافة مادة</TabsTrigger>
          <TabsTrigger value="content">إدارة المحتوى</TabsTrigger>
        </TabsList>

        {/* Additional Subject Requests */}
        <TabsContent value="add" className="space-y-4">
          <Card className="nurso-hover-lift border-0 ring-1 ring-black/5 dark:ring-white/10 bg-white/70 dark:bg-gray-900/70 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-emerald-600"><path d="M12 4v16m8-8H4"/></svg>
                <span>طلبات إضافة مادة</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <Label>الحالة</Label>
                <select className="border rounded-lg p-2 bg-white/70 dark:bg-gray-900/60 border-black/10 dark:border-white/10 backdrop-blur" value={addReqFilter.status} onChange={async (e)=>{ const nf = { status: e.target.value }; setAddReqFilter(nf); await loadAddRequests(nf); }}>
                  <option value="pending">قيد المراجعة</option>
                  <option value="approved">مقبول</option>
                  <option value="rejected">مرفوض</option>
                  <option value="all">الكل</option>
                </select>
              </div>
              <div className="overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">المعرف</TableHead>
                      <TableHead className="min-w-48">الطالب</TableHead>
                      <TableHead className="min-w-32">المادة</TableHead>
                      <TableHead className="min-w-24">الإيصال</TableHead>
                      <TableHead className="min-w-24">المجموع</TableHead>
                      <TableHead className="min-w-24">الحالة</TableHead>
                      <TableHead className="min-w-32">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {addRequests.map(r => (
                      <TableRow key={r.id} className="hover:bg-muted/40">
                        <TableCell>{r.id}</TableCell>
                        <TableCell>{r?.student?.name} <span className="text-xs text-gray-500">@{r?.student?.username}</span></TableCell>
                        <TableCell>{r?.subject?.name || '-'}</TableCell>
                        <TableCell>
                          {r.receipt_url ? (<a href={r.receipt_url} target="_blank" rel="noreferrer" className="text-emerald-700 hover:underline">عرض الإيصال</a>) : '—'}
                        </TableCell>
                        <TableCell>
                          {Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(Number(r?.subject?.price || 0))}
                        </TableCell>
                        <TableCell>
                          <Badge variant={r.status === 'pending' ? 'secondary' : (r.status === 'approved' ? 'default' : 'destructive')}>{r.status}</Badge>
                        </TableCell>
                        <TableCell className="space-x-2 space-y-1">
                          {r.status === 'pending' ? (
                            <>
                              <Button size="sm" variant="default" disabled={!!processing[`add_${r.id}`]} onClick={async ()=>{
                                setProcessing(p=>({...p,[`add_${r.id}`]:true}))
                                try{
                                  await Api.approveAdditionalSubjectRequest(r.id)
                                  toast.success('تم قبول الطلب')
                                  await loadAddRequests(addReqFilter)
                                } catch(e){
                                  toast.error(e?.message || 'فشل القبول')
                                } finally {
                                  setProcessing(p=>({...p,[`add_${r.id}`]:false}))
                                }
                              }}>قبول</Button>
                              <Button size="sm" variant="destructive" disabled={!!processing[`add_${r.id}`]} onClick={async ()=>{
                                setProcessing(p=>({...p,[`add_${r.id}`]:true}))
                                try{
                                  await Api.rejectAdditionalSubjectRequest(r.id)
                                  toast.success('تم رفض الطلب')
                                  await loadAddRequests(addReqFilter)
                                } catch(e){
                                  toast.error(e?.message || 'فشل الرفض')
                                } finally {
                                  setProcessing(p=>({...p,[`add_${r.id}`]:false}))
                                }
                              }}>رفض</Button>
                            </>
                          ) : (
                            <span className="text-xs text-gray-500">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card className="nurso-hover-lift border-0 ring-1 ring-black/5 dark:ring-white/10 bg-white/70 dark:bg-gray-900/70 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-emerald-600"><path d="M4 4h16v2H4V4zm0 14h16v2H4v-2zM4 9h10v6H4V9zm12 0h4v6h-4V9z"/></svg>
                <span>طلبات الاشتراك</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <Label>الحالة</Label>
                  <select className="border rounded-lg p-2 bg-white/70 dark:bg-gray-900/60 border-black/10 dark:border-white/10 backdrop-blur" value={reqFilter.status} onChange={async (e)=>{ const nf = { ...reqFilter, status: e.target.value }; setReqFilter(nf); await loadRequests(nf); }}>
                    <option value="pending">قيد المراجعة</option>
                    <option value="approved">مقبول</option>
                    <option value="rejected">مرفوض</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <Input placeholder="بحث بالاسم، اسم المستخدم، الإيميل أو الهاتف" value={reqFilter.search} onChange={(e)=> setReqFilter(f=>({...f, search: e.target.value}))} onKeyDown={async (e)=>{ if(e.key==='Enter'){ await loadRequests(reqFilter); } }} />
                  <Button variant="outline" onClick={async ()=> await loadRequests(reqFilter)}>بحث</Button>
                  <Button variant="outline" onClick={async ()=>{ const nf = { status: reqFilter.status, search: '' }; setReqFilter(nf); await loadRequests(nf); }}>مسح</Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">المعرف</TableHead>
                    <TableHead className="min-w-32">اسم المستخدم</TableHead>
                    <TableHead className="min-w-48">المواد المختارة</TableHead>
                    <TableHead className="min-w-24">الإيصال</TableHead>
                    <TableHead className="min-w-24">المجموع</TableHead>
                    <TableHead className="min-w-24">الحالة</TableHead>
                    <TableHead className="min-w-40">إجراءات</TableHead>
                  </TableRow>
                  </TableHeader>
                  <TableBody>
                  {requests.map(r => (
                    <TableRow key={r.id} className="hover:bg-muted/40">
                      <TableCell>{r.id}</TableCell>
                      <TableCell>{r.username || r.user?.username || r.user_id}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(r.selected_subjects||[]).map((s, idx) => (
                            <Badge key={idx} variant="secondary" className="font-normal">{s.name || s}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{r.payment_receipt_url ? <a className="text-primary underline" href={resolveFileUrl(r.payment_receipt_url)} target="_blank" rel="noopener noreferrer">عرض</a> : '-'}</TableCell>
                      <TableCell>
                        {Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(Number(r.total_amount||0))}
                      </TableCell>
                      <TableCell>
                        <span className={[
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
                          r.status === 'approved' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30' : r.status === 'rejected' ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/30' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30'
                        ].join(' ')}>
                          {r.status === 'approved' ? 'مقبول' : r.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button size="sm" onClick={()=>approve(r.id)} disabled={r.status!=='pending' || processing[r.id]} className="h-9 px-3 inline-flex items-center gap-2">
                            {processing[r.id] && <span className="h-3.5 w-3.5 border-2 border-white/50 border-top-transparent border-t-transparent rounded-full animate-spin" />}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M9 16.2l-3.5-3.5L4 14.2 9 19l11-11-1.5-1.5z"/></svg>
                            <span>{processing[r.id] ? 'جارٍ...' : 'قبول'}</span>
                          </Button>
                          <Button size="sm" variant="destructive" onClick={()=>reject(r.id)} disabled={r.status!=='pending' || processing[r.id]} className="h-9 px-3 inline-flex items-center gap-2">
                            {processing[r.id] && <span className="h-3.5 w-3.5 border-2 border-white/50 border-top-transparent border-t-transparent rounded-full animate-spin" />}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M6 19h12v2H6v-2zM7 6h10v2H7V6zm-2 5h14v2H5v-2z"/></svg>
                            <span>{processing[r.id] ? 'جارٍ...' : 'رفض'}</span>
                          </Button>
                          {r.status==='approved' && r.user_id && (
                            <Link to={`/admin/users/${r.user_id}`} className="inline-flex">
                              <Button size="sm" variant="outline">عرض البروفايل</Button>
                            </Link>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <Card className="nurso-hover-lift border-0 ring-1 ring-black/5 dark:ring-white/10 bg-white/70 dark:bg-gray-900/70 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-emerald-600"><path d="M12 3l9 6-9 6-9-6 9-6zm0 14l9-6v8H3v-8l9 6z"/></svg>
                <span>المواد</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <Input placeholder="اسم المادة" value={subjectForm.name} onChange={e=>setSubjectForm({...subjectForm,name:e.target.value})} />
                <Input placeholder="الوصف" value={subjectForm.description} onChange={e=>setSubjectForm({...subjectForm,description:e.target.value})} />
                <Input placeholder="الفرقة (ID)" value={subjectForm.academic_year_id} onChange={e=>setSubjectForm({...subjectForm,academic_year_id:e.target.value})} />
                <Input placeholder="السعر" value={subjectForm.price} onChange={e=>setSubjectForm({...subjectForm,price:e.target.value})} />
              </div>
              <div className="flex gap-2">
                <Button onClick={createSubject} disabled={loading} className="h-10 px-4 inline-flex items-center gap-2">
                  {loading && <span className="h-4 w-4 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M19 3H5a2 2 0 00-2 2v14l4-4h12a2 2 0 002-2V5a2 2 0 00-2-2z"/></svg>
                  <span>إنشاء مادة</span>
                </Button>
                <Button variant="outline" onClick={loadSubjects} className="h-10 px-4 inline-flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M12 6V4l-4 4 4 4V8c2.76 0 5 2.24 5 5a5 5 0 11-5-5z"/></svg>
                  <span>تحديث</span>
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {subjects.map(s=> (
                  <Button key={s.id} variant={selectedSubject===s.id? 'default':'secondary'} onClick={async ()=>{ setSelectedSubject(s.id); setLessonForm(f=>({...f, subject_id:s.id})); await loadLessons(s.id); await loadSubjectExams(s.id) }}>{s.name}</Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedSubjectObj && (
            <Card className="nurso-hover-lift border-0 ring-1 ring-black/5 dark:ring-white/10 bg-white/70 dark:bg-gray-900/70 backdrop-blur">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-emerald-600"><path d="M4 6h16v2H4V6zm0 4h10v2H4v-2zm0 4h16v2H4v-2z"/></svg>
                    <span>الدروس - {selectedSubjectObj.name}</span>
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setSectionOpen(s => ({ ...s, lessons: !s.lessons }))} className="h-8 px-3 inline-flex items-center gap-2">
                    <svg className={`h-4 w-4 transition-transform ${sectionOpen.lessons ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M6.293 9.293a1 1 0 011.414 0L10 11.586l2.293-2.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                    <span>{sectionOpen.lessons ? 'إخفاء' : 'إظهار'}</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className={`space-y-4 ${sectionOpen.lessons ? '' : 'hidden'}`}>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                  <Input placeholder="عنوان الدرس" value={lessonForm.title} onChange={e=>setLessonForm({...lessonForm,title:e.target.value})} />
                  <Input placeholder="وصف" value={lessonForm.description} onChange={e=>setLessonForm({...lessonForm,description:e.target.value})} />
                  <Input placeholder="رابط الفيديو" value={lessonForm.video_url} onChange={e=>setLessonForm({...lessonForm,video_url:e.target.value})} />
                  <Input placeholder="الترتيب" value={lessonForm.lesson_order} onChange={e=>setLessonForm({...lessonForm,lesson_order:e.target.value})} />
                  <Button onClick={createLesson} disabled={loading || !lessonForm.subject_id} className="h-10 px-4 inline-flex items-center gap-2">
                    {loading && <span className="h-4 w-4 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M19 13H5v-2h14v2zM5 6h14v2H5V6zm0 12h14v2H5v-2z"/></svg>
                    <span>إضافة درس</span>
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">#</TableHead>
                      <TableHead className="min-w-40">العنوان</TableHead>
                      <TableHead className="min-w-40">الفيديو</TableHead>
                      <TableHead className="w-20">ترتيب</TableHead>
                      <TableHead className="w-16">نشط</TableHead>
                      <TableHead className="min-w-32">مرفقات</TableHead>
                      <TableHead className="min-w-32">امتحانات</TableHead>
                      <TableHead className="min-w-40">إجراءات</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {lessons.map((l, index) => (
                      <TableRow key={l.id} className="hover:bg-muted/40">
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell><Input value={l.title} onChange={e=>setLessons(prev=>prev.map(x=>x.id===l.id?{...x,title:e.target.value}:x))} className="w-full" /></TableCell>
                        <TableCell><Input value={l.video_url||''} onChange={e=>setLessons(prev=>prev.map(x=>x.id===l.id?{...x,video_url:e.target.value}:x))} className="w-full" /></TableCell>
                        <TableCell><Input value={l.lesson_order} onChange={e=>setLessons(prev=>prev.map(x=>x.id===l.id?{...x,lesson_order:e.target.value}:x))} className="w-full" /></TableCell>
                        <TableCell className="text-center"><input type="checkbox" className="h-4 w-4 accent-emerald-600" checked={l.is_active} onChange={e=>setLessons(prev=>prev.map(x=>x.id===l.id?{...x,is_active:e.target.checked}:x))} /></TableCell>
                        <TableCell>
                          <details className="group">
                            <summary className="cursor-pointer text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
                              <svg className="h-4 w-4 group-open:rotate-90 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M6.293 9.293a1 1 0 011.414 0L10 11.586l2.293-2.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
                              </svg>
                              المرفقات ({(l.attachments||[]).length})
                            </summary>
                            <div className="mt-2 p-3 bg-muted/20 rounded-lg space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                                <Input placeholder="الاسم" value={(attachDrafts[l.id]?.name)||''} onChange={e=>setAttachDrafts(prev=>({...prev,[l.id]:{...(prev[l.id]||{}), name:e.target.value}}))} />
                                <Input placeholder="الرابط" value={(attachDrafts[l.id]?.url)||''} onChange={e=>setAttachDrafts(prev=>({...prev,[l.id]:{...(prev[l.id]||{}), url:e.target.value}}))} />
                                <Button size="sm" onClick={()=>{
                                  if (!attachDrafts[l.id]?.url) return
                                  setLessons(prev=>prev.map(x=>{
                                    if (x.id!==l.id) return x
                                    const next = Array.isArray(x.attachments)?[...x.attachments]:[]
                                    next.push({ name: attachDrafts[l.id]?.name || 'مرفق', url: attachDrafts[l.id]?.url })
                                    return { ...x, attachments: next }
                                  }))
                                  setAttachDrafts(prev=>({ ...prev, [l.id]: { name:'', url:'' } }))
                                }} className="h-9">إضافة</Button>
                              </div>
                              <div className="space-y-2">
                                {(l.attachments||[]).map((a, idx) => (
                                  <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center p-2 bg-background/50 rounded">
                                    <Input value={a.name||''} onChange={e=>setLessons(prev=>prev.map(x=>x.id===l.id?{...x,attachments:(x.attachments||[]).map((y,i)=>i===idx?{...y,name:e.target.value}:y)}:x))} />
                                    <Input value={a.url||''} onChange={e=>setLessons(prev=>prev.map(x=>x.id===l.id?{...x,attachments:(x.attachments||[]).map((y,i)=>i===idx?{...y,url:e.target.value}:y)}:x))} />
                                    <a className="text-primary underline text-sm" href={a.url} target="_blank" rel="noreferrer">فتح</a>
                                    <Button size="sm" onClick={()=>updateLesson({ ...l })}>حفظ</Button>
                                    <Button size="sm" variant="destructive" onClick={()=>setLessons(prev=>prev.map(x=>x.id===l.id?{...x,attachments:(x.attachments||[]).filter((_,i)=>i!==idx)}:x))}>حذف</Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </details>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div className="text-sm text-muted-foreground">عدد الامتحانات: {l.exams_count || 0}</div>
                            <Button size="sm" onClick={async ()=>{ setSelectedLesson(l.id); setExamForm(f=>({...f, lesson_id:l.id})); await loadExams(l.id) }} className="w-full">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 mr-1"><path d="M5 4h14v2H5V4zm0 14h14v2H5v-2zM5 9h10v6H5V9zm12 0h4v6h-4V9z"/></svg>
                              عرض الامتحانات
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-2">
                            <Button size="sm" onClick={()=>updateLesson(l)} className="w-full">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 mr-1"><path d="M17 3H7a2 2 0 00-2 2v14l5-3 5 3V5a2 2 0 00-2-2z"/></svg>
                              حفظ
                            </Button>
                            <Button size="sm" variant="destructive" onClick={()=>deleteLesson(l)} className="w-full">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 و-4 mr-1"><path d="M6 7h12v2H6V7zm1 3h10v10H7V10zm3-7h4v2h-4V3z"/></svg>
                              حذف
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedSubjectObj && (
            <Card className="nurso-hover-lift border-0 ring-1 ring-black/5 dark:ring-white/10 bg-white/70 dark:bg-gray-900/70 backdrop-blur">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-emerald-600"><path d="M7 4h10v2H7V4zm-2 4h14v2H5V8zm2 4h10v2H7v-2zm-2 4h14v2H5v-2z"/></svg>
                    <span>الامتحانات الشاملة للمادة - {selectedSubjectObj.name}</span>
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setSectionOpen(s => ({ ...s, subjectExams: !s.subjectExams }))} className="h-8 px-3 inline-flex items-center gap-2">
                    <svg className={`h-4 w-4 transition-transform ${sectionOpen.subjectExams ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M6.293 9.293a1 1 0 011.414 0L10 11.586l2.293-2.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                    <span>{sectionOpen.subjectExams ? 'إخفاء' : 'إظهار'}</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className={`space-y-4 ${sectionOpen.subjectExams ? '' : 'hidden'}`}>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                  <Input placeholder="عنوان" value={examForm.title} onChange={e=>setExamForm({...examForm,title:e.target.value})} />
                  <Input placeholder="وصف" value={examForm.description} onChange={e=>setExamForm({...examForm,description:e.target.value})} />
                  <Input placeholder="المدة (د)" value={examForm.duration_minutes} onChange={e=>setExamForm({...examForm,duration_minutes:e.target.value})} />
                  <Input placeholder="درجة النجاح" value={examForm.passing_score} onChange={e=>setExamForm({...examForm,passing_score:e.target.value})} />
                  <Button onClick={async ()=>{ setExamForm(f=>({...f, subject_id: selectedSubjectObj.id, lesson_id: '' })); await createExam(); await loadSubjectExams(selectedSubjectObj.id) }} disabled={loading || !selectedSubjectObj?.id} className="h-10 px-4 inline-flex items-center gap-2">
                    {loading && <span className="h-4 w-4 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M19 13H5v-2h14v2zM5 6h14v2H5V6zm0 12h14v2H5v-2z"/></svg>
                    <span>إضافة امتحان شامل</span>
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">#</TableHead>
                        <TableHead className="min-w-40">العنوان</TableHead>
                        <TableHead className="w-24">المدة (دقيقة)</TableHead>
                        <TableHead className="w-24">درجة النجاح</TableHead>
                        <TableHead className="w-20">أسئلة</TableHead>
                        <TableHead className="w-16">نشط</TableHead>
                        <TableHead className="min-w-32">عرض الأسئلة</TableHead>
                        <TableHead className="min-w-40">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subjectExams.map((e, index) => (
                        <TableRow key={e.id} className="hover:bg-muted/40">
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell><Input value={e.title} onChange={ev=>setSubjectExams(prev=>prev.map(x=>x.id===e.id?{...x,title:ev.target.value}:x))} className="w-full" /></TableCell>
                          <TableCell><Input value={e.duration_minutes} onChange={ev=>setSubjectExams(prev=>prev.map(x=>x.id===e.id?{...x,duration_minutes:ev.target.value}:x))} className="w-full" /></TableCell>
                          <TableCell><Input value={e.passing_score} onChange={ev=>setSubjectExams(prev=>prev.map(x=>x.id===e.id?{...x,passing_score:ev.target.value}:x))} className="w-full" /></TableCell>
                          <TableCell className="text-center font-medium">{e.questions_count ?? (e.questions?.length || 0)}</TableCell>
                          <TableCell className="text-center"><input type="checkbox" className="h-4 w-4 accent-emerald-600" checked={e.is_active} onChange={ev=>setSubjectExams(prev=>prev.map(x=>x.id===e.id?{...x,is_active:ev.target.checked}:x))} /></TableCell>
                          <TableCell>
                            <Button size="sm" onClick={async ()=>{ setSelectedExam(e.id); setQuestionForm(f=>({...f, exam_id:e.id})); await loadQuestions(e.id) }} className="w-full">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 mr-1"><path d="M5 4h14v2H5V4zm0 14h14v2H5v-2zM5 9h10v6H5V9zm12 0h4v6h-4V9z"/></svg>
                              عرض الأسئلة
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-2">
                              <Button size="sm" onClick={async ()=>{ await updateExam(e); await loadSubjectExams(selectedSubjectObj.id) }} className="w-full">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 mr-1"><path d="M17 3H7a2 2 0 00-2 2v14l5-3 5 3V5a2 2 0 00-2-2z"/></svg>
                                حفظ
                              </Button>
                              <Button size="sm" variant="destructive" onClick={async ()=>{ await deleteExam(e); await loadSubjectExams(selectedSubjectObj.id) }} className="w-full">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 mr-1"><path d="M6 7h12v2H6V7zm1 3h10v10H7V10zm3-7h4v2h-4V3z"/></svg>
                                حذف
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedLesson && (
            <Card className="nurso-hover-lift border-0 ring-1 ring-black/5 dark:ring-white/10 bg-white/70 dark:bg-gray-900/70 backdrop-blur">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-emerald-600"><path d="M7 4h10v2H7V4zm-2 4h14v2H5V8zm2 4h10v2H7v-2zm-2 4h14v2H5v-2z"/></svg>
                    <span>امتحانات الدرس</span>
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setSectionOpen(s => ({ ...s, exams: !s.exams }))} className="h-8 px-3 inline-flex items-center gap-2">
                    <svg className={`h-4 w-4 transition-transform ${sectionOpen.exams ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M6.293 9.293a1 1 0 011.414 0L10 11.586l2.293-2.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                    <span>{sectionOpen.exams ? 'إخفاء' : 'إظهار'}</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className={`space-y-4 ${sectionOpen.exams ? '' : 'hidden'}`}>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                  <Input placeholder="عنوان" value={examForm.title} onChange={e=>setExamForm({...examForm,title:e.target.value})} />
                  <Input placeholder="وصف" value={examForm.description} onChange={e=>setExamForm({...examForm,description:e.target.value})} />
                  <Input placeholder="المدة (د)" value={examForm.duration_minutes} onChange={e=>setExamForm({...examForm,duration_minutes:e.target.value})} />
                  <Input placeholder="درجة النجاح" value={examForm.passing_score} onChange={e=>setExamForm({...examForm,passing_score:e.target.value})} />
                  <Button onClick={createExam} disabled={loading || !examForm.lesson_id} className="h-10 px-4 inline-flex items-center gap-2">
                    {loading && <span className="h-4 w-4 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M19 13H5v-2h14v2zM5 6h14v2H5V6zm0 12h14v2H5v-2z"/></svg>
                    <span>إضافة امتحان</span>
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">#</TableHead>
                      <TableHead className="min-w-40">العنوان</TableHead>
                      <TableHead className="w-24">المدة (دقيقة)</TableHead>
                      <TableHead className="w-24">درجة النجاح</TableHead>
                      <TableHead className="w-20">أسئلة</TableHead>
                      <TableHead className="w-16">نشط</TableHead>
                      <TableHead className="min-w-32">عرض الأسئلة</TableHead>
                      <TableHead className="min-w-40">إجراءات</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {exams.map((e, index) => (
                      <TableRow key={e.id} className="hover:bg-muted/40">
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell><Input value={e.title} onChange={ev=>setExams(prev=>prev.map(x=>x.id===e.id?{...x,title:ev.target.value}:x))} className="w-full" /></TableCell>
                        <TableCell><Input value={e.duration_minutes} onChange={ev=>setExams(prev=>prev.map(x=>x.id===e.id?{...x,duration_minutes:ev.target.value}:x))} className="w-full" /></TableCell>
                        <TableCell><Input value={e.passing_score} onChange={ev=>setExams(prev=>prev.map(x=>x.id===e.id?{...x,passing_score:ev.target.value}:x))} className="w-full" /></TableCell>
                        <TableCell className="text-center font-medium">{e.questions_count ?? (e.questions?.length || 0)}</TableCell>
                        <TableCell className="text-center"><input type="checkbox" className="h-4 w-4 accent-emerald-600" checked={e.is_active} onChange={ev=>setExams(prev=>prev.map(x=>x.id===e.id?{...x,is_active:ev.target.checked}:x))} /></TableCell>
                        <TableCell>
                          <Button size="sm" onClick={async ()=>{ setSelectedExam(e.id); setQuestionForm(f=>({...f, exam_id:e.id})); await loadQuestions(e.id) }} className="w-full">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 mr-1"><path d="M5 4h14v2H5V4zm0 14h14v2H5v-2zM5 9h10v6H5V9zm12 0h4v6h-4V9z"/></svg>
                            عرض الأسئلة
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-2">
                            <Button size="sm" onClick={()=>updateExam(e)} className="w-full">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 mr-1"><path d="M17 3H7a2 2 0 00-2 2v14l5-3 5 3V5a2 2 0 00-2-2z"/></svg>
                              حفظ
                            </Button>
                            <Button size="sm" variant="destructive" onClick={()=>deleteExam(e)} className="w-full">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 mr-1"><path d="M6 7h12v2H6V7zm1 3h10v10H7V10zm3-7h4v2h-4V3z"/></svg>
                              حذف
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedExam && (
            <Card className="nurso-hover-lift border-0 ring-1 ring-black/5 dark:ring-white/10 bg-white/70 dark:bg-gray-900/70 backdrop-blur">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-emerald-600"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                    <span>الأسئلة</span>
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setSectionOpen(s => ({ ...s, questions: !s.questions }))} className="h-8 px-3 inline-flex items-center gap-2">
                    <svg className={`h-4 w-4 transition-transform ${sectionOpen.questions ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M6.293 9.293a1 1 0 011.414 0L10 11.586l2.293-2.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                    <span>{sectionOpen.questions ? 'إخفاء' : 'إظهار'}</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className={`space-y-4 ${sectionOpen.questions ? '' : 'hidden'}`}>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                  <Input placeholder="نص السؤال" value={questionForm.question_text} onChange={e=>setQuestionForm({...questionForm,question_text:e.target.value})} />
                  <Input placeholder="الترتيب" value={questionForm.order} onChange={e=>setQuestionForm({...questionForm,order:e.target.value})} />
                  <select className="border rounded-lg p-2 bg-white/70 dark:bg-gray-900/60 border-black/10 dark:border-white/10 backdrop-blur" value={questionForm.question_type} onChange={e=>setQuestionForm({...questionForm,question_type:e.target.value})}>
                    <option value="multiple_choice">اختيار من متعدد</option>
                    <option value="true_false">صح/خطأ</option>
                    <option value="short_answer">إجابة قصيرة</option>
                  </select>
                  <Button onClick={createQuestion} disabled={loading || !questionForm.exam_id} className="h-10 px-4 inline-flex items-center gap-2">
                    {loading && <span className="h-4 w-4 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M19 13H5v-2h14v2zM5 6h14v2H5V6zm0 12h14v2H5v-2z"/></svg>
                    <span>إضافة سؤال</span>
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">#</TableHead>
                        <TableHead className="min-w-40">السؤال</TableHead>
                        <TableHead className="w-20">الترتيب</TableHead>
                        <TableHead className="w-24">النوع</TableHead>
                        <TableHead className="w-16">نشط</TableHead>
                        <TableHead className="min-w-32">إجابات</TableHead>
                        <TableHead className="min-w-40">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {questions.map((q, index) => (
                        <TableRow key={q.id} className="hover:bg-muted/40">
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell><Input value={q.question_text} onChange={e=>setQuestions(prev=>prev.map(x=>x.id===q.id?{...x,question_text:e.target.value}:x))} className="w-full" /></TableCell>
                          <TableCell><Input value={q.order} onChange={e=>setQuestions(prev=>prev.map(x=>x.id===q.id?{...x,order:e.target.value}:x))} className="w-full" /></TableCell>
                          <TableCell>
                            <select className="w-full border rounded-lg p-2 bg-white/70 dark:bg-gray-900/60 border-black/10 dark:border-white/10 backdrop-blur" value={q.question_type} onChange={e=>setQuestions(prev=>prev.map(x=>x.id===q.id?{...x,question_type:e.target.value}:x))}>
                              <option value="multiple_choice">اختيار من متعدد</option>
                              <option value="true_false">صح/خطأ</option>
                              <option value="short_answer">إجابة قصيرة</option>
                            </select>
                          </TableCell>
                          <TableCell className="text-center"><input type="checkbox" className="h-4 w-4 accent-emerald-600" checked={q.is_active} onChange={e=>setQuestions(prev=>prev.map(x=>x.id===q.id?{...x,is_active:e.target.checked}:x))} /></TableCell>
                          <TableCell>
                            <details className="group">
                              <summary className="cursor-pointer text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
                                <svg className="h-4 w-4 group-open:rotate-90 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M6.293 9.293a1 1 0 011.414 0L10 11.586l2.293-2.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
                                </svg>
                                الإجابات ({(q.answers||[]).length})
                              </summary>
                              <div className="mt-2 p-3 bg-muted/20 rounded-lg space-y-3">
                                <div className="space-y-2">
                                  {(q.answers||[]).map(a => (
                                    <div key={a.id} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-center p-2 bg-background/50 rounded">
                                      <Input value={a.answer_text} onChange={e=>setQuestions(prev=>prev.map(x=>x.id===q.id?{...x,answers:(x.answers||[]).map(y=>y.id===a.id?{...y,answer_text:e.target.value}:y)}:x))} />
                                      <label className="flex items-center gap-2">
                                        <input type="checkbox" checked={a.is_correct} onChange={e=>{
                                          // enforce single correct answer in UI
                                          const checked = e.target.checked
                                          setQuestions(prev=>prev.map(x=>{
                                            if (x.id!==q.id) return x
                                            return {
                                              ...x,
                                              answers: (x.answers||[]).map(y => ({...y, is_correct: y.id===a.id ? checked : false}))
                                            }
                                          }))
                                        }} /> صحيحة
                                      </label>
                                      <Input value={a.order} onChange={e=>setQuestions(prev=>prev.map(x=>x.id===q.id?{...x,answers:(x.answers||[]).map(y=>y.id===a.id?{...y,order:e.target.value}:y)}:x))} />
                                      <Button size="sm" onClick={async ()=>{ await Api.updateAnswer(a.id, { answer_text:a.answer_text, is_correct:a.is_correct, order:a.order, is_active:a.is_active }); await loadQuestions(q.exam_id) }} className="h-9">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 mr-1"><path d="M17 3H7a2 2 0 00-2 2v14l5-3 5 3V5a2 2 0 00-2-2z"/></svg>
                                        حفظ
                                      </Button>
                                      <Button size="sm" variant="destructive" onClick={async ()=>{ await Api.deleteAnswer(a.id); await loadQuestions(q.exam_id) }} className="h-9">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 mr-1"><path d="M6 7h12v2H6V7zm1 3h10v10H7V10zm3-7h4v2h-4V3z"/></svg>
                                        حذف
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-6 gap-2 items-center p-2 bg-background/30 rounded border-2 border-dashed border-muted-foreground/20">
                                  <Input placeholder="نص الإجابة" value={answerForm.answer_text} onChange={e=>setAnswerForm({...answerForm,answer_text:e.target.value, question_id:q.id})} />
                                  <label className="flex items-center gap-2">
                                    <input type="checkbox" checked={answerForm.is_correct} onChange={e=>setAnswerForm({...answerForm,is_correct:e.target.checked})} /> صحيحة
                                  </label>
                                  <Input placeholder="الترتيب" value={answerForm.order} onChange={e=>setAnswerForm({...answerForm,order:e.target.value})} />
                                  <Button size="sm" onClick={createAnswer} className="h-9">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 mr-1"><path d="M19 13H5v-2h14v2zM5 6h14v2H5V6zm0 12h14v2H5v-2z"/></svg>
                                    إضافة
                                  </Button>
                                </div>
                              </div>
                            </details>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-2">
                              <Button size="sm" onClick={()=>updateQuestion(q)} className="w-full">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 mr-1"><path d="M17 3H7a2 2 0 00-2 2v14l5-3 5 3V5a2 2 0 00-2-2z"/></svg>
                                حفظ
                              </Button>
                              <Button size="sm" variant="destructive" onClick={()=>deleteQuestion(q)} className="w-full">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 mr-1"><path d="M6 7h12v2H6V7zm1 3h10v10H7V10zm3-7h4v2h-4V3z"/></svg>
                                حذف
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}