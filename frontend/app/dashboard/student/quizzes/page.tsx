'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { Quiz } from '@/lib/types';
import { getQuizzes, getStudentProgress } from '@/lib/api';
import Link from 'next/link';

export default function QuizzesPage() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadQuizzes();
      loadAttempts();
    }
  }, [user]);

  const loadQuizzes = async () => {
    try {
      const quizzesData = await getQuizzes();
      if (quizzesData) {
        setQuizzes(quizzesData);
      }
    } catch (error) {
      console.error('Error loading quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAttempts = async () => {
    try {
      const progress = await getStudentProgress();
      if (progress) {
        // Map quiz attempts from progress
        const attemptsMap: Record<string, any> = {};
        progress.forEach((item: any) => {
          if (item.quiz_id && item.quiz_attempt) {
            attemptsMap[item.quiz_id] = item.quiz_attempt;
          }
        });
        setAttempts(attemptsMap);
      }
    } catch (error) {
      console.error('Error loading attempts:', error);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Quizzes</h1>
            <Link
              href="/dashboard/student"
              className="text-green-600 hover:text-green-700 font-medium"
            >
              ← Back to Dashboard
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto"></div>
            </div>
          ) : quizzes.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500 text-lg">No quizzes available yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quizzes.map((quiz) => {
                const attempt = attempts[quiz.id];
                const hasAttempt = attempt && attempt.status === 'completed';
                return (
                  <div key={quiz.id || quiz._id} className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{quiz.title}</h3>
                    {quiz.description && (
                      <p className="text-gray-600 text-sm mb-4">{quiz.description}</p>
                    )}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-500">Total Marks: {quiz.total_marks}</span>
                      {quiz.time_limit && (
                        <span className="text-sm text-gray-500">Time: {quiz.time_limit} min</span>
                      )}
                    </div>
                    {hasAttempt && (
                      <div className="mb-4 p-3 bg-blue-50 rounded">
                        <p className="text-sm text-blue-800">
                          Best Score: {attempt.score}/{attempt.total_marks} ({attempt.percentage}%)
                        </p>
                      </div>
                    )}
                    <Link
                      href={`/dashboard/student/quizzes/${quiz.id || quiz._id}`}
                      className="block text-center bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      {hasAttempt ? 'Retake Quiz' : 'Take Quiz'}
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
