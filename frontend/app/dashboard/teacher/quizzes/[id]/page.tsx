'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { Quiz } from '@/lib/types';
import { getQuiz } from '@/lib/api';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FileText, Edit, BarChart3, Clock, Calendar, CheckSquare } from 'lucide-react';

export default function ManageQuizPage() {
    const params = useParams();
    const { user } = useAuth();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadQuiz();
        }
    }, [user, params.id]);

    const loadQuiz = async () => {
        try {
            const pid = Array.isArray(params?.id) ? params?.id[0] : params?.id;
            if (!pid) return;
            const data = await getQuiz(pid);
            setQuiz(data);
        } catch (error) {
            console.error('Error loading quiz:', error);
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

    if (!quiz) {
        return (
            <ProtectedRoute allowedRoles={['teacher']}>
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
        <ProtectedRoute allowedRoles={['teacher']}>
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="container mx-auto px-4 pt-28 pb-8">
                    <Link
                        href="/dashboard/teacher/quizzes"
                        className="text-green-600 hover:text-green-700 font-medium mb-4 inline-block"
                    >
                        ← Back to Quizzes
                    </Link>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
                                        <p className="text-gray-600">{quiz.description}</p>
                                    </div>
                                    <Link
                                        href={`/dashboard/teacher/quizzes/${quiz.id || quiz._id}/edit`}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                                    >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit Quiz
                                    </Link>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center text-gray-600 mb-1">
                                            <CheckSquare className="w-4 h-4 mr-2" />
                                            Total Marks
                                        </div>
                                        <p className="text-xl font-bold text-gray-900">{quiz.total_marks}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center text-gray-600 mb-1">
                                            <Clock className="w-4 h-4 mr-2" />
                                            Time Limit
                                        </div>
                                        <p className="text-xl font-bold text-gray-900">
                                            {quiz.time_limit ? `${quiz.time_limit} mins` : 'No limit'}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center text-gray-600 mb-1">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            Created
                                        </div>
                                        <p className="text-sm font-bold text-gray-900">
                                            {new Date(quiz.created_at || '').toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center text-gray-600 mb-1">
                                            Class
                                        </div>
                                        <p className="text-xl font-bold text-purple-600">
                                            {quiz.class_number || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Questions Preview */}
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h2 className="text-xl font-semibold mb-4">Questions</h2>
                                <div className="space-y-4">
                                    {(quiz as any).questions?.map((question: any, index: number) => (
                                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex justify-between mb-2">
                                                <h3 className="font-medium">Question {index + 1}</h3>
                                                <span className="text-sm text-gray-500">{question.marks} marks</span>
                                            </div>
                                            <p className="text-gray-900 mb-2">{question.question_text}</p>
                                            <div className="text-sm text-gray-600">
                                                <span className="font-medium">Correct Answer:</span> {question.correct_answer}
                                            </div>
                                        </div>
                                    ))}
                                    {(!quiz as any).questions?.length && (
                                        <p className="text-gray-500 italic">No questions found.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h2 className="text-xl font-semibold mb-4">Actions</h2>
                                <div className="space-y-3">
                                    <Link
                                        href={`/dashboard/teacher/quizzes/${quiz.id || quiz._id}/analytics`}
                                        className="block w-full text-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center"
                                    >
                                        <BarChart3 className="w-4 h-4 mr-2" />
                                        View Analytics
                                    </Link>
                                    <Link
                                        href="/dashboard/teacher/quizzes"
                                        className="block w-full text-center border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
                                    >
                                        Back to List
                                    </Link>
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                                <h3 className="font-semibold text-blue-900 mb-2">Quick Tips</h3>
                                <ul className="list-disc list-inside text-sm text-blue-800 space-y-2">
                                    <li>Use analytics to identify topics students are struggling with.</li>
                                    <li>You can edit the quiz anytime, but be careful if students have already taken it.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
