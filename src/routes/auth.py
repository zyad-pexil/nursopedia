from flask import Blueprint, jsonify, request, current_app
from flask_cors import cross_origin
from src.models.user import User, SubscriptionRequest, AcademicYear, Subject, db
from datetime import datetime, timedelta
import jwt
import os
import uuid
from werkzeug.utils import secure_filename

# Optional captcha verification
try:
    import requests as _requests
except Exception:
    _requests = None

def _verify_captcha(token: str):
    secret = os.getenv('CAPTCHA_SECRET')
    if not secret:
        return True  # captcha not enforced
    if not token:
        return False
    if _requests is None:
        return False
    try:
        r = _requests.post('https://www.google.com/recaptcha/api/siteverify', data={
            'secret': secret,
            'response': token,
        }, timeout=5)
        data = r.json()
        return bool(data.get('success'))
    except Exception:
        return False

auth_bp = Blueprint('auth', __name__)

# Helper function to generate JWT token
def generate_token(user_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(days=7)  # Token expires in 7 days
    }
    return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')

# Helper function to verify JWT token
def verify_token(token):
    try:
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

@auth_bp.route('/login', methods=['POST'])
@cross_origin()
def login():
    """تسجيل الدخول للطلاب والمديرين"""
    try:
        data = request.get_json()
        
        # captcha check (optional)
        if not _verify_captcha(data.get('captcha_token') if data else None):
            return jsonify({'success': False, 'message': 'فشل التحقق من الكابتشا'}), 400
        
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({
                'success': False,
                'message': 'اسم المستخدم وكلمة المرور مطلوبان'
            }), 400
        
        # البحث عن المستخدم
        user = User.query.filter_by(username=data['username']).first()
        
        if not user or not user.check_password(data['password']):
            return jsonify({
                'success': False,
                'message': 'اسم المستخدم أو كلمة المرور غير صحيحة'
            }), 401
        
        if not user.is_active:
            return jsonify({
                'success': False,
                'message': 'حسابك غير مفعل. يرجى انتظار موافقة الإدارة'
            }), 401
        
        # تحديث آخر تسجيل دخول
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # إنشاء رمز المصادقة
        token = generate_token(user.id)
        
        return jsonify({
            'success': True,
            'message': 'تم تسجيل الدخول بنجاح',
            'token': token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'حدث خطأ في الخادم'
        }), 500

@auth_bp.route('/register', methods=['POST'])
@cross_origin()
def register():
    """تسجيل طالب جديد"""
    try:
        data = request.get_json()
        
        # captcha check (optional)
        if not _verify_captcha(data.get('captcha_token') if data else None):
            return jsonify({'success': False, 'message': 'فشل التحقق من الكابتشا'}), 400
        
        # التحقق من البيانات المطلوبة
        required_fields = ['username', 'email', 'password', 'full_name', 'phone_number', 'academic_year_id', 'selected_subjects']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'الحقل {field} مطلوب'
                }), 400
        
        # تحقق من اسم المستخدم فريد وبصيغة مناسبة
        if ' ' in data['username'] or len(data['username']) < 4:
            return jsonify({'success': False, 'message': 'اسم المستخدم يجب ألا يحتوي مسافات وأن يكون 4 أحرف على الأقل'}), 400
        
        # تحقق من رقم الهاتف
        if not str(data['phone_number']).isdigit() or len(str(data['phone_number'])) < 10:
            return jsonify({'success': False, 'message': 'رقم الموبايل غير صالح'}), 400
        
        # التحقق من عدم وجود المستخدم مسبقاً
        if User.query.filter_by(username=data['username']).first():
            return jsonify({
                'success': False,
                'message': 'اسم المستخدم موجود بالفعل'
            }), 400
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({
                'success': False,
                'message': 'البريد الإلكتروني موجود بالفعل'
            }), 400
        
        # سياسة كلمة المرور
        pwd = data['password']
        if len(pwd) < 8 or pwd.isalpha() or pwd.isdigit():
            return jsonify({'success': False, 'message': 'كلمة المرور يجب أن تكون 8 أحرف على الأقل وتحتوي على حروف وأرقام'}), 400
        
        # إنشاء المستخدم الجديد
        user = User(
            username=data['username'],
            email=data['email'],
            full_name=data['full_name'],
            phone_number=data['phone_number'],
            user_type='student',
            is_active=False  # سيتم تفعيله بعد موافقة الأدمن
        )
        user.set_password(pwd)
        
        db.session.add(user)
        db.session.flush()  # للحصول على ID المستخدم
        
        # حساب المبلغ الإجمالي + تطبيق خصم باقة محددة إن انطبقت الشروط
        selected_subject_ids = data['selected_subjects']
        # تأكد من تحويل المعرفات إلى أرقام قبل الاستعلام
        try:
            selected_ids_int = sorted({int(x) for x in selected_subject_ids})
        except Exception:
            selected_ids_int = list({x for x in selected_subject_ids}) if isinstance(selected_subject_ids, list) else []

        subjects = Subject.query.filter(Subject.id.in_(selected_ids_int)).all()
        total_amount = sum(float(subject.price) for subject in subjects)

        # خصم 50 ج فقط عند اختيار 3 مواد تحديداً:
        # - بالمعرفات: [1, 2, 4]
        # - أو بالأسماء نصاً: "أساسيات تمريض (عملي)", "أساسيات تمريض (نظري)", "ميكروبيولوجي"
        discount_applied = False
        try:
            # خصم يُطبق حتى مع مواد إضافية: يكفي أن تحتوي القائمة على 1 و2 و4
            apply_by_ids = all(x in selected_ids_int for x in [1, 2, 4])

            # تطبيع الأسماء العربية للمقارنة
            def _norm_ar(s: str) -> str:
                s = (s or '').strip().lower()
                for ch in ('أ','إ','آ'):
                    s = s.replace(ch, 'ا')
                s = s.replace('ى','ي').replace('ة','ه').replace('ـ','')
                s = ' '.join(s.split())  # إزالة الفراغات الزائدة
                return s

            selected_names_norm = {_norm_ar(getattr(subj, 'name', '')) for subj in subjects}
            target_names_norm = {
                _norm_ar('أساسيات تمريض (عملي)'),
                _norm_ar('أساسيات تمريض (نظري)'),
                _norm_ar('ميكروبيولوجي'),
            }
            # يكفي احتواء التشكيلة على المواد الثلاثة حتى لو وُجدت مواد إضافية
            apply_by_names = target_names_norm.issubset(selected_names_norm)

            if apply_by_ids or apply_by_names:
                total_amount = max(0.0, total_amount - 50.0)
                discount_applied = True
        except Exception:
            pass
        
        # إنشاء طلب الاشتراك
        subscription_request = SubscriptionRequest(
            user_id=user.id,
            academic_year_id=data['academic_year_id'],
            total_amount=total_amount,
            status='pending'
        )
        subscription_request.set_selected_subjects(selected_subject_ids)
        
        db.session.add(subscription_request)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'تم إرسال طلب التسجيل بنجاح. سيتم مراجعته خلال 24 ساعة.',
            'total_amount': total_amount,
            'discount_applied': discount_applied,
            'discount_amount': 50.0 if discount_applied else 0.0,
            'payment_number': '01080938298',
            'user_id': user.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'حدث خطأ في الخادم'
        }), 500

