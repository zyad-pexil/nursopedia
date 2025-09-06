#!/usr/bin/env python3
"""
One-off script to purge test data while keeping academic content and admin accounts.
- Keeps: AcademicYear, Subject, Lesson, Exam, Questions, Answers (content)
- Keeps: Admin users
- Deletes: Student users and their related data (subscription requests, active subscriptions,
           lesson progress, exam attempts & answers, notifications, activity logs)
- Deletes: Uploaded receipts in static/receipts

Usage:
  python src/purge_test_data.py
"""
import os
import sys
import shutil

# Ensure project root on path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src.main import app
from src.models.user import (
    db, User, SubscriptionRequest, ActiveSubscription, LessonProgress,
    ExamAttempt, ExamAnswer, Notification, ActivityLog
)


def _safe_int(x):
    try:
        return int(x)
    except Exception:
        return None


def purge_receipts():
    static_folder = app.static_folder or os.path.join(app.root_path, 'static')
    receipts_dir = os.path.join(static_folder, 'receipts')
    if os.path.isdir(receipts_dir):
        print(f"- Clearing receipts folder: {receipts_dir}")
        # Remove all files and subfolders
        for name in os.listdir(receipts_dir):
            p = os.path.join(receipts_dir, name)
            try:
                if os.path.isfile(p) or os.path.islink(p):
                    os.unlink(p)
                elif os.path.isdir(p):
                    shutil.rmtree(p)
            except Exception as e:
                print(f"  ! Failed to remove {p}: {e}")
    else:
        print(f"- Receipts folder not found (skipped): {receipts_dir}")


def main():
    with app.app_context():
        print("== Purging test data (students and related records) ==")

        # Collect student IDs
        student_ids = [u.id for u in User.query.filter_by(user_type='student').all()]
        print(f"- Found {len(student_ids)} student user(s)")

        # Purge dependent data first (order matters for FKs)
        # Exam answers -> Exam attempts
        deleted_exam_answers = 0
        deleted_exam_attempts = 0
        if student_ids:
            attempts_q = ExamAttempt.query.filter(ExamAttempt.user_id.in_(student_ids))
            attempt_ids = [a.id for a in attempts_q.all()]
            if attempt_ids:
                deleted_exam_answers = ExamAnswer.query.filter(ExamAnswer.attempt_id.in_(attempt_ids)).delete(synchronize_session=False)
                deleted_exam_attempts = ExamAttempt.query.filter(ExamAttempt.id.in_(attempt_ids)).delete(synchronize_session=False)
        else:
            # No students: still ensure we remove stray attempts if desired;
            # but we keep attempts for admins = there shouldn't be any. Skip.
            pass

        # Lesson progress
        deleted_progress = LessonProgress.query.filter(LessonProgress.user_id.in_(student_ids)).delete(synchronize_session=False) if student_ids else 0

        # Active subscriptions
        deleted_active_subs = ActiveSubscription.query.filter(ActiveSubscription.user_id.in_(student_ids)).delete(synchronize_session=False) if student_ids else 0

        # Notifications
        deleted_notifications = Notification.query.filter(Notification.user_id.in_(student_ids)).delete(synchronize_session=False) if student_ids else 0

        # Activity logs
        deleted_logs = ActivityLog.query.filter(ActivityLog.user_id.in_(student_ids)).delete(synchronize_session=False) if student_ids else 0

        # Subscription requests
        deleted_requests = SubscriptionRequest.query.filter(SubscriptionRequest.user_id.in_(student_ids)).delete(synchronize_session=False) if student_ids else 0

        # Finally delete the students themselves
        deleted_students = User.query.filter(User.user_type == 'student').delete(synchronize_session=False)

        db.session.commit()

        print("-- Summary --")
        print(f"Students: {deleted_students}")
        print(f"SubscriptionRequests: {deleted_requests}")
        print(f"ActiveSubscriptions: {deleted_active_subs}")
        print(f"LessonProgress: {deleted_progress}")
        print(f"ExamAttempts: {deleted_exam_attempts}")
        print(f"ExamAnswers: {deleted_exam_answers}")
        print(f"Notifications: {deleted_notifications}")
        print(f"ActivityLogs: {deleted_logs}")

        # Clear uploaded receipts
        purge_receipts()

        print("== Done. Admin accounts, academic years, subjects, lessons, and exams were kept ==")


if __name__ == "__main__":
    main()