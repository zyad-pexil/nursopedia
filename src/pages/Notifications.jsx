import { useEffect, useMemo, useState } from 'react'
import Api from '../services/api.js'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card.jsx'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Skeleton } from '@/components/ui/skeleton.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import { AlertCircle, CheckCircle2, XCircle, BookOpen, ClipboardList, Award, Dot } from 'lucide-react'

const TYPE_META = {
  subscription_approved: { label: 'قبول الاشتراك', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30', Icon: CheckCircle2 },
  subscription_rejected: { label: 'رفض الاشتراك', color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/30', Icon: XCircle },
  new_lesson: { label: 'درس جديد', color: 'text-sky-600 bg-sky-50 dark:bg-sky-900/30', Icon: BookOpen },
  new_exam: { label: 'اختبار جديد', color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/30', Icon: ClipboardList },
  exam_result: { label: 'نتيجة اختبار', color: 'text-amber-700 bg-amber-50 dark:bg-amber-900/30', Icon: Award },
}

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr)
    return d.toLocaleString('ar-EG', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  } catch {
    return dateStr
  }
}

export default function Notifications() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [list, setList] = useState([])
  const [tab, setTab] = useState('all') // all | unread | read
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let mounted = true
    async function load(){
      setLoading(true)
      setError('')
      try {
        const res = await Api.getNotifications()
        if (res.success && mounted) setList(res.notifications || [])
      } catch (e) {
        if (mounted) setError(e.message || 'تعذر تحميل الإشعارات')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const unreadCount = useMemo(() => list.filter(n => !n.is_read).length, [list])

  // Update header bell badge immediately when list changes
  useEffect(() => {
    const badge = document.getElementById('notif-badge')
    if (!badge) return
    badge.textContent = String(unreadCount)
    badge.classList.toggle('hidden', unreadCount === 0)
  }, [unreadCount])

  const filtered = useMemo(() => {
    let arr = list
    if (tab === 'unread') arr = arr.filter(n => !n.is_read)
    if (tab === 'read') arr = arr.filter(n => n.is_read)
    return arr
  }, [tab, list])

  async function handleMarkAllRead(){
    try {
      setBusy(true)
      // optimistic
      setList(prev => prev.map(n => ({ ...n, is_read: true })))
      await Api.markAllNotificationsRead()
    } catch (e) {
      // reload on error
      const res = await Api.getNotifications()
      if (res.success) setList(res.notifications || [])
    } finally {
      setBusy(false)
    }
  }

  if (loading) return (
    <div className="p-6" dir="rtl">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span>الإشعارات</span>
            <Badge variant="secondary" className="font-normal">جاري التحميل…</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )

  if (error) return (
    <div className="p-6" dir="rtl">
      <Card className="max-w-3xl mx-auto border-rose-200 dark:border-rose-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-rose-600">
            <AlertCircle className="w-5 h-5" /> حدث خطأ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-rose-600 text-sm">{error}</p>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="nurso-section" dir="rtl">
      <div className="nurso-container max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">الإشعارات</h1>
            <p className="text-sm text-muted-foreground">آخر التحديثات والأنشطة المتعلقة بحسابك</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              غير المقروء: <span className="font-semibold">{unreadCount}</span>
            </Badge>
            <button
              onClick={handleMarkAllRead}
              disabled={busy || unreadCount === 0}
              className="px-3 py-1.5 text-sm rounded-md border hover:bg-muted disabled:opacity-50"
            >تحديد الكل كمقروء</button>
            <BulkDeleteButton onListChange={setList} />
          </div>
        </div>

        <Card className="nurso-hover-lift">
          <CardContent className="pt-6 space-y-4">
            {/* تم إزالة شريط البحث وقائمة نوع الإشعارات حسب الطلب */}

            <Tabs value={tab} onValueChange={setTab} className="w-full">
              <TabsList>
                <TabsTrigger value="all">الكل</TabsTrigger>
                <TabsTrigger value="unread">غير المقروء</TabsTrigger>
                <TabsTrigger value="read">المقروء</TabsTrigger>
              </TabsList>

              <Separator className="my-3" />

              <TabsContent value="all">
                <NotificationsList items={filtered} onListChange={setList} />
              </TabsContent>
              <TabsContent value="unread">
                <NotificationsList items={filtered} onListChange={setList} emptyHint="لا توجد إشعارات غير مقروءة" />
              </TabsContent>
              <TabsContent value="read">
                <NotificationsList items={filtered} onListChange={setList} emptyHint="لا توجد إشعارات مقروءة بعد" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function NotificationsList({ items, emptyHint, onListChange }){
  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
        <div className="w-16 h-16 rounded-full border-2 border-dashed grid place-items-center mb-3">
          <Dot className="w-8 h-8" />
        </div>
        <p className="text-sm">{emptyHint || 'لا توجد إشعارات حالياً'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((n) => (
        <NotificationItem key={n.id} note={n} onListChange={onListChange} />
      ))}
    </div>
  )
}

function NotificationItem({ note, onListChange }){
  const meta = TYPE_META[note.type] || { label: 'إشعار', color: 'text-gray-600 bg-gray-100 dark:bg-gray-800/40', Icon: AlertCircle }
  const { Icon } = meta
  const unread = !note.is_read

  async function toggleRead(){
    // optimistic
    onListChange?.(prev => prev.map(n => n.id === note.id ? { ...n, is_read: !n.is_read } : n))
    try {
      if (unread) await Api.markNotificationRead(note.id)
      else await Api.markNotificationUnread(note.id)
    } catch (e) {
      // revert on error
      onListChange?.(prev => prev.map(n => n.id === note.id ? { ...n, is_read: !n.is_read } : n))
    }
  }

  return (
    <div className={[
      'group flex items-start gap-3 p-3 rounded-lg border transition-colors',
      unread ? 'bg-muted/40 border-primary/30' : 'hover:bg-muted/30'
    ].join(' ')}>
      <div className={[
        'shrink-0 w-10 h-10 grid place-items-center rounded-full border',
        unread ? 'border-primary/40 bg-primary/5' : 'border-border bg-background'
      ].join(' ')}>
        <Icon className={[ 'w-5 h-5', unread ? 'text-primary' : 'text-muted-foreground' ].join(' ')} />
      </div>

      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <div className="font-medium leading-tight">{note.title}</div>
          <span className={[
            'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full',
            meta.color
          ].join(' ')}>
            {meta.label}
          </span>
          <div className="ms-auto flex items-center gap-2">
            {unread && <span className="inline-flex items-center gap-1 text-xs text-primary">• غير مقروء</span>}
            <button onClick={toggleRead} className="text-xs px-2 py-1 rounded border hover:bg-muted">
              {unread ? 'تحديد كمقروء' : 'تحديد كغير مقروء'}
            </button>
            <DeleteButton noteId={note.id} onListChange={onListChange} />
          </div>
        </div>
        <div className="text-sm text-muted-foreground">{note.message}</div>
        <div className="text-xs text-muted-foreground">{formatDate(note.created_at)}</div>
      </div>
    </div>
  )
}

function DeleteButton({ noteId, onListChange }){
  async function onDelete(){
    if (!confirm('هل تريد حذف هذا الإشعار؟')) return
    // optimistic remove
    onListChange?.(prev => prev.filter(n => n.id !== noteId))
    try {
      await Api.deleteNotification(noteId)
    } catch (e) {
      // reload list on error
      try {
        const res = await Api.getNotifications()
        if (res.success) onListChange?.(res.notifications || [])
      } catch {}
    }
  }
  return (
    <button onClick={onDelete} className="text-xs px-2 py-1 rounded border hover:bg-rose-50 text-rose-600 border-rose-200 dark:hover:bg-rose-950/40">حذف</button>
  )
}

function BulkDeleteButton({ onListChange }){
  async function onDeleteAll(){
    if (!confirm('سيتم حذف كل الإشعارات. هل أنت متأكد؟')) return
    // optimistic clear
    onListChange?.(() => [])
    try {
      await Api.deleteAllNotifications()
    } catch (e) {
      // reload list on error
      try {
        const res = await Api.getNotifications()
        if (res.success) onListChange?.(res.notifications || [])
      } catch {}
    }
  }
  return (
    <button onClick={onDeleteAll} className="px-3 py-1.5 text-sm rounded-md border hover:bg-rose-50 text-rose-600 border-rose-200 dark:hover:bg-rose-950/40">حذف الكل</button>
  )
}