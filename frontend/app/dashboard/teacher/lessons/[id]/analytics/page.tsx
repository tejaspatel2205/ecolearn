'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { getLesson, getLessonAnalytics } from '@/lib/api';
import Link from 'next/link';
import { Users, Calendar, CheckCircle, ArrowLeft } from 'lucide-react';

export default function LessonAnalyticsPage() {
    const { user } = useAuth();
    const params = useParams();
    const [lesson, setLesson] = useState<any>(null);
    const [analytics, setAnalytics] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && (user.role === 'teacher' || user.role === 'admin') && params.id) {
            loadData();
        }
    }, [user, params.id]);

    const loadData = async () => {
        if (!user || (user.role !== 'teacher' && user.role !== 'admin')) return;
        try {
            const [lessonData, analyticsData] = await Promise.all([
                getLesson(params.id as string),
                getLessonAnalytics(params.id as string)
            ]);
            setLesson(lessonData);
            setAnalytics(analyticsData);
        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
                </div>
            </ProtectedRoute>
        );
    }

    if (!lesson) {
        return (
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <div className="min-h-screen bg-gray-50">
                    <Navbar />
                    <div className="container mx-auto px-4 pt-24 pb-8">
                        <p className="text-center text-gray-500">Lesson not found</p>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="container mx-auto px-4 pt-28 pb-8 max-w-4xl">
                    <Link
                        href={`/dashboard/teacher/lessons/${params.id}`}
                        className="text-green-600 hover:text-green-700 font-medium mb-4 inline-flex items-center"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Lesson Details
                    </Link>

                    <div className="bg-white rounded-lg shadow-md p-8 mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{lesson.title} - Analytics</h1>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                            <div className="bg-blue-50 p-4 rounded-lg flex items-center">
                                <div className="bg-blue-100 p-3 rounded-full mr-4">
                                    <CheckCircle className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Total Completions</p>
                                    <p className="text-2xl font-bold text-gray-900">{analytics.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-semibold flex items-center">
                                <Users className="w-5 h-5 mr-2" />
                                Students Who Completed
                            </h2>
                        </div>

                        {analytics.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                No students have completed this lesson yet.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Student Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Email
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Completion Date
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {analytics.map((record) => (
                                            <tr key={record._id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {record.student_id?.full_name || 'Unknown Student'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-500">
                                                        {record.student_id?.email || '-'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(record.completed_at).toLocaleDateString()} {new Date(record.completed_at).toLocaleTimeString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
