import { Facebook, Instagram, Youtube, MessageCircle, Mail } from 'lucide-react'
import { useLocation } from 'react-router-dom'

export default function Footer(){
  const location = useLocation()
  const isHome = location.pathname === '/'
  return (
    <footer
      className={[
        'w-full mt-16 border-t backdrop-blur shadow-inner',
        isHome
          ? 'border-white/10 bg-white/10 text-white'
          : 'border-black/5 dark:border-white/10 bg-white dark:bg-gray-950 text-gray-900 dark:text-white'
      ].join(' ')}
      dir="rtl"
    >
      <div className="nurso-container py-10 grid gap-8 md:grid-cols-3">
        {/* Brand and description */}
        <div>
          <h3 className="text-xl font-bold mb-2">Team Nursopedia</h3>
          <p className={["text-sm leading-7", isHome ? "text-white/80" : "text-gray-600 dark:text-gray-300"].join(' ')}>
            منصة تعليمية تفاعلية لطلاب التمريض مع محتوى منظم، اختبارات فورية، ودعم مستمر.
          </p>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <FooterLink href="/" isHome={isHome}>الصفحة الرئيسية</FooterLink>
            <FooterLink href="/login" isHome={isHome}>تسجيل الدخول</FooterLink>
            <FooterLink href="/register" isHome={isHome}>إنشاء حساب</FooterLink>
          </div>
          <div className="space-y-2">
            <FooterLink href="/dashboard" isHome={isHome}>لوحة الطالب</FooterLink>
            <FooterLink href="/profile" isHome={isHome}>الملف الشخصي</FooterLink>
            <FooterLink href="/notifications" isHome={isHome}>الإشعارات</FooterLink>
          </div>
        </div>

        {/* Socials */}
        <div className="space-y-3">
          <p className={["text-sm", isHome ? "text-white/90" : "text-gray-700 dark:text-gray-200"].join(' ')}>تواصل معنا</p>
          <div className="flex items-center gap-3">
            <SocialBtn label="Facebook" href="https://www.facebook.com/share/g/1CqSrWw3Mg/?mibextid=wwXIfr" isHome={isHome}><Facebook className="w-5 h-5" /></SocialBtn>

            <SocialBtn label="YouTube" href="https://www.youtube.com/@Teamnursopedia" isHome={isHome}><Youtube className="w-5 h-5" /></SocialBtn>
            <SocialBtn label="WhatsApp" href="http://wa.me/201555683276" isHome={isHome}><MessageCircle className="w-5 h-5" /></SocialBtn>
            <SocialBtn label="Email" href="mailto:Ismailgomaa826@gmail.com" isHome={isHome}><Mail className="w-5 h-5" /></SocialBtn>
          </div>
        </div>
      </div>

      <div className={isHome ? "border-t border-white/10" : "border-t border-black/10 dark:border-white/10"}>
        <div className={[
          "nurso-container py-4 text-xs flex flex-col md:flex-row items-center justify-between gap-2",
          isHome ? "text-white/70" : "text-gray-600 dark:text-gray-300"
        ].join(' ')}>
          <p>© {new Date().getFullYear()} Team Nursopedia. جميع الحقوق محفوظة.</p>
          <p>مبني بحب من أجل طلاب التمريض.</p>
        </div>
      </div>
    </footer>
  )
}

function FooterLink({ href, children, isHome }){
  return (
    <a
      href={href}
      className={[
        'block transition-colors',
        isHome ? 'text-white/80 hover:text-white' : 'text-gray-700 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white'
      ].join(' ')}
    >
      {children}
    </a>
  )
}

function SocialBtn({ href, label, children, isHome }){
  return (
    <a
      href={href}
      aria-label={label}
      title={label}
      target="_blank"
      rel="noopener noreferrer"
      className={[
        'p-2 rounded-full transition-colors border',
        isHome
          ? 'bg-white/10 border-white/20 hover:bg-white/20 text-white'
          : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 text-black dark:text-white'
      ].join(' ')}
    >
      {children}
    </a>
  )
}