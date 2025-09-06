from flask import Blueprint, jsonify, request, current_app
from flask_cors import cross_origin
from src.models.user import (
    db, User, Subject, Lesson, Exam, Question, Answer, 
    LessonProgress, ExamAttempt, ActiveSubscription
)
from datetime import datetime
import jwt
import os
from werkzeug.utils import secure_filename

content_bp = Blueprint('content', __name__)

# Helper function to verify JWT token
def verify_token(token):
    try:
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

# Decorator to require authentication
def require_auth(f):
    def decorated_function(*args, **kwargs):
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
    
    decorated_function.__name__ = f.__name__
    return decorated_function

# Check if user has access to subject
def has_subject_access(user_id, subject_id):
    """Check if user has active subscription for the subject"""
    subscription = ActiveSubscription.query.filter_by(
        user_id=user_id,
        subject_id=subject_id,
        is_active=True
    ).first()
    return subscription is not None

@content_bp.route('/subjects', methods=['GET'])
@cross_origin()
@require_auth
def get_user_subjects():
    """Get subjects that the user has access to"""
    try:
        user = request.current_user
        
        # Get active subscriptions for the user
        subscriptions = ActiveSubscription.query.filter_by(
            user_id=user.id,
            is_active=True
        ).all()
        
        subjects = []
        for subscription in subscriptions:
            subject = Subject.query.get(subscription.subject_id)
            if subject and subject.is_active:
                subject_data = subject.to_dict()
                subject_data['subscription_date'] = subscription.created_at.isoformat()
                subjects.append(subject_data)
        
        return jsonify({
            'success': True,
            'subjects': subjects
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'حدث خطأ في الخادم'
        }), 500

@content_bp.route('/subjects/<int:subject_id>/lessons', methods=['GET'])
@cross_origin()
@require_auth
def get_subject_lessons(subject_id):
    """Get lessons for a specific subject"""
    try:
        user = request.current_user
        
        # Check if user has access to this subject
        if not has_subject_access(user.id, subject_id):
            return jsonify({
                'success': False,
                'message': 'ليس لديك صلاحية للوصول إلى هذه المادة'
            }), 403
        
        lessons = Lesson.query.filter_by(
            subject_id=subject_id,
            is_active=True
        ).order_by(Lesson.lesson_order.asc()).all()
        
        lessons_data = []
        for lesson in lessons:
            lesson_data = lesson.to_dict()
            
            # Get user progress for this lesson
            progress = LessonProgress.query.filter_by(
                user_id=user.id,
                lesson_id=lesson.id
            ).first()
            
            lesson_data['progress'] = {
                'completed': progress.is_completed if progress else False,
                'watch_time': progress.watch_time_seconds if progress else 0,
                'last_watched': progress.last_accessed_at.isoformat() if progress and progress.last_accessed_at else None
            }
            
            lessons_data.append(lesson_data)
        
        return jsonify({
            'success': True,
            'lessons': lessons_data
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'حدث خطأ في الخادم'
        }), 500

@content_bp.route('/lessons/<int:lesson_id>', methods=['GET'])
@cross_origin()
@require_auth
def get_lesson_details(lesson_id):
    """Get detailed information about a specific lesson"""
    try:
        user = request.current_user
        
        lesson = Lesson.query.get_or_404(lesson_id)
        
        # Check if user has access to this lesson's subject
        if not has_subject_access(user.id, lesson.subject_id):
            return jsonify({
                'success': False,
                'message': 'ليس لديك صلاحية للوصول إلى هذا الدرس'
            }), 403
        
        lesson_data = lesson.to_dict()
        
        # Include exams for this lesson
        exams = Exam.query.filter_by(lesson_id=lesson.id, is_active=True).order_by(Exam.created_at.desc()).all()
        lesson_data['exams'] = [e.to_dict() for e in exams]
        
        # Get or create progress record
        progress = LessonProgress.query.filter_by(
            user_id=user.id,
            lesson_id=lesson.id
        ).first()
        
        if not progress:
            progress = LessonProgress(
                user_id=user.id,
                lesson_id=lesson.id,
                watch_time_seconds=0,
                is_completed=False
            )
            db.session.add(progress)
            db.session.commit()
        
        lesson_data['progress'] = {
            'completed': progress.is_completed,
            'watch_time': progress.watch_time_seconds,
            'last_watched': progress.last_accessed_at.isoformat() if progress.last_accessed_at else None
        }
        
        return jsonify({
            'success': True,
            'lesson': lesson_data
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'حدث خطأ في الخادم'
        }), 500