@auth_bp.route('/upload-receipt', methods=['POST'])
@cross_origin()
def upload_receipt():
    """رفع إيصال الدفع"""
    try:
        if 'receipt' not in request.files:
            return jsonify({
                'success': False,
                'message': 'لم يتم رفع أي ملف'
            }), 400
        
        file = request.files['receipt']
        user_id = request.form.get('user_id')
        
        if not user_id:
            return jsonify({
                'success': False,
                'message': 'معرف المستخدم مطلوب'
            }), 400
        
        if file.filename == '':
            return jsonify({
                'success': False,
                'message': 'لم يتم اختيار ملف'
            }), 400
        
        # التحقق من نوع الملف
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'pdf'}
        if not ('.' in file.filename and file.filename.rsplit('.', 1)[1].lower() in allowed_extensions):
            return jsonify({
                'success': False,
                'message': 'نوع الملف غير مدعوم'
            }), 400
        
        # رفع إلى Google Drive إن تم ضبط المفاتيح، وإلا حفظ محلي (معطّل الآن، سيتم الحفظ محليًا دائمًا)
        drive_file_url = None
        if False and os.getenv('GDRIVE_ENABLED') == '1' and os.getenv('GDRIVE_FOLDER_ID') and os.getenv('GDRIVE_SERVICE_ACCOUNT_JSON'):
            try:
                from google.oauth2 import service_account
                from googleapiclient.discovery import build
                from googleapiclient.http import MediaIoBaseUpload
                import io, json

                creds_env = os.getenv('GDRIVE_SERVICE_ACCOUNT_JSON')
                creds_file = os.getenv('GDRIVE_SERVICE_ACCOUNT_FILE')
                creds_info = None
                if creds_file and os.path.exists(creds_file):
                    with open(creds_file, 'r', encoding='utf-8') as cf:
                        creds_info = json.load(cf)
                elif creds_env:
                    creds_info = json.loads(creds_env)
                    # Normalize private key newlines if needed
                    if isinstance(creds_info, dict) and 'private_key' in creds_info:
                        creds_info['private_key'] = creds_info['private_key'].replace('\\n', '\n')
                else:
                    raise RuntimeError('No Google service account credentials provided')

                creds = service_account.Credentials.from_service_account_info(
                    creds_info,
                    scopes=['https://www.googleapis.com/auth/drive.file']
                )
                service = build('drive', 'v3', credentials=creds)

                media = MediaIoBaseUpload(file.stream, mimetype=file.mimetype, resumable=False)
                file_metadata = {
                    'name': secure_filename(f"{user_id}_{uuid.uuid4().hex}_{file.filename}"),
                    'parents': [os.getenv('GDRIVE_FOLDER_ID')]
                }
                created = service.files().create(
                    body=file_metadata,
                    media_body=media,
                    fields='id, webViewLink, webContentLink',
                    supportsAllDrives=True
                ).execute()
                drive_file_url = created.get('webViewLink') or created.get('webContentLink')
            except Exception:
                drive_file_url = None
        
        if not drive_file_url:
            filename = secure_filename(f"{user_id}_{uuid.uuid4().hex}_{file.filename}")
            upload_folder = os.path.join(current_app.root_path, 'static', 'receipts')
            os.makedirs(upload_folder, exist_ok=True)
            file_path = os.path.join(upload_folder, filename)
            file.save(file_path)
            drive_file_url = f"/static/receipts/{filename}"
        
        # تحديث طلب الاشتراك
        subscription_request = SubscriptionRequest.query.filter_by(
            user_id=user_id, 
            status='pending'
        ).first()
        
        if subscription_request:
            subscription_request.payment_receipt_url = drive_file_url
            db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'تم رفع الإيصال بنجاح',
            'file_url': drive_file_url
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'حدث خطأ في رفع الملف'
        }), 500

