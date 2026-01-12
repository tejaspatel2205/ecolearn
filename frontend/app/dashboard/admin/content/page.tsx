'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, Check, X, Trash2, Filter, Search, BookOpen, FileText, Target, BarChart3, Ban } from 'lucide-react';

export default function ContentModeration() {
  const { user } = useAuth();
  const [content, setContent] = useState({
    lessons: [],
    quizzes: [],
    challenges: []
  });
  const [activeTab, setActiveTab] = useState('lessons');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadContent();
    }
  }, [user]);

  const loadContent = async () => {
    try {
      const token = localStorage.getItem('token');

      // Load lessons
      const lessonsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/lessons`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Load quizzes
      const quizzesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/quizzes`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Load challenges
      const challengesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/challenges`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const lessons = lessonsResponse.ok ? await lessonsResponse.json() : [];
      const quizzes = quizzesResponse.ok ? await quizzesResponse.json() : [];
      const challenges = challengesResponse.ok ? await challengesResponse.json() : [];

      setContent({ lessons, quizzes, challenges });
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateContentStatus = async (type: string, id: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/admin/content/${type}/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        // Update local state
        setContent(prev => ({
          ...prev,
          [type]: prev[type as keyof typeof prev].map((item: any) =>
            (item.id || item._id) === id ? { ...item, status } : item
          )
        }));
      }
    } catch (error) {
      console.error('Error updating content status:', error);
      alert('Failed to update status');
    }
  };

  const deleteContent = async (type: string, id: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/${type}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        setContent(prev => ({
          ...prev,
          [type]: prev[type as keyof typeof prev].filter((item: any) => (item.id || item._id) !== id)
        }));
      }
    } catch (error) {
      console.error('Error deleting content:', error);
      alert('Failed to delete content');
    }
  };

  const getFilteredContent = () => {
    const currentContent = content[activeTab as keyof typeof content];
    if (statusFilter === 'all') return currentContent;
    return currentContent.filter((item: any) => item.status === statusFilter);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      approved: { color: 'bg-green-100 text-green-800', text: 'Approved' },
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Rejected' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <span className={`inline-block px-2 py-1 text-xs rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center">
            <BookOpen className="w-8 h-8 mr-3" />
            Content Moderation
          </h1>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('lessons')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'lessons'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                  <BookOpen className="w-4 h-4 inline mr-2" />
                  Lessons ({content.lessons.length})
                </button>
                <button
                  onClick={() => setActiveTab('quizzes')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'quizzes'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                  <FileText className="w-4 h-4 inline mr-2" />
                  Quizzes ({content.quizzes.length})
                </button>
                <button
                  onClick={() => setActiveTab('challenges')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'challenges'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                  <Target className="w-4 h-4 inline mr-2" />
                  Challenges ({content.challenges.length})
                </button>
              </nav>
            </div>

            {/* Filter */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* Content List */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="divide-y divide-gray-200">
              {getFilteredContent().map((item: any) => (
                <div key={item.id || item._id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                        {getStatusBadge(item.status || 'pending')}
                      </div>

                      {activeTab === 'lessons' && (
                        <div>
                          <p className="text-gray-600 mb-2">Topic: {item.topic}</p>
                          <p className="text-sm text-gray-500">{item.content?.substring(0, 200)}...</p>
                        </div>
                      )}

                      {activeTab === 'quizzes' && (
                        <div>
                          <p className="text-gray-600 mb-2">Total Marks: {item.total_marks}</p>
                          <p className="text-sm text-gray-500">{item.description}</p>
                        </div>
                      )}

                      {activeTab === 'challenges' && (
                        <div>
                          <p className="text-gray-600 mb-2">Points Reward: {item.points_reward}</p>
                          <p className="text-sm text-gray-500">{item.description}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        <span>Created: {new Date(item.created_at).toLocaleDateString()}</span>
                        <span>By: {typeof item.teacher_id === 'object' ? item.teacher_id.full_name : `Teacher ID ${item.teacher_id}`}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => {
                          const route = activeTab === 'lessons' ? 'lessons' : activeTab === 'quizzes' ? 'quizzes' : 'challenges';
                          window.open(`/dashboard/student/${route}/${item.id || item._id}`, '_blank');
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {activeTab === 'quizzes' && (
                        <button
                          onClick={() => window.open(`/dashboard/teacher/quizzes/${item.id || item._id}/analytics`, '_blank')}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                          title="View Analytics"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </button>
                      )}

                      {item.status !== 'approved' && (
                        <button
                          onClick={() => updateContentStatus(activeTab, item.id || item._id, 'approved')}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                          title="Approve"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}

                      {item.status !== 'rejected' && (
                        <button
                          onClick={() => updateContentStatus(activeTab, item.id || item._id, 'rejected')}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Reject"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => deleteContent(activeTab, item.id || item._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {getFilteredContent().length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No content found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}