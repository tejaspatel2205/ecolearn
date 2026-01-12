'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { Quiz } from '@/lib/types';
import { getQuizzes } from '@/lib/api';
import Link from 'next/link';
import { FileText, Plus, Edit, Trash2, Eye, Users, BarChart3 } from 'lucide-react';

export default function TeacherQuizzes() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === 'teacher') {
      loadQuizzes();
    }
  }, [user]);

  const loadQuizzes = async () => {
    try {
      const data = await getQuizzes();
      // The API now filters by teacher automatically
      setQuizzes(data || []);
    } catch (error) {
      console.error('Error loading quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteQuiz = async (quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return;

    try {
      const { deleteQuiz: apiDeleteQuiz } = await import('@/lib/api');
      await apiDeleteQuiz(quizId);
      setQuizzes(quizzes.filter(q => (q.id || q._id) !== quizId));
    } catch (error) {
      console.error('Error deleting quiz:', error);
      alert('Failed to delete quiz');
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['teacher']}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['teacher']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FileText className="w-8 h-8 mr-3" />
              My Quizzes
            </h1>
            <Link
              href="/dashboard/teacher/quizzes/create"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Quiz
            </Link>
          </div>

          {/* Quizzes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <div key={`quiz-${quiz.id || quiz._id}`} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{quiz.title}</h3>
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-sm text-blue-600">
                        Total Marks: {quiz.total_marks}
                      </span>
                      <span className="text-sm text-green-600">
                        Questions: {quiz.questions?.length || 0}
                      </span>
                    </div>
                    {quiz.class_number && (
                      <p className="text-sm text-purple-600 mb-2">Class: {quiz.class_number}</p>
                    )}
                    <p className="text-sm text-gray-600">{quiz.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/student/quizzes/${quiz.id || quiz._id}`}
                      className="text-green-600 hover:text-green-800"
                      title="Preview Quiz"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/dashboard/teacher/quizzes/${quiz.id || quiz._id}/edit`}
                      className="text-blue-600 hover:text-blue-800"
                      title="Edit Quiz"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => deleteQuiz(quiz.id || quiz._id || '')}
                      className="text-red-600 hover:text-red-800"
                      title="Delete Quiz"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-sm text-gray-500 mb-4 bg-gray-50 p-3 rounded-lg">
                    <div className="text-center">
                      <p className="font-bold text-blue-600">{quiz.stats?.attempts || 0}</p>
                      <p className="text-xs">Attempts</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-green-600">{quiz.stats?.avgScore || 0}%</p>
                      <p className="text-xs">Avg Score</p>
                    </div>
                  </div>

                  <div className="flex gap-2 text-sm">
                    <Link
                      href={`/dashboard/teacher/quizzes/${quiz.id || quiz._id}/analytics`}
                      className="flex-1 bg-blue-50 text-blue-600 py-2 px-3 rounded text-center hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <BarChart3 className="w-4 h-4" />
                      Analytics
                    </Link>
                    <Link
                      href={`/dashboard/teacher/quizzes/${quiz.id || quiz._id}`}
                      className="flex-1 bg-green-50 text-green-600 py-2 px-3 rounded text-center hover:bg-green-100 transition-colors"
                    >
                      Manage
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {quizzes.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No quizzes yet</h3>
              <p className="text-gray-500 mb-4">Create your first quiz to assess student knowledge.</p>
              <Link
                href="/dashboard/teacher/quizzes/create"
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 inline-block"
              >
                Create Your First Quiz
              </Link>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{quizzes.length}</div>
              <div className="text-gray-600">Total Quizzes</div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {quizzes.reduce((sum, quiz) => sum + (quiz.questions?.length || 0), 0)}
              </div>
              <div className="text-gray-600">Total Questions</div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">0</div>
              <div className="text-gray-600">Total Attempts</div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-2">0%</div>
              <div className="text-gray-600">Avg Score</div>
            </div>
          </div>

          {/* Recent Activity */}
          {quizzes.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mt-8">
              <h2 className="text-xl font-semibold mb-4">Recent Quiz Activity</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div>
                    <p className="font-medium text-gray-900">No recent activity</p>
                    <p className="text-sm text-gray-600">Quiz attempts will appear here</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}