@auth_bp.route('/forgot-password', methods=['POST'])
@cross_origin()
def forgot_password():
    """طلب استعادة كلمة المرور"""
    try:
        data = request.get_json()
        
        if not data or not data.get('email'):
            return jsonify({
                'success': False,
                'message': 'البريد الإلكتروني مطلوب'
            }), 400
        
        user = User.query.filter_by(email=data['email']).first()
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'البريد الإلكتروني غير موجود'
            }), 404
        
        # إنشاء رمز استعادة كلمة المرور
        reset_token = str(uuid.uuid4())
        user.password_reset_token = reset_token
        user.password_reset_expires = datetime.utcnow() + timedelta(hours=1)
        
        db.session.commit()
        
        # في التطبيق الحقيقي، سيتم إرسال بريد إلكتروني هنا
        # لكن الآن سنعيد الرمز في الاستجابة للاختبار
        
        return jsonify({
            'success': True,
            'message': 'تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني',
            'reset_token': reset_token  # للاختبار فقط
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'حدث خطأ في الخادم'
        }), 500

@auth_bp.route('/reset-password', methods=['POST'])
@cross_origin()
def reset_password():
    """إعادة تعيين كلمة المرور"""
    try:
        data = request.get_json()
        
        required_fields = ['token', 'new_password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'الحقل {field} مطلوب'
                }), 400
        
        user = User.query.filter_by(password_reset_token=data['token']).first()
        
        if not user or not user.password_reset_expires or user.password_reset_expires < datetime.utcnow():
            return jsonify({
                'success': False,
                'message': 'رمز الاستعادة غير صالح أو منتهي الصلاحية'
            }), 400
        
        # تحديث كلمة المرور
        user.set_password(data['new_password'])
        user.password_reset_token = None
        user.password_reset_expires = None
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'تم تغيير كلمة المرور بنجاح'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'حدث خطأ في الخادم'
        }), 500

@auth_bp.route('/verify-token', methods=['POST'])
@cross_origin()
def verify_user_token():
    """التحقق من صحة رمز المصادقة"""
    try:
        data = request.get_json()
        
        if not data or not data.get('token'):
            return jsonify({
                'success': False,
                'message': 'رمز المصادقة مطلوب'
            }), 400
        
        user_id = verify_token(data['token'])
        
        if not user_id:
            return jsonify({
                'success': False,
                'message': 'رمز المصادقة غير صالح'
            }), 401
        
        user = User.query.get(user_id)
        
        if not user or not user.is_active:
            return jsonify({
                'success': False,
                'message': 'المستخدم غير موجود أو غير مفعل'
            }), 401
        
        return jsonify({
            'success': True,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'حدث خطأ في الخادم'
        }), 500

@auth_bp.route('/academic-years', methods=['GET'])
@cross_origin()
def get_academic_years():
    """الحصول على قائمة الفرق الدراسية"""
    try:
        academic_years = AcademicYear.query.filter_by(is_active=True).all()
        return jsonify({
            'success': True,
            'academic_years': [year.to_dict() for year in academic_years]
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'حدث خطأ في الخادم'
        }), 500

@auth_bp.route('/subjects/<int:academic_year_id>', methods=['GET'])
@cross_origin()
def get_subjects_by_year(academic_year_id):
    """الحصول على المواد الدراسية لفرقة معينة"""
    try:
        subjects = Subject.query.filter_by(
            academic_year_id=academic_year_id,
            is_active=True
        ).all()
        
        return jsonify({
            'success': True,
            'subjects': [subject.to_dict() for subject in subjects]
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'حدث خطأ في الخادم'
        }), 500