@content_bp.route('/lessons/<int:lesson_id>/progress', methods=['POST'])
@cross_origin()
@require_auth
def update_lesson_progress(lesson_id):
    """Update user's progress for a lesson"""
    try:
        user = request.current_user
        data = request.get_json()
        
        lesson = Lesson.query.get_or_404(lesson_id)
        
        # Check if user has access to this lesson's subject
        if not has_subject_access(user.id, lesson.subject_id):
            return jsonify({
                'success': False,
                'message': 'ليس لديك صلاحية للوصول إلى هذا الدرس'
            }), 403
        
        # Get or create progress record
        progress = LessonProgress.query.filter_by(
            user_id=user.id,
            lesson_id=lesson.id
        ).first()
        
        if not progress:
            progress = LessonProgress(
                user_id=user.id,
                lesson_id=lesson.id
            )
            db.session.add(progress)
        
        # Update progress
        if 'watch_time' in data:
            progress.watch_time_seconds = data['watch_time']
        
        if 'completed' in data:
            progress.is_completed = data['completed']
        
        progress.last_accessed_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'تم تحديث التقدم بنجاح'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'حدث خطأ في الخادم'
        }), 500

@content_bp.route('/subjects/<int:subject_id>/exams', methods=['GET'])
@cross_origin()
@require_auth
def get_subject_exams(subject_id):
    """Get exams for a specific subject"""
    try:
        user = request.current_user
        
        # Check if user has access to this subject
        if not has_subject_access(user.id, subject_id):
            return jsonify({
                'success': False,
                'message': 'ليس لديك صلاحية للوصول إلى هذه المادة'
            }), 403
        
        # Exams are linked to lessons; join through Lesson to filter by subject
        exams = (
            db.session.query(Exam)
            .join(Lesson, Exam.lesson_id == Lesson.id)
            .filter(Lesson.subject_id == subject_id, Exam.is_active == True)
            .order_by(Exam.created_at.desc())
            .all()
        )
        
        exams_data = []
        for exam in exams:
            exam_data = exam.to_dict()
            
            # Get user's attempts for this exam
            attempts = ExamAttempt.query.filter_by(
                user_id=user.id,
                exam_id=exam.id
            ).order_by(ExamAttempt.created_at.desc()).all()
            
            exam_data['attempts_count'] = len(attempts)
            # Only the first attempt's score counts
            first_attempt = None
            for a in reversed(attempts):
                if getattr(a, 'attempt_number', None) == 1:
                    first_attempt = a
                    break
            exam_data['best_score'] = float(first_attempt.score) if first_attempt and first_attempt.score is not None else None
            exam_data['remaining_attempts'] = None
            exam_data['last_attempt'] = attempts[0].created_at.isoformat() if attempts else None
            
            exams_data.append(exam_data)
        
        return jsonify({
            'success': True,
            'exams': exams_data
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'حدث خطأ في الخادم'
        }), 500

@content_bp.route('/exams/<int:exam_id>', methods=['GET'])
@cross_origin()
@require_auth
def get_exam_details(exam_id):
    """Get exam details and questions"""
    try:
        user = request.current_user
        
        exam = Exam.query.get_or_404(exam_id)
        
        # Check if user has access to this exam's subject via its lesson
        lesson = Lesson.query.get(exam.lesson_id)
        subject_id = lesson.subject_id if lesson else None
        if not subject_id or not has_subject_access(user.id, subject_id):
            return jsonify({
                'success': False,
                'message': 'ليس لديك صلاحية للوصول إلى هذا الامتحان'
            }), 403
        
        # Unlimited attempts: don't block fetching details by attempts
        attempts = ExamAttempt.query.filter_by(
            user_id=user.id,
            exam_id=exam.id
        ).count()
        
        exam_data = exam.to_dict()
        
        # Get questions (without correct answers)
        questions = Question.query.filter_by(
            exam_id=exam.id,
            is_active=True
        ).order_by(Question.order.asc()).all()
        
        questions_data = []
        for question in questions:
            question_data = {
                'id': question.id,
                'question_text': question.question_text,
                'question_type': question.question_type,
                'order': question.order
            }
            
            # Get answers (without marking which is correct)
            answers = Answer.query.filter_by(
                question_id=question.id,
                is_active=True
            ).order_by(Answer.order.asc()).all()
            
            question_data['answers'] = [
                {
                    'id': answer.id,
                    'answer_text': answer.answer_text,
                    'order': answer.order
                }
                for answer in answers
            ]
            
            questions_data.append(question_data)
        
        exam_data['questions'] = questions_data
        # Unlimited attempts; expose first attempt score if exists
        exam_data['remaining_attempts'] = None
        
        return jsonify({
            'success': True,
            'exam': exam_data
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'حدث خطأ في الخادم'
        }), 500

