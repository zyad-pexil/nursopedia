
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Label } from '@/components/ui/label.jsx'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group.jsx'
import { Checkbox } from '@/components/ui/checkbox.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog.jsx'
import { Eye, EyeOff, User, Lock, GraduationCap, Upload, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import logoImage from './assets/LOGO.png'
import ApiService from './services/api.js'
import { useNavigate } from 'react-router-dom'
import './App.css'
import Slideshow from '@/components/Slideshow.jsx'


// Hoisted form components to prevent remount on each parent render
function LoginFormView({ message, loading, showPassword, setShowPassword, loginData, handleInputChange, handleLogin, setCurrentView, navigate }){
  return (
    <Card className="w-full max-w-md mx-auto nursopedia-card fade-in nurso-hover-lift">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <img 
            src={logoImage} 
            alt="Team Nursopedia Logo" 
            className="w-24 h-24 object-contain rounded-full shadow-lg"
          />
        </div>
        <CardTitle className="text-2xl font-bold text-gray-800 dark:text-white">
          مرحباً بك في منصة Team Nursopedia
        </CardTitle>
        <CardDescription className="text-gray-600">
          سجل دخولك للوصول إلى المواد التعليمية
        </CardDescription>
      </CardHeader>
      <CardContent>
        {message.text && (
          <Alert className={`mb-4 ${message.type === 'error' ? 'border-red-500' : 'border-green-500'}`}>
            {message.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-right block">اسم المستخدم</Label>
            <div className="relative">
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="أدخل اسم المستخدم"
                value={loginData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className="nursopedia-input pr-10"
                required
                disabled={loading}
              />
              <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-right block">كلمة المرور</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="أدخل كلمة المرور"
                value={loginData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="nursopedia-input pr-10 pl-10"
                autoComplete="current-password"
                required
                disabled={loading}
              />
              <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full nursopedia-button" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="ml-2 w-4 h-4 animate-spin" />
                جاري التحميل...
              </>
            ) : (
              <>
                <GraduationCap className="ml-2 w-4 h-4" />
                تسجيل الدخول
              </>
            )}
          </Button>
        </form>
        <div className="mt-6 space-y-3">
          <div className="text-center">
            <button
              onClick={() => setCurrentView('forgot-password')}
              className="text-primary hover:text-primary/80 text-sm transition-colors"
              disabled={loading}
            >
              نسيت كلمة المرور؟
            </button>
          </div>
          <div className="text-center">
            <span className="text-gray-600 text-sm">ليس لديك حساب؟ </span>
            <button
              onClick={() => navigate('/register')}
              className="text-primary hover:text-primary/80 font-medium text-sm transition-colors"
              disabled={loading}
              type="button"
            >
              إنشاء حساب جديد
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function RegisterFormView({ message, loading, registerData, handleInputChange, handleRegister, academicYears, subjects, totalAmount, handleSubjectChange, setReceiptFile, setCurrentView, discountApplied }){
  const alertRef = useRef(null)
  const [regShowPassword, setRegShowPassword] = useState(false)
  useEffect(() => {
    if (message?.text && message?.type === 'error' && alertRef.current) {
      // Smooth scroll to the alert when an error appears
      alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [message])
  return (
    <Card className="w-full max-w-3xl mx-auto nursopedia-card fade-in nurso-hover-lift">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <img 
            src={logoImage} 
            alt="Team Nursopedia Logo" 
            className="w-20 h-20 object-contain rounded-full shadow-lg"
          />
        </div>
        <CardTitle className="text-2xl font-bold text-gray-800 dark:text-white">إنشاء حساب جديد</CardTitle>
        <CardDescription className="text-gray-600">املأ البيانات التالية لإنشاء حسابك في المنصة</CardDescription>
      </CardHeader>
      <CardContent>
        {message.text && message.type === 'success' ? (
          <div className="mb-4 nurso-success-banner animate-fade-up" role="status">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5" />
              <div className="text-sm md:text-base font-semibold">{message.text}</div>
            </div>
          </div>
        ) : message.text ? (
          <Alert ref={alertRef} className={`mb-4 ${message.type === 'error' ? 'border-red-500' : 'border-green-500'}`}>
            {message.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        ) : null}
        <form onSubmit={handleRegister} className="space-y-6">
          {/* تحسين تجربة المستخدم: نصوص إرشادية وتباعد */}
          <div className="rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground">
            الرجاء تعبئة جميع الحقول بدقة. يمكن تعديل المواد المختارة لاحقًا من خلال الدعم.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 nurso-stagger">
            <div className="space-y-2">
              <Label htmlFor="fullName">الاسم الرباعي</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="أدخل اسمك الكامل"
                value={registerData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                className="nursopedia-input"
                required
                disabled={loading}
                autoFocus
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="regUsername">اسم المستخدم</Label>
              <Input
                id="regUsername"
                name="regUsername"
                type="text"
                placeholder="اختر اسم مستخدم فريد"
                value={registerData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className="nursopedia-input"
                autoComplete="username"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="example@email.com"
                value={registerData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="nursopedia-input"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الموبايل</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="01xxxxxxxxx"
                value={registerData.phone_number}
                onChange={(e) => handleInputChange('phone_number', e.target.value)}
                className="nursopedia-input"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="regPassword">كلمة المرور</Label>
              <div className="relative">
                <Input
                  id="regPassword"
                  name="regPassword"
                  type={regShowPassword ? 'text' : 'password'}
                  placeholder="أدخل كلمة مرور قوية"
                  value={registerData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="nursopedia-input pr-10"
                  autoComplete="new-password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setRegShowPassword(v => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={loading}
                  aria-label={regShowPassword ? 'اخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {regShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" /> }
                </button>
              </div>
              {/* مؤشر قوة كلمة المرور */}
              <div className="h-1 rounded bg-gray-200 overflow-hidden">
                <div className={`h-full transition-all ${registerData.password.length>=10 ? 'bg-green-500 w-3/3' : registerData.password.length>=6 ? 'bg-yellow-500 w-2/3' : registerData.password ? 'bg-red-500 w-1/3' : 'w-0'}`}></div>
              </div>
              <p className="text-xs text-muted-foreground">يفضل استخدام 10 أحرف على الأقل مع أرقام ورموز.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="أعد إدخال كلمة المرور"
                value={registerData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className="nursopedia-input"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label>اختر الفرقة الدراسية</Label>
              <RadioGroup 
                value={registerData.academic_year_id?.toString?.() ?? ''} 
                onValueChange={(value) => handleInputChange('academic_year_id', value)}
                className="flex gap-4"
                disabled={loading}
              >
                {academicYears.map((year) => (
                  <div key={year.id} className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value={year.id.toString()} id={`year-${year.id}`} />
                    <Label htmlFor={`year-${year.id}`}>{year.name}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {subjects.length > 0 && (
              <div className="space-y-2 md:col-span-2">
                <Label>اختر المواد الدراسية</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4 border rounded-lg">
                  {subjects.map((subject) => (
                    <div key={subject.id} className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id={`subject-${subject.id}`}
                        checked={registerData.selected_subjects.includes(subject.id)}
                        onCheckedChange={(checked) => handleSubjectChange(subject.id, checked)}
                        disabled={loading}
                      />
                      <Label htmlFor={`subject-${subject.id}`} className="flex-1">
                        {subject.name} - {subject.price} جنيه
                      </Label>
                    </div>
                  ))}
                </div>
                {/* ملاحظة الخصم: تظهر تحت اختيار المواد */}
                <div className="mt-3 rounded-md bg-blue-50 border border-blue-200 p-3 text-sm md:text-base text-blue-800">
                  عرض خصم متاح: عند اختيار المواد "أساسيات تمريض (عملي)" و"أساسيات تمريض (نظري)" و"ميكروبيولوجي" ستحصل تلقائياً على خصم 50 جنيه.
                  {discountApplied && <span className="font-semibold ml-1">تم تفعيل الخصم الآن.</span>}
                </div>
              </div>
            )}
            {totalAmount > 0 && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200 md:col-span-2">
                <div className="text-center">
                  <p className="text-lg font-semibold text-green-800">المبلغ المطلوب: {totalAmount} جنيه</p>
                  <p className="text-sm text-green-600 mt-1">رقم الدفع (فودافون كاش): 01080938298</p>
                </div>
              </div>
            )}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="paymentReceipt">رفع إيصال الدفع</Label>
              <input
                id="paymentReceipt"
                name="paymentReceipt"
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
                className="nursopedia-input"
                disabled={loading}
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full nursopedia-button" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="ml-2 w-4 h-4 animate-spin" />
                جاري التحميل...
              </>
            ) : (
              <>
                <GraduationCap className="ml-2 w-4 h-4" />
                إنشاء حساب
              </>
            )}
          </Button>
        </form>
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-primary hover:text-primary/80 font-medium text-sm transition-colors"
              disabled={loading}
            >
              العودة لتسجيل الدخول
            </button>
          </div>
      </CardContent>
    </Card>
  )
}

function ForgotPasswordView({ message, loading, setCurrentView }){
  return (
    <Card className="w-full max-w-md mx-auto nursopedia-card fade-in">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <img 
            src={logoImage} 
            alt="Team Nursopedia Logo" 
            className="w-24 h-24 object-contain rounded-full shadow-lg"
          />
        </div>
        <CardTitle className="text-2xl font-bold text-gray-800">نسيت كلمة المرور؟</CardTitle>
        <CardDescription className="text-gray-600">أدخل بريدك الإلكتروني لاستعادة كلمة المرور</CardDescription>
      </CardHeader>
      <CardContent>
        {message.text && (
          <Alert className={`mb-4 ${message.type === 'error' ? 'border-red-500' : 'border-green-500'}`}>
            {message.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={() => {}} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="forgotEmail" className="text-right block">البريد الإلكتروني</Label>
            <Input id="forgotEmail" name="forgotEmail" type="email" placeholder="أدخل بريدك الإلكتروني" className="nursopedia-input" autoComplete="email" required disabled={loading} />
          </div>
          <Button type="submit" className="w-full nursopedia-button" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="ml-2 w-4 h-4 animate-spin" />
                جاري التحميل...
              </>
            ) : (
              <>إرسال رابط الاستعادة</>
            )}
          </Button>
        </form>
        <div className="mt-6 text-center">
          <button onClick={() => navigate('/login')} className="text-primary hover:text-primary/80 text-sm transition-colors" disabled={loading}>
            العودة لتسجيل الدخول
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

function App({ initialView = 'login' }) {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [currentView, setCurrentView] = useState(initialView) // 'login', 'register', 'forgot-password'
  // Sync view with route changes (e.g., /login <-> /register)
  useEffect(() => {
    setCurrentView(initialView)
  }, [initialView])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  
  // Login form state
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  })
  
  // Registration form state
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone_number: '',
    academic_year_id: '',
    selected_subjects: []
  })
  
  // Academic data
  const [academicYears, setAcademicYears] = useState([])
  const [subjects, setSubjects] = useState([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [discountApplied, setDiscountApplied] = useState(false)
  
  // Receipt upload
  const [receiptFile, setReceiptFile] = useState(null)

  // Load academic years on component mount
  useEffect(() => {
    loadAcademicYears()
  }, [])

  // Load subjects when academic year changes
  useEffect(() => {
    if (registerData.academic_year_id) {
      loadSubjects(registerData.academic_year_id)
    }
  }, [registerData.academic_year_id])

  // Calculate total amount when subjects change + apply local discount hint
  useEffect(() => {
    if (registerData.selected_subjects.length > 0 && subjects.length > 0) {
      const selectedSubjects = subjects.filter(subject => 
        registerData.selected_subjects.includes(subject.id)
      )
      let total = selectedSubjects.reduce((sum, subject) => sum + subject.price, 0)

      // Apply 50 EGP discount if the trio exists within the selection (allow extra subjects)
      const selectedIds = registerData.selected_subjects
      const byIds = [1,2,4].every(id => selectedIds.includes(id))
      const selectedNames = new Set(selectedSubjects.map(s => s.name?.trim?.()))
      const byNames = ['أساسيات تمريض (عملي)','أساسيات تمريض (نظري)','ميكروبيولوجي']
        .every(name => selectedNames.has(name))

      if (byIds || byNames) {
        total = Math.max(0, total - 50)
        setDiscountApplied(true)
      } else {
        setDiscountApplied(false)
      }

      setTotalAmount(total)
    } else {
      setDiscountApplied(false)
      setTotalAmount(0)
    }
  }, [registerData.selected_subjects, subjects])

  const loadAcademicYears = async () => {
    try {
      const response = await ApiService.getAcademicYears()
      if (response.success) {
        setAcademicYears(response.academic_years)
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'فشل في تحميل الفرق الدراسية' })
    }
  }

  const loadSubjects = async (academicYearId) => {
    try {
      const response = await ApiService.getSubjectsByYear(academicYearId)
      if (response.success) {
        setSubjects(response.subjects)
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'فشل في تحميل المواد الدراسية' })
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      // TODO: integrate reCAPTCHA here to get token and send it with login
      const response = await ApiService.login(loginData.username, loginData.password)
      if (response.success) {
        setMessage({ type: 'success', text: response.message })
        // Navigate based on user type
        const role = response?.user?.user_type
        if (role === 'admin') {
          navigate('/admin', { replace: true })
        } else {
          navigate('/dashboard', { replace: true })
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    // Validation
    if (registerData.password !== registerData.confirmPassword) {
      setMessage({ type: 'error', text: 'كلمات المرور غير متطابقة' })
      setLoading(false)
      return
    }

    if (registerData.selected_subjects.length === 0) {
      setMessage({ type: 'error', text: 'يجب اختيار مادة واحدة على الأقل' })
      setLoading(false)
      return
    }

    if (!receiptFile) {
      setMessage({ type: 'error', text: 'رفع إيصال الدفع مطلوب' })
      setLoading(false)
      return
    }

    try {
      // TODO: integrate reCAPTCHA here to get token and send it with register
      const response = await ApiService.register({
        ...registerData,
        academic_year_id: registerData.academic_year_id ? parseInt(registerData.academic_year_id, 10) : null,
      })
      if (response.success) {
        setMessage({ type: 'success', text: response.message })
        setShowSuccessModal(true)
        
        // Upload receipt if provided
        if (receiptFile) {
          try {
            const uploadRes = await ApiService.uploadReceipt(response.user_id, receiptFile)
            if (!uploadRes.success) {
              console.warn('Receipt upload failed')
            }
          } catch (e) {
            console.warn('Receipt upload error', e)
          }
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    if (currentView === 'login') {
      setLoginData(prev => ({ ...prev, [field]: value }))
    } else if (currentView === 'register') {
      setRegisterData(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleSubjectChange = (subjectId, checked) => {
    setRegisterData(prev => ({
      ...prev,
      selected_subjects: checked
        ? [...prev.selected_subjects, subjectId]
        : prev.selected_subjects.filter(id => id !== subjectId)
    }))
  }

  const LoginForm = () => (
    <Card className="w-full max-w-md mx-auto nursopedia-card fade-in">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <img 
            src={logoImage} 
            alt="Team Nursopedia Logo" 
            className="w-24 h-24 object-contain rounded-full shadow-lg"
          />
        </div>
        <CardTitle className="text-2xl font-bold text-gray-800 dark:text-white">
          مرحباً بك في منصة Team Nursopedia
        </CardTitle>
        <CardDescription className="text-gray-600">
          سجل دخولك للوصول إلى المواد التعليمية
        </CardDescription>
      </CardHeader>
      <CardContent>
        {message.text && (
          <Alert className={`mb-4 ${message.type === 'error' ? 'border-red-500' : 'border-green-500'}`}>
            {message.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-right block">اسم المستخدم</Label>
            <div className="relative">
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="أدخل اسم المستخدم"
                value={loginData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className="nursopedia-input pr-10"
                required
                disabled={loading}
              />
              <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-right block">كلمة المرور</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="أدخل كلمة المرور"
                value={loginData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="nursopedia-input pr-10 pl-10"
                required
                disabled={loading}
              />
              <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full nursopedia-button" disabled={loading}>
            <GraduationCap className="ml-2 w-4 h-4" />
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </Button>
        </form>

        <div className="mt-6 space-y-3">
          <div className="text-center">
            <button
              onClick={() => setCurrentView('forgot-password')}
              className="text-primary hover:text-primary/80 text-sm transition-colors"
              disabled={loading}
            >
              نسيت كلمة المرور؟
            </button>
          </div>
          
          <div className="text-center">
            <span className="text-gray-600 text-sm">ليس لديك حساب؟ </span>
            <button
              onClick={() => setCurrentView('register')}
              className="text-primary hover:text-primary/80 font-medium text-sm transition-colors"
              disabled={loading}
            >
              إنشاء حساب جديد
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const RegisterForm = () => (
    <Card className="w-full max-w-2xl mx-auto nursopedia-card fade-in">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <img 
            src={logoImage} 
            alt="Team Nursopedia Logo" 
            className="w-20 h-20 object-contain rounded-full shadow-lg"
          />
        </div>
        <CardTitle className="text-2xl font-bold text-gray-800">
          إنشاء حساب جديد
        </CardTitle>
        <CardDescription className="text-gray-600">
          املأ البيانات التالية لإنشاء حسابك في المنصة
        </CardDescription>
      </CardHeader>
      <CardContent>
        {message.text && (
          <Alert className={`mb-4 ${message.type === 'error' ? 'border-red-500' : 'border-green-500'}`}>
            {message.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">الاسم الرباعي</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="أدخل اسمك الكامل"
                value={registerData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                className="nursopedia-input"
                required
                disabled={loading}
                autoFocus
                autoComplete="name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="regUsername">اسم المستخدم</Label>
              <Input
                id="regUsername"
                name="regUsername"
                type="text"
                placeholder="اختر اسم مستخدم فريد"
                value={registerData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className="nursopedia-input"
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="example@email.com"
                value={registerData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="nursopedia-input"
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الموبايل</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="01xxxxxxxxx"
                value={registerData.phone_number}
                onChange={(e) => handleInputChange('phone_number', e.target.value)}
                className="nursopedia-input"
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="regPassword">كلمة المرور</Label>
              <Input
                id="regPassword"
                name="regPassword"
                type="password"
                placeholder="أدخل كلمة مرور قوية"
                value={registerData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="nursopedia-input"
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="أعد إدخال كلمة المرور"
                value={registerData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className="nursopedia-input"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3 border rounded-xl p-4">
              <div className="text-sm font-semibold text-gray-700">اختر الفرقة الدراسية</div>
              <RadioGroup 
                value={registerData.academic_year_id?.toString?.() ?? ''} 
                onValueChange={(value) => handleInputChange('academic_year_id', value)}
                className="flex flex-wrap gap-4"
                disabled={loading}
              >
                {academicYears.map((year) => (
                  <div key={year.id} className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value={year.id.toString()} id={`year-${year.id}`} />
                    <Label htmlFor={`year-${year.id}`}>{year.name}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {subjects.length > 0 && (
              <div className="space-y-3 border rounded-xl p-4">
                <div className="text-sm font-semibold text-gray-700">اختر المواد الدراسية</div>
                <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-sm md:text-base text-blue-800">
                  عرض خصم متاح: عند اختيار المواد "أساسيات تمريض (عملي)" و"أساسيات تمريض (نظري)" و"ميكروبيولوجي" ستحصل تلقائياً على خصم 50 جنيه.
                  {discountApplied && <span className="font-semibold ml-1">تم تفعيل الخصم الآن.</span>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-56 overflow-auto pr-1">
                  {subjects.map((subject) => (
                    <div key={subject.id} className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id={`subject-${subject.id}`}
                        checked={registerData.selected_subjects.includes(subject.id)}
                        onCheckedChange={(checked) => handleSubjectChange(subject.id, checked)}
                        disabled={loading}
                      />
                      <Label htmlFor={`subject-${subject.id}`} className="flex-1">
                        {subject.name} - {subject.price} جنيه
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {totalAmount > 0 && (
              <div className="nurso-success-banner">
                <div className="text-center">
                  <p className="text-lg font-semibold">المبلغ المطلوب: {totalAmount} جنيه{discountApplied ? ' (شامل خصم باقة 50 جنيه)' : ''}</p>
                  <p className="text-sm mt-1">رقم الدفع (فودافون كاش): 01080938298</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="paymentReceipt">رفع إيصال الدفع</Label>
              <div className="border-2 border-dashed rounded-xl p-4 bg-gray-50">
                <input
                  id="paymentReceipt"
                  name="paymentReceipt"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
                  className="nursopedia-input bg-white"
                  disabled={loading}
                  required
                />
                <p className="text-xs text-gray-500 mt-2">الملفات المسموحة: الصور أو PDF</p>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full nursopedia-button" disabled={loading}>
            <GraduationCap className="ml-2 w-4 h-4" />
            {loading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setCurrentView('login')}
            className="text-primary hover:text-primary/80 font-medium text-sm transition-colors"
            disabled={loading}
          >
            العودة لتسجيل الدخول
          </button>
        </div>
      </CardContent>
    </Card>
  )

  const ForgotPasswordForm = () => {
    return (
      <Card className="w-full max-w-md mx-auto nursopedia-card fade-in">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src={logoImage} 
              alt="Team Nursopedia Logo" 
              className="w-24 h-24 object-contain rounded-full shadow-lg"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            نسيت كلمة المرور؟
          </CardTitle>
          <CardDescription className="text-gray-600">
            أدخل بريدك الإلكتروني لاستعادة كلمة المرور
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message.text && (
            <Alert className={`mb-4 ${message.type === 'error' ? 'border-red-500' : 'border-green-500'}`}>
              {message.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={() => {}} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgotEmail" className="text-right block">
                البريد الإلكتروني
              </Label>
              <Input
                id="forgotEmail"
                name="forgotEmail"
                type="email"
                placeholder="أدخل بريدك الإلكتروني"
                className="nursopedia-input"
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full nursopedia-button" disabled={loading}>
              {loading ? 'جاري الإرسال...' : 'إرسال رابط الاستعادة'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setCurrentView('login')}
              className="text-primary hover:text-primary/80 text-sm transition-colors"
              disabled={loading}
            >
              العودة لتسجيل الدخول
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {currentView === 'login' && (
          <LoginFormView
            message={message}
            loading={loading}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            loginData={loginData}
            handleInputChange={handleInputChange}
            handleLogin={handleLogin}
            setCurrentView={setCurrentView}
            navigate={navigate}
          />
        )}
        {currentView === 'register' && (
          <RegisterFormView
            message={message}
            loading={loading}
            registerData={registerData}
            handleInputChange={handleInputChange}
            handleRegister={handleRegister}
            academicYears={academicYears}
            subjects={subjects}
            totalAmount={totalAmount}
            handleSubjectChange={handleSubjectChange}
            setReceiptFile={setReceiptFile}
            setCurrentView={setCurrentView}
            discountApplied={discountApplied}
          />
        )}
        {currentView === 'forgot-password' && (
          <ForgotPasswordView
            message={message}
            loading={loading}
            setCurrentView={setCurrentView}
          />
        )}
        
        <div className="text-center mt-8 text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Team Nursopedia. جميع الحقوق محفوظة.
        </div>
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تم إنشاء الحساب بنجاح 🎉</DialogTitle>
            <DialogDescription>شكراً لتسجيلك! سنقوم بمراجعة بيانات الدفع وتفعيل حسابك قريباً.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {message?.text && (
              <div className="nurso-success-banner text-sm">{message.text}</div>
            )}
            <p className="text-sm text-gray-600">يمكنك الآن العودة لتسجيل الدخول أو الذهاب للصفحة الرئيسية.</p>
          </div>
          <DialogFooter>
            <Button onClick={() => { setShowSuccessModal(false); navigate('/login'); }} className="w-full sm:w-auto">الانتقال لتسجيل الدخول</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default App


