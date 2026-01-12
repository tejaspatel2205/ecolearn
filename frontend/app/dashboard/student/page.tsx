'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { StudentStats, Lesson, Quiz, Challenge } from '@/lib/types';
import { getStudentStats, getLessons, getQuizzes, getChallenges } from '@/lib/api';
import { TrendingUp, BookOpen, Trophy, Target, Award, BarChart3 } from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      // Load student stats
      const statsData = await getStudentStats();
      if (statsData) setStats(statsData);

      // Load lessons (API will filter by enrolled classes)
      const lessonsData = await getLessons();
      if (lessonsData) setLessons(lessonsData.slice(0, 5));

      // Load quizzes
      const quizzesData = await getQuizzes();
      if (quizzesData) setQuizzes(quizzesData.slice(0, 5));

      // Load challenges
      const challengesData = await getChallenges();
      if (challengesData) setChallenges(challengesData.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
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

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Welcome, {user?.full_name}! 👋
          </h1>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Points</p>
                  <p className="text-3xl font-bold text-green-600">{stats?.total_points || 0}</p>
                </div>
                <Trophy className="w-12 h-12 text-yellow-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Current Level</p>
                  <p className="text-3xl font-bold text-blue-600">{stats?.current_level || 1}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Lessons Completed</p>
                  <p className="text-3xl font-bold text-purple-600">{stats?.lessons_completed || 0}</p>
                </div>
                <BookOpen className="w-12 h-12 text-purple-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Eco Impact Score</p>
                  <p className="text-3xl font-bold text-green-600">{stats?.eco_impact_score || 0}</p>
                </div>
                <Target className="w-12 h-12 text-green-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Lessons */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Recent Lessons
                </h2>
                <a href="/dashboard/student/lessons" className="text-green-600 hover:text-green-700 text-sm">
                  View All
                </a>
              </div>
              {lessons.length === 0 ? (
                <p className="text-gray-500">No lessons available yet</p>
              ) : (
                <div className="space-y-4">
                  {lessons.map((lesson) => (
                    <div key={`lesson-${lesson.id || lesson._id}`} className="border-l-4 border-green-500 pl-4 py-2">
                      <h3 className="font-semibold text-gray-900">{lesson.title}</h3>
                      <p className="text-sm text-gray-600">{lesson.topic}</p>
                      <a
                        href={`/dashboard/student/lessons/${lesson.id || lesson._id}`}
                        className="text-green-600 hover:text-green-700 text-sm mt-2 inline-block"
                      >
                        View Lesson →
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Available Quizzes */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Available Quizzes
                </h2>
                <a href="/dashboard/student/quizzes" className="text-green-600 hover:text-green-700 text-sm">
                  View All
                </a>
              </div>
              {quizzes.length === 0 ? (
                <p className="text-gray-500">No quizzes available yet</p>
              ) : (
                <div className="space-y-4">
                  {quizzes.map((quiz) => (
                    <div key={`quiz-${quiz.id || quiz._id}`} className="border-l-4 border-blue-500 pl-4 py-2">
                      <h3 className="font-semibold text-gray-900">{quiz.title}</h3>
                      <p className="text-sm text-gray-600">Total Marks: {quiz.total_marks}</p>
                      <a
                        href={`/dashboard/student/quizzes/${quiz.id || quiz._id}`}
                        className="text-blue-600 hover:text-blue-700 text-sm mt-2 inline-block"
                      >
                        Take Quiz →
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Challenges */}
            <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Eco Challenges
                </h2>
                <a href="/dashboard/student/challenges" className="text-green-600 hover:text-green-700 text-sm">
                  View All
                </a>
              </div>
              {challenges.length === 0 ? (
                <p className="text-gray-500">No challenges available yet</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {challenges.map((challenge) => (
                    <div key={`challenge-${challenge.id || challenge._id}`} className="border border-green-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{challenge.title}</h3>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          +{challenge.points_reward} pts
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{challenge.description}</p>
                      <a
                        href={`/dashboard/student/challenges/${challenge.id || challenge._id}`}
                        className="text-green-600 hover:text-green-700 text-sm font-medium"
                      >
                        View Challenge →
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Badges Section */}
          {stats && stats.badges_earned && stats.badges_earned.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mt-8">
              <h2 className="text-xl font-semibold flex items-center mb-4">
                <Award className="w-5 h-5 mr-2" />
                Your Badges
              </h2>
              <div className="flex flex-wrap gap-4">
                {stats.badges_earned.map((badgeId: string, index: number) => (
                  <div key={`badge-${badgeId}-${index}`} className="bg-yellow-100 rounded-full px-4 py-2">
                    <span className="text-yellow-800">🏆 Badge {index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Access */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Link
              href="/dashboard/student/analytics"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow"
            >
              <BarChart3 className="w-8 h-8 text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Performance Analytics</h3>
              <p className="text-gray-600 text-sm">View your performance and get personalized suggestions</p>
            </Link>

            <Link
              href="/dashboard/student/leaderboard"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow"
            >
              <Trophy className="w-8 h-8 text-yellow-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Global Leaderboard</h3>
              <p className="text-gray-600 text-sm">See how you rank against other students worldwide</p>
            </Link>

            <Link
              href="/dashboard/student/challenges"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow"
            >
              <Target className="w-8 h-8 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Eco Challenges</h3>
              <p className="text-gray-600 text-sm">Complete real-world environmental challenges</p>
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

