'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { getAdminStats } from '@/lib/api';
import Link from 'next/link';
import { Users, Building2, BookOpen, FileText, BarChart3 } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalInstitutions: 0,
    totalLessons: 0,
    totalQuizzes: 0,
    totalStudents: 0,
    totalTeachers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    if (!user || user.role !== 'admin') return;
    try {
      const statsData = await getAdminStats();
      if (!statsData) return;
      setStats({
        totalUsers: statsData.totalUsers || 0,
        totalInstitutions: statsData.totalInstitutions || 0,
        totalLessons: statsData.totalLessons || 0,
        totalQuizzes: statsData.totalQuizzes || 0,
        totalStudents: statsData.totalStudents || 0,
        totalTeachers: statsData.totalTeachers || 0,
      });
    } catch (error: any) {
      console.error('Error loading stats:', error);
      if (error.message === 'Access denied' || error.status === 403) {
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Admin Dashboard ⚙️
          </h1>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Users</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
                </div>
                <Users className="w-12 h-12 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Students</p>
                  <p className="text-3xl font-bold text-green-600">{stats.totalStudents}</p>
                </div>
                <Users className="w-12 h-12 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Teachers</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.totalTeachers}</p>
                </div>
                <Users className="w-12 h-12 text-purple-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Institutions</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.totalInstitutions}</p>
                </div>
                <Building2 className="w-12 h-12 text-yellow-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Lessons</p>
                  <p className="text-3xl font-bold text-indigo-600">{stats.totalLessons}</p>
                </div>
                <BookOpen className="w-12 h-12 text-indigo-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Quizzes</p>
                  <p className="text-3xl font-bold text-pink-600">{stats.totalQuizzes}</p>
                </div>
                <FileText className="w-12 h-12 text-pink-500" />
              </div>
            </div>
          </div>

          {/* Management Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              href="/dashboard/admin/users"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow"
            >
              <Users className="w-8 h-8 text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Users</h3>
              <p className="text-gray-600 text-sm">View and manage all users, roles, and permissions</p>
            </Link>

            <Link
              href="/dashboard/admin/institutions"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow"
            >
              <Building2 className="w-8 h-8 text-yellow-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Institutions</h3>
              <p className="text-gray-600 text-sm">Add, edit, or remove institutions</p>
            </Link>

            <Link
              href="/dashboard/admin/analytics"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow"
            >
              <BarChart3 className="w-8 h-8 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Global Analytics</h3>
              <p className="text-gray-600 text-sm">View platform-wide statistics and insights</p>
            </Link>

            <Link
              href="/dashboard/admin/content"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow"
            >
              <BookOpen className="w-8 h-8 text-purple-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Content Moderation</h3>
              <p className="text-gray-600 text-sm">Review and moderate lessons, quizzes, and challenges</p>
            </Link>

            <Link
              href="/dashboard/admin/leaderboard"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow"
            >
              <BarChart3 className="w-8 h-8 text-orange-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Global Leaderboard</h3>
              <p className="text-gray-600 text-sm">View and manage global rankings</p>
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

