from flask import Blueprint, jsonify, request, current_app
from flask_cors import cross_origin
from datetime import datetime
import jwt
from src.models.user import User, db, ActiveSubscription, Subject, ExamAttempt, LessonProgress, Notification

user_bp = Blueprint('user', __name__)

# Helper to verify token

def verify_token(token):
    try:
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

# Decorator to require auth

def require_auth(f):
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'success': False, 'message': 'رمز المصادقة مطلوب'}), 401
        if token.startswith('Bearer '):
            token = token[7:]
        user_id = verify_token(token)
        if not user_id:
            return jsonify({'success': False, 'message': 'رمز المصادقة غير صالح'}), 401
        user = User.query.get(user_id)
        if not user or not user.is_active:
            return jsonify({'success': False, 'message': 'المستخدم غير موجود أو غير مفعل'}), 401
        request.current_user = user
        return f(*args, **kwargs)
    decorated.__name__ = f.__name__
    return decorated

@user_bp.route('/users', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

# Student profile
@user_bp.route('/me/profile', methods=['GET'])
@cross_origin()
@require_auth
def get_my_profile():
    user = request.current_user

    # Basic info
    basic = user.to_dict()

    # Active year and subjects via subscriptions
    active_subs = ActiveSubscription.query.filter_by(user_id=user.id, is_active=True).all()
    subject_ids = [s.subject_id for s in active_subs]
    subjects = Subject.query.filter(Subject.id.in_(subject_ids)).all() if subject_ids else []

    # Exam stats
    attempts = ExamAttempt.query.filter_by(user_id=user.id).all()
    total_exams = len(attempts)
    passed = [a for a in attempts if a.is_passed]
    last_result = attempts[-1].to_dict() if attempts else None
    overall_percentage = round(sum(float(a.percentage) for a in attempts if a.percentage) / len([a for a in attempts if a.percentage]) , 2) if attempts else 0

    # Per subject progress
    per_subject = []
    for s in subjects:
        # Get lesson ids for this subject
        from src.models.user import Lesson
        lesson_ids = [l.id for l in Lesson.query.filter_by(subject_id=s.id).all()]
        # Progress for this user in those lessons
        lessons_progress = LessonProgress.query.filter(
            LessonProgress.user_id == user.id,
            LessonProgress.lesson_id.in_(lesson_ids) if lesson_ids else False
        ).all() if lesson_ids else []
        completed_count = sum(1 for lp in lessons_progress if getattr(lp, 'is_completed', False))
        # Exam attempts for this subject
        subject_attempts = [a for a in attempts if a.exam and a.exam.lesson and a.exam.lesson.subject_id == s.id]
        exams_attempted = len(subject_attempts)
        subject_passed = [a for a in subject_attempts if getattr(a, 'is_passed', False)]
        success_percentage = round((len(subject_passed) / exams_attempted) * 100, 2) if exams_attempted else 0
        per_subject.append({
            'subject': s.to_dict(),
            'lessons_completed': completed_count,
            'exams_attempted': exams_attempted,
            'success_percentage': success_percentage,
        })

    return jsonify({
        'success': True,
        'profile': {
            'basic': basic,
            'academic_year': subjects[0].academic_year_id if subjects else None,
            'subjects': [s.to_dict() for s in subjects],
            'stats': {
                'exams_taken': total_exams,
                'overall_success_percentage': overall_percentage,
                'last_result': last_result,
            },
            'per_subject': per_subject
        }
    }), 200

# Notifications
@user_bp.route('/me/notifications', methods=['GET'])
@cross_origin()
@require_auth
def my_notifications():
    user = request.current_user
    notes = Notification.query.filter_by(user_id=user.id).order_by(Notification.created_at.desc()).all()
    return jsonify({'success': True, 'notifications': [n.to_dict() for n in notes]})

@user_bp.route('/me/notifications/<int:note_id>/read', methods=['POST'])
@cross_origin()
@require_auth
def mark_notification_read(note_id):
    user = request.current_user
    note = Notification.query.filter_by(id=note_id, user_id=user.id).first()
    if not note:
        return jsonify({'success': False, 'message': 'الإشعار غير موجود'}), 404
    note.is_read = True
    db.session.commit()
    return jsonify({'success': True, 'notification': note.to_dict()})

@user_bp.route('/me/notifications/<int:note_id>/unread', methods=['POST'])
@cross_origin()
@require_auth
def mark_notification_unread(note_id):
    user = request.current_user
    note = Notification.query.filter_by(id=note_id, user_id=user.id).first()
    if not note:
        return jsonify({'success': False, 'message': 'الإشعار غير موجود'}), 404
    note.is_read = False
    db.session.commit()
    return jsonify({'success': True, 'notification': note.to_dict()})

@user_bp.route('/me/notifications/read-all', methods=['POST'])
@cross_origin()
@require_auth
def mark_all_notifications_read():
    user = request.current_user
    Notification.query.filter_by(user_id=user.id, is_read=False).update({'is_read': True})
    db.session.commit()
    count = Notification.query.filter_by(user_id=user.id, is_read=False).count()
    return jsonify({'success': True, 'unread_count': count})

@user_bp.route('/me/notifications/<int:note_id>', methods=['DELETE'])
@cross_origin()
@require_auth
def delete_notification(note_id):
    user = request.current_user
    note = Notification.query.filter_by(id=note_id, user_id=user.id).first()
    if not note:
        return jsonify({'success': False, 'message': 'الإشعار غير موجود'}), 404
    db.session.delete(note)
    db.session.commit()
    return jsonify({'success': True})

@user_bp.route('/me/notifications', methods=['DELETE'])
@cross_origin()
@require_auth
def delete_all_notifications():
    user = request.current_user
    Notification.query.filter_by(user_id=user.id).delete()
    db.session.commit()
    return jsonify({'success': True})

@user_bp.route('/me/notifications/unread-count', methods=['GET'])
@cross_origin()
@require_auth
def unread_notifications_count():
    user = request.current_user
    count = Notification.query.filter_by(user_id=user.id, is_read=False).count()
    return jsonify({'success': True, 'count': count})

@user_bp.route('/users', methods=['POST'])
def create_user():
    
    data = request.json
    user = User(username=data['username'], email=data['email'])
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201

@user_bp.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())

@user_bp.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.json
    user.username = data.get('username', user.username)
    user.email = data.get('email', user.email)
    db.session.commit()
    return jsonify(user.to_dict())

@user_bp.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return '', 204
