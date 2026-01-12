'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { Lesson } from '@/lib/types';
import { getLesson, markLessonComplete, getStudentProgress } from '@/lib/api';
import Link from 'next/link';

export default function LessonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && params.id) {
      loadLesson();
      checkCompletion();
    }
  }, [user, params.id]);

  const loadLesson = async () => {
    try {
      const lessonData = await getLesson(params.id as string);
      if (lessonData) setLesson(lessonData);
    } catch (error) {
      console.error('Error loading lesson:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkCompletion = async () => {
    try {
      const progress = await getStudentProgress();
      if (progress) {
        const lessonProgress = progress.find((p: any) => p.lesson_id === params.id);
        if (lessonProgress && lessonProgress.completed) {
          setCompleted(true);
        }
      }
    } catch (error) {
      // Not completed yet
    }
  };

  const handleMarkAsComplete = async () => {
    try {
      await markLessonComplete(params.id as string);
      setCompleted(true);
    } catch (error) {
      console.error('Error marking lesson as complete:', error);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['student']}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!lesson) {
    return (
      <ProtectedRoute allowedRoles={['student']}>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="container mx-auto px-4 pt-24 pb-8">
            <p className="text-gray-500">Lesson not found</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-8 max-w-4xl">
          <Link
            href="/dashboard/student/lessons"
            className="text-green-600 hover:text-green-700 font-medium mb-4 inline-block"
          >
            ← Back to Lessons
          </Link>

          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="mb-4">
              <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded">
                {lesson.topic}
              </span>
              {completed && (
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded">
                  ✓ Completed
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">{lesson.title}</h1>
            {lesson.description && (
              <p className="text-gray-600 mb-6">{lesson.description}</p>
            )}

            <div className="prose max-w-none mb-8">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {lesson.content}
              </div>
            </div>

            {!completed && (
              <button
                onClick={handleMarkAsComplete}
                className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Mark as Complete (+10 points)
              </button>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

