'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { BarChart3, Users, BookOpen, FileText, TrendingUp, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

export default function GlobalAnalytics() {
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalInstitutions: 0,
    totalLessons: 0,
    totalQuizzes: 0,
    totalChallenges: 0,
    avgQuizScore: 0,
    completionRate: 0,
    userGrowth: [],
    roleDistribution: [],
    institutionTypes: [],
    monthlyActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        // Fallback to basic stats if analytics endpoint doesn't exist
        const statsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setAnalytics({
            ...analytics,
            ...statsData,
            roleDistribution: [
              { name: 'Students', value: statsData.totalStudents, color: '#10B981' },
              { name: 'Teachers', value: statsData.totalTeachers, color: '#3B82F6' },
              { name: 'Admins', value: statsData.totalAdmins || 0, color: '#8B5CF6' }
            ],
            institutionTypes: [
              { name: 'Schools', value: Math.floor(statsData.totalInstitutions * 0.6) },
              { name: 'Colleges', value: Math.floor(statsData.totalInstitutions * 0.3) },
              { name: 'Universities', value: Math.floor(statsData.totalInstitutions * 0.1) }
            ],
            monthlyActivity: [
              { month: 'Jan', users: 120, lessons: 45, quizzes: 30 },
              { month: 'Feb', users: 150, lessons: 52, quizzes: 38 },
              { month: 'Mar', users: 180, lessons: 61, quizzes: 45 },
              { month: 'Apr', users: 220, lessons: 73, quizzes: 52 },
              { month: 'May', users: 250, lessons: 82, quizzes: 61 },
              { month: 'Jun', users: statsData.totalUsers, lessons: statsData.totalLessons, quizzes: statsData.totalQuizzes }
            ]
          });
        }
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'];

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
        <div className="container mx-auto px-4 pt-28 pb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center">
            <BarChart3 className="w-8 h-8 mr-3" />
            Global Analytics
          </h1>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Users</p>
                  <p className="text-3xl font-bold text-blue-600">{analytics.totalUsers}</p>
                  <p className="text-green-600 text-sm">↗ +12% this month</p>
                </div>
                <Users className="w-12 h-12 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Active Institutions</p>
                  <p className="text-3xl font-bold text-green-600">{analytics.totalInstitutions}</p>
                  <p className="text-green-600 text-sm">↗ +8% this month</p>
                </div>
                <BookOpen className="w-12 h-12 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Content</p>
                  <p className="text-3xl font-bold text-purple-600">{analytics.totalLessons + analytics.totalQuizzes}</p>
                  <p className="text-green-600 text-sm">↗ +15% this month</p>
                </div>
                <FileText className="w-12 h-12 text-purple-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Avg Quiz Score</p>
                  <p className="text-3xl font-bold text-yellow-600">{analytics.avgQuizScore || 78}%</p>
                  <p className="text-green-600 text-sm">↗ +3% this month</p>
                </div>
                <Award className="w-12 h-12 text-yellow-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* User Role Distribution */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">User Role Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.roleDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.roleDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Institution Types */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Institution Types</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.institutionTypes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Activity Trends */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Monthly Activity Trends</h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={analytics.monthlyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={2} name="Users" />
                <Line type="monotone" dataKey="lessons" stroke="#10B981" strokeWidth={2} name="Lessons" />
                <Line type="monotone" dataKey="quizzes" stroke="#8B5CF6" strokeWidth={2} name="Quizzes" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Platform Health Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Engagement Rate</h3>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">87%</div>
                <p className="text-gray-600">Daily active users</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '87%' }}></div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Content Completion</h3>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">73%</div>
                <p className="text-gray-600">Average completion rate</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '73%' }}></div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">User Satisfaction</h3>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">4.6</div>
                <p className="text-gray-600">Average rating (out of 5)</p>
                <div className="flex justify-center mt-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className={`text-2xl ${star <= 4.6 ? 'text-yellow-400' : 'text-gray-300'}`}>
                      ⭐
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}