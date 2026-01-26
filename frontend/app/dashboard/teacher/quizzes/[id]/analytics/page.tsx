'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { Quiz } from '@/lib/types';
import { getQuiz, getQuizAttempts } from '@/lib/api';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { BarChart3, Users, Clock, CheckCircle, XCircle, CheckSquare } from 'lucide-react';

export default function QuizAnalyticsPage() {
    const params = useParams();
    const { user } = useAuth();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [attempts, setAttempts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && (user.role === 'teacher' || user.role === 'admin')) {
            loadData();
        }
    }, [user, params.id]);

    const loadData = async () => {
        if (!user || (user.role !== 'teacher' && user.role !== 'admin')) return;
        try {
            const pid = Array.isArray(params?.id) ? params?.id[0] : params?.id;
            if (!pid) return;

            const [quizData, attemptsData] = await Promise.all([
                getQuiz(pid),
                getQuizAttempts(pid)
            ]);
            setQuiz(quizData);
            setAttempts(attemptsData);
        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = () => {
        if (!attempts.length) return { avgScore: 0, passRate: 0, highestScore: 0, lowestScore: 0 };

        const scores = attempts.map(a => a.percentage);
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        const passCount = scores.filter(s => s >= 50).length; // Assuming 50% is pass
        const passRate = (passCount / attempts.length) * 100;
        const highestScore = Math.max(...scores);
        const lowestScore = Math.min(...scores);

        return { avgScore, passRate, highestScore, lowestScore };
    };

    const stats = calculateStats();

    if (loading) {
        return (
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
                </div>
            </ProtectedRoute>
        );
    }

    if (!quiz) {
        return (
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Quiz not found</h1>
                        <Link href="/dashboard/teacher/quizzes" className="text-green-600 hover:underline">
                            Return to Quizzes
                        </Link>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="container mx-auto px-4 pt-28 pb-8">
                    <Link
                        href={`/dashboard/teacher/quizzes/${params.id}`}
                        className="text-green-600 hover:text-green-700 font-medium mb-4 inline-block"
                    >
                        ← Back to Quiz Details
                    </Link>

                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">
                            Analytics: {quiz.title}
                        </h1>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm">Total Attempts</p>
                                    <p className="text-3xl font-bold text-blue-600">{attempts.length}</p>
                                </div>
                                <Users className="w-12 h-12 text-blue-500" />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm">Avg. Score</p>
                                    <p className="text-3xl font-bold text-purple-600">{stats.avgScore.toFixed(1)}%</p>
                                </div>
                                <BarChart3 className="w-12 h-12 text-purple-500" />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm">High Score</p>
                                    <p className="text-3xl font-bold text-green-600">{stats.highestScore.toFixed(0)}%</p>
                                </div>
                                <CheckCircle className="w-12 h-12 text-green-500" />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm">Pass Rate</p>
                                    <p className="text-3xl font-bold text-yellow-600">{stats.passRate.toFixed(1)}%</p>
                                </div>
                                <CheckSquare className="w-12 h-12 text-yellow-500" />
                            </div>
                        </div>
                    </div>

                    {/* Attempts Table */}
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-800">Student Attempts</h2>
                        </div>

                        {attempts.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                No attempts recorded yet.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {attempts.map((attempt) => (
                                            <tr key={attempt._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                                    {attempt.student_id?.full_name || 'Unknown'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                                    {attempt.student_id?.email || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                                    {new Date(attempt.created_at || Date.now()).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`font-bold ${attempt.percentage >= 80 ? 'text-green-600' :
                                                        attempt.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
                                                        }`}>
                                                        {attempt.score}/{attempt.total_marks} ({attempt.percentage.toFixed(0)}%)
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${attempt.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {attempt.status}
                                                    </span>
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
