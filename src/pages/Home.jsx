import { Link } from 'react-router-dom'
import logo from '@/assets/LOGO.webp'
import { BookOpen, BadgeCheck, Timer, Shield, Star, ArrowRight, Sparkles } from 'lucide-react'
import BackgroundSlideshow from '@/components/BackgroundSlideshow.jsx'

export default function Home(){
  return (
    <div className="min-h-screen relative flex flex-col text-white" dir="rtl">
      {/* خلفية الصفحة الرئيسية المتغيرة كل 5 ثواني */}
      <BackgroundSlideshow />

      {/* تدرّج خفيف أعلى الخلفية لتحسين القراءة */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/85 sm:from-black/40 sm:via-black/25 sm:to-black/70 -z-10" />
      {/* نمط زخرفي خفيف جداً لزيادة العمق */}
      <div className="pointer-events-none absolute inset-0 opacity-10 -z-10 [background-image:radial-gradient(circle_at_20%_20%,white_2px,transparent_2px),radial-gradient(circle_at_80%_30%,white_2px,transparent_2px)] [background-size:24px_24px]" />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="nurso-container pt-16 pb-10 lg:pt-24 lg:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 text-center lg:text-right">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/30 supports-[backdrop-filter]:bg-white/10 supports-[backdrop-filter]:backdrop-blur border border-white/20 mb-4">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span className="text-xs md:text-sm">تعليم تمريض تفاعلي ومخصص لنجاحك</span>
              </div>

              <h1 className="text-3xl md:text-5xl xl:text-6xl font-extrabold leading-tight drop-shadow-sm">
                مرحباً بك في منصة Team Nursopedia
              </h1>
              <p className="mt-4 text-white text-base md:text-lg max-w-2xl mx-auto lg:mx-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                تعلّم، تدرب، وتابع تقدمك مع دروس وامتحانات تفاعلية، ودعم مستمر من نخبة المتخصصين.
              </p>

              <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link to="/login" className="inline-flex items-center justify-center px-6 py-3 rounded-lg btn-primary shadow-lg shadow-black/30 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary transition">
                  ابدأ الآن
                  <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                </Link>
                <Link to="/register" className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-white/40 bg-white/40 hover:bg-white/50 supports-[backdrop-filter]:bg-white/20 supports-[backdrop-filter]:hover:bg-white/30 supports-[backdrop-filter]:backdrop-blur text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/70 transition">
                  إنشاء حساب
                </Link>
              </div>

              {/* نقاط سريعة */}
              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <QuickPill icon={<BookOpen className="w-4 h-4" />} text="محتوى مرتب" />
                <QuickPill icon={<BadgeCheck className="w-4 h-4" />} text="تقييم فوري" />
                <QuickPill icon={<Timer className="w-4 h-4" />} text="مرونة الوقت" />
                <QuickPill icon={<Shield className="w-4 h-4" />} text="أمان وموثوقية" />
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <HeroCard />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <SectionShell translucent>
          <div className="nurso-container py-12">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">مميزات المنصة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 nurso-stagger [--card-bg:theme(colors.white/15)] [--card-border:theme(colors.white/25)]">
              <Feature icon={<BookOpen className="w-6 h-6 text-primary" />} title="محتوى منظم">
                وحدات ودروس مرتبة وفق خطة دراسية واضحة.
              </Feature>
              <Feature icon={<BadgeCheck className="w-6 h-6 text-primary" />} title="تقييم فوري">
                اختبارات قصيرة بنتائج فورية لقياس تقدمك.
              </Feature>
              <Feature icon={<Timer className="w-6 h-6 text-primary" />} title="مرونة الوقت">
                ادرس في أي وقت ومن أي مكان.
              </Feature>
              <Feature icon={<Shield className="w-6 h-6 text-primary" />} title="موثوقية وأمان">
                بياناتك محمية وتجربتك مستقرة.
              </Feature>
            </div>
          </div>
        </SectionShell>

        {/* Testimonials Section */}
        <section className="nurso-container py-14">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 drop-shadow">آراء طلابنا</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 nurso-stagger">
            <Testimonial name="سارة محمد" grade="سنة أولى تمريض">
              المنصة ساعدتني أرتب مذاكرتي وأفهم الدروس بسهولة مع أمثلة واضحة.
            </Testimonial>
            <Testimonial name="أحمد علي" grade="سنة ثانية تمريض">
              الامتحانات القصيرة والتقييم الفوري خلوني أعرف نقاط ضعفي بسرعة.
            </Testimonial>
            <Testimonial name="ليان خالد" grade="سنة ثالثة تمريض">
              المحتوى مرتب والدعم ممتاز. تجربة رائعة أنصح بها.
            </Testimonial>
          </div>
        </section>

        {/* Stats Section */}
        <SectionShell translucent>
          <div className="nurso-container py-14">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">المنصة في الأرقام</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center nurso-stagger">
              <Stat number="+5k" label="طالب مسجّل" />
              <Stat number="+250" label="درس تفاعلي" />
              <Stat number="+120" label="امتحان ومراجعة" />
              <Stat number="98%" label="نسبة الرضا" />
            </div>
          </div>
        </SectionShell>

        {/* CTA Section */}
        <section className="nurso-container py-16 text-center">
          <div className="mx-auto max-w-3xl p-8 rounded-2xl bg-primary/90 text-white shadow-xl">
            <h3 className="text-2xl md:text-3xl font-semibold mb-3">ابدأ رحلتك الآن</h3>
            <p className="text-white/90 mb-6">
              سجّل حسابًا مجانيًا وجرب دروسًا مختارة قبل الاشتراك الكامل.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link to="/register" className="px-6 py-3 rounded-lg bg-white text-primary font-semibold hover:opacity-90 transition">إنشاء حساب</Link>
              <Link to="/login" className="px-6 py-3 rounded-lg border border-white/60">عندي حساب بالفعل</Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function SectionShell({ children, translucent = false }){
  return (
    <section className={translucent ? 'bg-white/40 border-y border-white/10 supports-[backdrop-filter]:bg-white/10 supports-[backdrop-filter]:backdrop-blur supports-[-webkit-backdrop-filter]:bg-white/10 supports-[-webkit-backdrop-filter]:backdrop-blur supports-glass' : ''}>
      {children}
    </section>
  )
}

function QuickPill({ icon, text }){
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 border border-white/20 backdrop-blur text-white/95">
      {icon}
      <span>{text}</span>
    </div>
  )
}

function HeroCard(){
  return (
    <div className="relative w-full max-w-sm">
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-primary/40 via-white/20 to-transparent blur-xl" />
      <div className="relative rounded-2xl p-6 bg-white/40 supports-[backdrop-filter]:bg-white/15 supports-[backdrop-filter]:backdrop-blur border border-white/25 shadow-2xl">
        <div className="flex justify-center mb-6">
          <img src={logo} alt="شعار Team Nursopedia" className="w-28 h-28 rounded-full object-cover shadow" />
        </div>
        <p className="text-sm text-white/90 leading-7 text-center">
          محتوى دراسي متكامل، اختبارات تفاعلية، ومتابعة تقدمك خطوة بخطوة.
        </p>
      </div>
    </div>
  )
}

function Feature({ icon, title, children }){
  return (
    <div className="p-5 rounded-xl bg-[--card-bg] border border-[--card-border] shadow hover:translate-y-[-2px] hover:shadow-lg transition-transform supports-[backdrop-filter]:backdrop-blur">
      <div className="flex items-center gap-2 mb-2 text-white">
        {icon}
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="text-sm text-white/90">{children}</p>
    </div>
  )
}

function Testimonial({ name, grade, children }){
  return (
    <div className="p-6 rounded-xl bg-white/12 backdrop-blur border border-white/20 shadow hover:shadow-lg transition-shadow animate-fade-up">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-semibold text-white">{name}</p>
          <p className="text-xs text-white/70">{grade}</p>
        </div>
        <div className="flex text-yellow-400">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
      </div>
      <p className="text-sm text-white/90 leading-7">{children}</p>
    </div>
  )
}

function Stat({ number, label }){
  return (
    <div className="p-6 rounded-xl bg-white/12 backdrop-blur border border-white/20 shadow">
      <div className="text-3xl font-extrabold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent mb-1">{number}</div>
      <div className="text-sm text-white/80">{label}</div>
    </div>
  )
}