@content_bp.route('/exams/<int:exam_id>/submit', methods=['POST'])
@cross_origin()
@require_auth
def submit_exam(exam_id):
    """Submit exam answers and calculate score"""
    try:
        user = request.current_user
        data = request.get_json()
        
        exam = Exam.query.get_or_404(exam_id)
        
        # Check if user has access to this exam's subject via its lesson
        lesson = Lesson.query.get(exam.lesson_id)
        subject_id = lesson.subject_id if lesson else None
        if not subject_id or not has_subject_access(user.id, subject_id):
            return jsonify({
                'success': False,
                'message': 'ليس لديك صلاحية للوصول إلى هذا الامتحان'
            }), 403
        
        # Unlimited attempts: don't block submissions; only first attempt will count for grade
        attempts = ExamAttempt.query.filter_by(
            user_id=user.id,
            exam_id=exam.id
        ).count()
        
        # Validate answers format
        if not data or 'answers' not in data:
            return jsonify({
                'success': False,
                'message': 'إجابات غير صالحة'
            }), 400
        
        user_answers = data['answers']  # Expected format: {question_id: answer_id}
        
        # Get all questions for this exam
        questions = Question.query.filter_by(
            exam_id=exam.id,
            is_active=True
        ).all()
        
        total_questions = len(questions)
        correct_answers = 0
        
        # Calculate score
        for question in questions:
            question_id = str(question.id)
            if question_id in user_answers:
                user_answer_id = user_answers[question_id]
                
                # Check if the answer is correct
                correct_answer = Answer.query.filter_by(
                    question_id=question.id,
                    id=user_answer_id,
                    is_correct=True,
                    is_active=True
                ).first()
                
                if correct_answer:
                    correct_answers += 1
        
        # Calculate percentage score
        score = (correct_answers / total_questions) * 100 if total_questions > 0 else 0
        
        # Save only the first attempt; subsequent attempts are not recorded
        attempt_number = ExamAttempt.query.filter_by(user_id=user.id, exam_id=exam.id).count() + 1
        if attempt_number == 1:
            attempt = ExamAttempt(
                user_id=user.id,
                exam_id=exam.id,
                attempt_number=attempt_number,
                start_time=datetime.utcnow(),
                end_time=datetime.utcnow(),
                score=score,
                total_points=100,
                percentage=score,
                is_passed=score >= float(exam.passing_score),
                is_completed=True,
                time_taken_seconds=None
            )
            db.session.add(attempt)
            db.session.commit()
        
        # Determine grade to count: only first attempt
        first_attempt = ExamAttempt.query.filter_by(user_id=user.id, exam_id=exam.id, attempt_number=1).first()
        counted_score = float(first_attempt.score) if first_attempt and first_attempt.score is not None else float(score)
        
        return jsonify({
            'success': True,
            'message': 'تم تسليم الامتحان بنجاح',
            'score': float(score),
            'counted_score': counted_score,
            'counted': attempt_number == 1,
            'correct_answers': correct_answers,
            'total_questions': total_questions,
            'passed': float(score) >= float(exam.passing_score)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'حدث خطأ في الخادم'
        }), 500

@content_bp.route('/exams/<int:exam_id>/attempts', methods=['GET'])
@cross_origin()
@require_auth
def get_exam_attempts(exam_id):
    """Get user's attempts for a specific exam"""
    try:
        user = request.current_user
        
        exam = Exam.query.get_or_404(exam_id)
        
        # Check if user has access to this exam's subject
        if not has_subject_access(user.id, exam.subject_id):
            return jsonify({
                'success': False,
                'message': 'ليس لديك صلاحية للوصول إلى هذا الامتحان'
            }), 403
        
        attempts = ExamAttempt.query.filter_by(
            user_id=user.id,
            exam_id=exam.id
        ).order_by(ExamAttempt.start_time.desc()).all()
        
        attempts_data = [
            {
                'id': attempt.id,
                'score': attempt.score,
                'completed_at': attempt.completed_at.isoformat(),
                'passed': attempt.score >= exam.passing_score
            }
            for attempt in attempts
        ]
        
        return jsonify({
            'success': True,
            'attempts': attempts_data,
            'exam_title': exam.title,
            'passing_score': exam.passing_score
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'حدث خطأ في الخادم'
        }), 500

