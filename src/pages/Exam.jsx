import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import Api from '../services/api.js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'

export default function ExamPage() {
  const { id } = useParams() // exam id
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exam, setExam] = useState(null)
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [timeLeft, setTimeLeft] = useState(null) // seconds
  const timerRef = useRef(null)

  useEffect(() => {
    let mounted = true
    async function load(){
      setLoading(true)
      setError('')
      try {
        const res = await Api.getExamDetails(id)
        if (res.success && mounted) {
          setExam(res.exam)
          if (res.exam?.duration_minutes) {
            setTimeLeft(res.exam.duration_minutes * 60)
          }
        }
      } catch (e) {
        setError(e.message || 'تعذر تحميل الامتحان')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [id])

  const remaining = Infinity
  const attemptsExhausted = false

  // simple countdown
  useEffect(() => {
    if (timeLeft == null) return
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev == null) return prev
        if (prev <= 1) {
          clearInterval(timerRef.current)
          // auto submit when time is over
          submit()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [timeLeft])

  async function submit() {
    setSubmitting(true)
    try {
      const payload = {}
      for (const q of exam.questions) {
        const selected = answers[q.id]
        if (selected) payload[String(q.id)] = selected
      }
      if (attemptsExhausted) return
      const res = await Api.submitExam(id, payload)
      if (res.success) setResult(res)
    } catch (e) {
      setError(e.message || 'فشل إرسال الامتحان')
    } finally {
      setSubmitting(false)
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
  if (!exam) return null

  return (
    <div className="nurso-container nurso-section space-y-6">
      <Card className="nurso-hover-lift">
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl md:text-2xl font-bold flex items-center justify-between gap-3">
            <span>{exam.title}</span>
            <span className="inline-flex items-center gap-2 text-sm px-3 py-1 rounded-full bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10">
              <span>محاولات متبقية: {remaining === Infinity ? 'غير محدودة' : remaining}</span>
            </span>
          </CardTitle>
          {timeLeft != null && (
            <div className="w-full flex items-center gap-3">
              <div className="text-sm font-medium">الوقت المتبقي: {Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,'0')}</div>
              <div className="flex-1 h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${Math.max(0, (timeLeft/(exam.duration_minutes*60))*100)}%` }} />
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {attemptsExhausted && (
            <div className="p-3 border rounded bg-yellow-50 text-yellow-800">لقد استنفدت عدد المحاولات المسموحة لهذا الامتحان.</div>
          )}

          {!attemptsExhausted && exam.questions?.map((q, qi) => (
            <div key={q.id} className="p-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-gray-900/60 backdrop-blur nurso-hover-lift">
              <div className="flex items-start justify-between mb-3">
                <div className="font-medium">{qi + 1}. {q.question_text}</div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10">سؤال</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {q.answers?.map((a) => {
                  const val = a.id
                  const selected = answers[q.id] === val
                  return (
                    <label key={a.id} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${selected ? 'bg-primary/10 border-primary/40' : 'bg-white dark:bg-gray-900 border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'}`}>
                      <input className="accent-primary" type="radio" name={`q-${q.id}`} checked={selected} onChange={()=>setAnswers({ ...answers, [q.id]: val })} />
                      <span>{a.answer_text}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-300">تم اختيار {Object.keys(answers).length} من {exam.questions?.length || 0} سؤال</div>
            <Button onClick={submit} disabled={submitting || attemptsExhausted} className="px-6">إرسال الامتحان</Button>
          </div>

          {result && (
            (() => {
              const countedPass = typeof result.counted_score !== 'undefined' ? Number(result.counted_score) >= Number(exam.passing_score) : result.passed
              const pct = Math.round(result.score)
              const countedPct = typeof result.counted_score !== 'undefined' ? Math.round(result.counted_score) : null
              return (
                <div className={`p-4 md:p-5 rounded-xl ring-1 ${countedPass ? 'bg-emerald-50/80 dark:bg-emerald-900/20 ring-emerald-200/60 dark:ring-emerald-800/40' : 'bg-red-50/80 dark:bg-red-900/20 ring-red-200/60 dark:ring-red-800/40'} nurso-hover-lift`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${countedPass ? 'bg-emerald-600' : 'bg-red-600'} text-white shadow`}> 
                        {countedPass ? (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M9 16.2l-3.5-3.5L4 14.2 9 19l11-11-1.5-1.5z"/></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M18.3 5.71L12 12.01 5.7 5.7 4.29 7.11 10.59 13.4 4.3 19.7l1.41 1.41L12 14.81l6.29 6.3 1.41-1.41-6.29-6.3 6.29-6.29z"/></svg>
                        )}
                      </span>
                      <div>
                        <div className="text-base md:text-lg font-bold text-gray-900 dark:text-white">نتيجة الامتحان</div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">درجة النجاح: {exam.passing_score}%</div>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-2 text-xs px-2.5 py-1 rounded-full border ${countedPass ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-800/50' : 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-200 dark:border-red-800/50'}`}>
                      {countedPass ? 'ناجح' : 'غير ناجح'}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div className="md:col-span-1 flex items-center justify-center">
                      <div className="text-center">
                        <div className={`text-4xl md:text-5xl font-extrabold ${countedPass ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>{pct}%</div>
                        <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">نتيجة هذه المحاولة</div>
                        {countedPct != null && (
                          <div className="mt-2 text-sm">
                            <span className="text-gray-700 dark:text-gray-200 font-semibold">المحتسبة:</span>
                            <span className={`mr-2 font-bold ${countedPass ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>{countedPct}%</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="p-3 rounded-lg bg-white/70 dark:bg-white/5 border border-black/10 dark:border-white/10">
                        <div className="text-gray-500 dark:text-gray-400 text-xs">إجمالي الأسئلة</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{result.total_questions}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-white/70 dark:bg-white/5 border border-black/10 dark:border-white/10">
                        <div className="text-gray-500 dark:text-gray-400 text-xs">الصحيحة</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{result.correct_answers}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-white/70 dark:bg-white/5 border border-black/10 dark:border-white/10">
                        <div className="text-gray-500 dark:text-gray-400 text-xs">الخاطئة</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{Math.max(0, (result.total_questions - result.correct_answers))}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-white/70 dark:bg-white/5 border border-black/10 dark:border-white/10">
                        <div className="text-gray-500 dark:text-gray-400 text-xs">حالة الاحتساب</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{result.counted === false ? 'غير محتسبة' : 'محتسبة'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-gray-600 dark:text-gray-300">
                    {result.counted === false ? 'تم احتساب المحاولة الأولى فقط، هذه المحاولة لا تؤثر على الدرجة النهائية.' : 'تم احتساب هذه المحاولة كدرجة نهائية.'}
                  </div>
                </div>
              )
            })()
          )}
        </CardContent>
      </Card>
    </div>
  )
}