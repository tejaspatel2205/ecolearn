'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, XCircle, ArrowLeft, RotateCw, Download } from 'lucide-react';

export default function QuizResultPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && params.id) {
            loadResult();
        }
    }, [user, params.id]);

    const loadResult = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/quizzes/attempt/${params.id}/details`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setResult(data);
            }
        } catch (error) {
            console.error('Error loading result:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        window.print();
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

    if (!result) {
        return (
            <ProtectedRoute allowedRoles={['student']}>
                <div className="min-h-screen flex items-center justify-center">
                    <p className="text-xl text-red-500">Result not found</p>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute allowedRoles={['student']}>
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="container mx-auto px-4 pt-24 pb-8 max-w-4xl">
                    {/* Header / Summary */}
                    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                        <div className="flex items-center justify-between mb-4 print:hidden">
                            <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 flex items-center gap-2">
                                <ArrowLeft className="w-5 h-5" /> Back
                            </button>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleDownload}
                                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                                >
                                    <Download className="w-4 h-4" /> Download Result
                                </button>
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 text-center mb-4">{result.quizTitle}</h1>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                            <div className="bg-green-50 rounded-lg p-4">
                                <p className="text-sm text-gray-500">Score</p>
                                <p className="text-3xl font-bold text-green-600">{result.attempt.score} / {result.attempt.totalMarks}</p>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-4">
                                <p className="text-sm text-gray-500">Percentage</p>
                                <p className="text-3xl font-bold text-blue-600">{Number(result.attempt.percentage).toFixed(1)}%</p>
                            </div>
                            <div className="bg-indigo-50 rounded-lg p-4">
                                <p className="text-sm text-gray-500">Date</p>
                                <p className="text-lg font-bold text-indigo-600">
                                    {new Date(result.attempt.completedAt).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-indigo-400">
                                    {new Date(result.attempt.completedAt).toLocaleTimeString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Questions Review */}
                    <div className="space-y-6">
                        {result.questions.map((q: any, idx: number) => (
                            <div key={idx} className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${q.isCorrect ? 'border-green-500' : 'border-red-500'}`}>
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <span className="inline-block bg-gray-100 rounded px-2 py-1 text-xs font-semibold text-gray-600 mb-2">
                                            Question {idx + 1}
                                        </span>
                                        <h3 className="text-lg font-semibold text-gray-900">{q.questionText}</h3>
                                    </div>
                                    {q.isCorrect ? (
                                        <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                                    ) : (
                                        <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                                    )}
                                </div>

                                {/* Options / Answer Display */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div className="p-3 rounded-lg border bg-gray-50">
                                        <p className="text-xs text-gray-500 mb-1">Your Answer</p>
                                        <p className={`font-medium ${q.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                                            {q.userAnswer ? q.options[q.userAnswer] || q.userAnswer : <span className="italic text-gray-400">Not Answered</span>}
                                        </p>
                                    </div>
                                    {!q.isCorrect && (
                                        <div className="p-3 rounded-lg border bg-green-50 border-green-100">
                                            <p className="text-xs text-green-600 mb-1">Correct Answer</p>
                                            <p className="font-medium text-green-800">
                                                {q.options[q.correctAnswer] || q.correctAnswer}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Explanation */}
                                {q.explanation && (
                                    <div className="bg-indigo-50 rounded-lg p-4 mt-4 text-sm text-indigo-900">
                                        <span className="font-bold block mb-1">Explanation:</span>
                                        {q.explanation}
                                    </div>
                                )}

                                <div className="mt-3 text-xs text-gray-400 flex gap-3">
                                    <span>Subject: {q.subject}</span>
                                    {q.focusArea && <span>Focus: {q.focusArea}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
