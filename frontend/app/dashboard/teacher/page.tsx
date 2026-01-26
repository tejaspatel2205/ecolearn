'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { Class, Lesson, Quiz, Challenge } from '@/lib/types';
import { getClasses, getLessons, getQuizzes, getChallenges, getTeacherStats } from '@/lib/api';
import Link from 'next/link';
import { BookOpen, FileText, Users, BarChart3, Plus, Trophy, Clock } from 'lucide-react';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalLessons: 0,
    totalQuizzes: 0,
    avgQuizScore: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === 'teacher') {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user || user.role !== 'teacher') return;
    try {
      // Load teacher stats (includes classes, students, lessons, quizzes counts)
      const statsData = await getTeacherStats();
      if (statsData) {
        setStats({
          totalStudents: statsData.totalStudents || 0,
          totalLessons: statsData.totalLessons || 0,
          totalQuizzes: statsData.totalQuizzes || 0,
          avgQuizScore: statsData.avgQuizScore || 0,
        });
      }

      // Load classes
      const classesData = await getClasses();
      if (classesData) {
        // Filter classes by current teacher
        const teacherClasses = classesData.filter((c: Class) => c.teacher_id === user!.id);
        setClasses(teacherClasses);
      }

      const filterRecentItems = <T extends { created_at?: string }>(items: T[]) => {
        // Sort by date descending
        const sortedItems = [...items].sort((a, b) =>
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );

        // Calculate cutoff for 3 days ago
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        // Count items created in the last 3 days
        const recentCount = sortedItems.filter(item =>
          new Date(item.created_at || 0) >= threeDaysAgo
        ).length;

        // Show at least 5, or all items from last 3 days if more than 5
        const limit = Math.max(5, recentCount);

        return sortedItems.slice(0, limit);
      };

      // Load lessons
      const lessonsData = await getLessons();
      if (lessonsData) {
        setLessons(filterRecentItems(lessonsData));
      }

      // Load quizzes
      const quizzesData = await getQuizzes();
      if (quizzesData) {
        setQuizzes(filterRecentItems(quizzesData));
      }

      // Load challenges
      const challengesData = await getChallenges();
      if (challengesData) {
        setChallenges(filterRecentItems(challengesData));
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Teacher Dashboard 👨‍🏫
          </h1>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Students</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalStudents}</p>
                </div>
                <Users className="w-12 h-12 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Lessons</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.totalLessons}</p>
                </div>
                <BookOpen className="w-12 h-12 text-purple-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Quizzes</p>
                  <p className="text-3xl font-bold text-green-600">{stats.totalQuizzes}</p>
                </div>
                <FileText className="w-12 h-12 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Avg Quiz Score</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.avgQuizScore.toFixed(1)}%</p>
                </div>
                <BarChart3 className="w-12 h-12 text-yellow-500" />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Link
              href="/dashboard/teacher/lessons/create"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow border-2 border-dashed border-gray-300 hover:border-green-500"
            >
              <div className="text-center">
                <Plus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900">Create Lesson</h3>
              </div>
            </Link>

            <Link
              href="/dashboard/teacher/quizzes/create"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow border-2 border-dashed border-gray-300 hover:border-green-500"
            >
              <div className="text-center">
                <Plus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900">Create Quiz</h3>
              </div>
            </Link>

            <Link
              href="/dashboard/teacher/challenges"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow border-2 border-dashed border-gray-300 hover:border-green-500"
            >
              <div className="text-center">
                <Plus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900">View Challenges</h3>
              </div>
            </Link>

            <Link
              href="/dashboard/teacher/exam-planner"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow border-2 border-dashed border-indigo-200 hover:border-indigo-500"
            >
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900">Exam Planner & Progress</h3>
              </div>
            </Link>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Lessons */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Recent Lessons
                </h2>
                <Link href="/dashboard/teacher/lessons" className="text-green-600 hover:text-green-700 text-sm">
                  View All
                </Link>
              </div>
              {lessons.length === 0 ? (
                <p className="text-gray-500">No lessons created yet</p>
              ) : (
                <div className="space-y-4">
                  {lessons.map((lesson) => (
                    <div key={lesson.id || (lesson as any)._id} className="border-l-4 border-purple-500 pl-4 py-2">
                      <h3 className="font-semibold text-gray-900">{lesson.title}</h3>
                      <p className="text-sm text-gray-600">{lesson.topic}</p>
                      <Link
                        href={`/dashboard/teacher/lessons/${lesson.id || (lesson as any)._id}`}
                        className="text-purple-600 hover:text-purple-700 text-sm mt-2 inline-block"
                      >
                        Edit →
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Quizzes */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Recent Quizzes
                </h2>
                <Link href="/dashboard/teacher/quizzes" className="text-green-600 hover:text-green-700 text-sm">
                  View All
                </Link>
              </div>
              {quizzes.length === 0 ? (
                <p className="text-gray-500">No quizzes created yet</p>
              ) : (
                <div className="space-y-4">
                  {quizzes.map((quiz) => (
                    <div key={quiz.id || (quiz as any)._id} className="border-l-4 border-green-500 pl-4 py-2">
                      <h3 className="font-semibold text-gray-900">{quiz.title}</h3>
                      <p className="text-sm text-gray-600">Total Marks: {quiz.total_marks}</p>
                      <Link
                        href={`/dashboard/teacher/quizzes/${quiz.id || (quiz as any)._id}`}
                        className="text-green-600 hover:text-green-700 text-sm mt-2 inline-block"
                      >
                        View Analytics →
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Challenges */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <Trophy className="w-5 h-5 mr-2" />
                  Recent Challenges
                </h2>
                <Link href="/dashboard/teacher/challenges" className="text-green-600 hover:text-green-700 text-sm">
                  View All
                </Link>
              </div>
              {challenges.length === 0 ? (
                <p className="text-gray-500">No challenges created yet</p>
              ) : (
                <div className="space-y-4">
                  {challenges.map((challenge) => (
                    <div key={challenge.id || (challenge as any)._id} className="border-l-4 border-orange-500 pl-4 py-2">
                      <h3 className="font-semibold text-gray-900">{challenge.title}</h3>
                      <p className="text-sm text-gray-600">{challenge.category} • {challenge.points_reward} pts</p>
                      <Link
                        href={`/dashboard/teacher/challenges?id=${challenge.id || (challenge as any)._id}`}
                        className="text-orange-600 hover:text-orange-700 text-sm mt-2 inline-block"
                      >
                        View Details →
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Classes */}
          <div className="bg-white rounded-lg shadow-md p-6 mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Your Classes
              </h2>
              <Link href="/dashboard/teacher/classes" className="text-green-600 hover:text-green-700 text-sm">
                Manage Classes
              </Link>
            </div>
            {classes.length === 0 ? (
              <p className="text-gray-500">No classes created yet</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classes.map((classItem) => (
                  <div key={classItem.id || (classItem as any)._id} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{classItem.name}</h3>
                    <Link
                      href={`/dashboard/teacher/classes/${classItem.id || (classItem as any)._id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      View Details →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

