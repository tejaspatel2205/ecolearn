'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, Sparkles, Loader2, ArrowRight, AlertCircle, CheckCircle, History, Clock, Trash2, X, Lock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import axios from 'axios';
import { getQuizzes } from '@/lib/api';
import { Quiz } from '@/lib/types';

export default function SmartPracticePage() {
    const router = useRouter();
    const [status, setStatus] = useState<'idle' | 'analyzing' | 'generating' | 'ready' | 'error'>('idle');
    const [progress, setProgress] = useState(0);
    const [remarks, setRemarks] = useState<any>(null);
    const [quizId, setQuizId] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [historyQuizzes, setHistoryQuizzes] = useState<Quiz[]>([]);

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [quizToDelete, setQuizToDelete] = useState<string | null>(null);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);

    const hasFetched = useRef(false);

    useEffect(() => {
        if (!hasFetched.current) {
            hasFetched.current = true;
            // Only load history, do not auto-generate
            loadHistory();
        }
    }, []);

    const loadHistory = async () => {
        try {
            const allQuizzes = await getQuizzes();
            if (allQuizzes) {
                const smartQuizzes = allQuizzes.filter((q: Quiz) => q.title.startsWith('Smart Practice'));
                setHistoryQuizzes(smartQuizzes);
            }
        } catch (error) {
            console.error("Failed to load history:", error);
        }
    };

    const startGeneration = async () => {
        setStatus('analyzing');

        // Simulate progress bar for better UX
        const interval = setInterval(() => {
            setProgress(prev => Math.min(prev + 5, 90));
        }, 500);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/quizzes/smart-practice`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            clearInterval(interval);
            setProgress(100);
            setStatus('ready');
            setRemarks(res.data.remarks);
            setQuizId(res.data.quizId);

        } catch (error: any) {
            clearInterval(interval);
            setStatus('error');
            console.error(error);
            setErrorMsg(error.response?.data?.error || 'Failed to generate Smart Practice quiz.');
        }
    };

    const handleStartQuiz = () => {
        if (quizId) {
            router.push(`/dashboard/student/quizzes/${quizId}`);
        }
    };

    const handleDeleteClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setQuizToDelete(id);
        setDeletePassword('');
        setDeleteModalOpen(true);
    };

    const confirmDelete = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!quizToDelete || !deletePassword) return;

        setDeleteLoading(true);
        try {
            const token = localStorage.getItem('token');
            // Check API spec: DELETE with body is unusual but some frameworks support it. 
            // Better to use options or data field in axios delete.
            await axios.delete(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/quizzes/${quizToDelete}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    data: { password: deletePassword } // Pass password in body
                }
            );

            // Success
            setHistoryQuizzes(prev => prev.filter(q => (q.id || q._id) !== quizToDelete));
            setDeleteModalOpen(false);
            setQuizToDelete(null);
        } catch (error: any) {
            console.error('Delete failed', error);
            alert(error.response?.data?.error || 'Failed to delete quiz');
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <ProtectedRoute allowedRoles={['student']}>
            <div className="min-h-screen bg-slate-50">
                <Navbar />

                <div className="container mx-auto px-4 pt-24 pb-8">


                    {/* IDLE STATE - Manual Trigger */}
                    {status === 'idle' && (
                        <div className="w-full max-w-4xl mx-auto mb-8">
                            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                    <div className="text-center md:text-left">
                                        <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                                            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
                                                <Brain className="w-6 h-6 text-white" />
                                            </div>
                                            <h1 className="text-2xl font-bold">Smart Practice</h1>
                                        </div>
                                        <p className="text-indigo-100 max-w-xl">
                                            Generate an AI-powered personalized quiz based on your exam planner performance.
                                            Target your weak areas and improve your marks.
                                        </p>
                                    </div>
                                    <button
                                        onClick={startGeneration}
                                        className="whitespace-nowrap bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors shadow-lg flex items-center gap-2 group"
                                    >
                                        <Sparkles className="w-5 h-5 group-hover:text-yellow-500 transition-colors" />
                                        Create New Practice
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* LOADING / ANALYZING STATE */}
                    {(status === 'analyzing' || status === 'generating') && (
                        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center animate-in fade-in zoom-in duration-300 mx-auto">
                            <div className="relative w-20 h-20 mx-auto mb-6">
                                <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-75"></div>
                                <div className="relative bg-indigo-50 rounded-full p-4 border border-indigo-100 flex items-center justify-center">
                                    <Brain className="w-10 h-10 text-indigo-600 animate-pulse" />
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Analyzing Your Profile</h2>
                            <p className="text-slate-500 mb-8">
                                Checking exam planner data, identifying weak areas, and constructing your personalized quiz...
                            </p>

                            <div className="relative h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300 ease-out"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between mt-2 text-xs text-slate-400 font-medium">
                                <span>Scanning Data...</span>
                                <span>{progress}%</span>
                            </div>
                        </div>
                    )}

                    {/* READY STATE */}
                    {status === 'ready' && remarks && (
                        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500 border border-slate-100 mx-auto">
                            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-8 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
                                            <Sparkles className="w-6 h-6 text-yellow-300" />
                                        </div>
                                        <h1 className="text-2xl font-bold">Your Smart Practice is Ready!</h1>
                                    </div>
                                    <p className="text-indigo-100 text-lg leading-relaxed opacity-90">
                                        "{remarks.overallFeedback}"
                                    </p>
                                </div>
                            </div>

                            <div className="p-8">
                                <div className="grid md:grid-cols-2 gap-8 mb-8">
                                    <div className="bg-green-50 p-5 rounded-xl border border-green-100">
                                        <h3 className="font-bold text-green-700 mb-3 flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4" /> Your Strengths
                                        </h3>
                                        <ul className="space-y-2">
                                            {remarks.strengths?.map((s: string, i: number) => (
                                                <li key={i} className="text-sm text-green-800 flex items-start gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0"></span>
                                                    {s}
                                                </li>
                                            ))}
                                            {(!remarks.strengths || remarks.strengths.length === 0) && (
                                                <li className="text-sm text-green-600 italic">Analysis in progress...</li>
                                            )}
                                        </ul>
                                    </div>

                                    <div className="bg-amber-50 p-5 rounded-xl border border-amber-100">
                                        <h3 className="font-bold text-amber-700 mb-3 flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" /> Focus Areas
                                        </h3>
                                        <ul className="space-y-2">
                                            {remarks.weakAreas?.map((w: string, i: number) => (
                                                <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                                                    {w}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-xl border-l-4 border-indigo-500 mb-8">
                                    <h4 className="font-semibold text-slate-900 mb-1">Recommendation</h4>
                                    <p className="text-slate-600 text-sm">{remarks.recommendation}</p>
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        onClick={handleStartQuiz}
                                        className="bg-slate-900 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 hover:-translate-y-1 transition-all flex items-center gap-3"
                                    >
                                        Start Quiz <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ERROR STATE */}
                    {status === 'error' && (
                        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border-t-4 border-red-500">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="w-8 h-8 text-red-600" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 mb-2">Generation Failed</h2>
                            <p className="text-slate-500 mb-6">
                                {errorMsg}
                            </p>
                            <button
                                onClick={() => router.push('/dashboard/student/exam-planner')}
                                className="text-slate-600 font-medium underline hover:text-slate-800"
                            >
                                Go back to Exam Planner
                            </button>
                        </div>
                    )}
                </div>

                {/* HISTORY SECTION */}
                <div className="container mx-auto px-4 pb-20">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
                            <History className="w-6 h-6 mr-2 text-indigo-600" />
                            Previous Smart Practice Sessions
                        </h2>

                        {historyQuizzes.length === 0 ? (
                            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
                                <p className="text-slate-500">No previous practice sessions found.</p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-4">
                                {historyQuizzes.map((quiz) => (
                                    <div key={quiz.id || quiz._id} className="relative bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-semibold text-slate-900">{quiz.title}</h3>
                                                <p className="text-sm text-slate-500 mt-1">
                                                    {new Date(quiz.created_at || Date.now()).toLocaleString()}
                                                </p>
                                            </div>

                                            <div className="flex items-start gap-4">
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2 py-1 rounded-lg">
                                                        {quiz.questions?.length || 25} Qs
                                                    </span>
                                                    {quiz.stats && quiz.stats.attempts > 0 && quiz.stats.maxScore !== undefined && (
                                                        <div className="flex items-center text-sm font-bold text-green-600">
                                                            Best: {quiz.stats.maxScore}%
                                                        </div>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={(e) => handleDeleteClick(quiz.id || quiz._id!, e)}
                                                    className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                                    title="Delete Quiz"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-4">
                                            <div className="flex items-center text-sm text-slate-500">
                                                <Clock className="w-4 h-4 mr-1" />
                                                <span>{quiz.time_limit || 30} mins</span>
                                            </div>

                                            <div className="flex gap-2">
                                                {quiz.stats && quiz.stats.attempts > 0 ? (
                                                    <>
                                                        <button
                                                            onClick={() => router.push(`/dashboard/student/quizzes/${quiz.id || quiz._id}/result`)}
                                                            className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200"
                                                        >
                                                            View Results
                                                        </button>
                                                        <button
                                                            onClick={() => router.push(`/dashboard/student/quizzes/${quiz.id || quiz._id}?practice=true`)}
                                                            className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                                                        >
                                                            Practice Again
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => router.push(`/dashboard/student/quizzes/${quiz.id || quiz._id}`)}
                                                        className="px-4 py-1.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm flex items-center"
                                                    >
                                                        Start Quiz <ArrowRight className="w-4 h-4 ml-1" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Trash2 className="w-5 h-5 text-red-500" />
                                Delete Attempt?
                            </h3>
                            <button onClick={() => setDeleteModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-slate-500 text-sm mb-6">
                            This action cannot be undone. To confirm deletion, please enter your account password.
                        </p>

                        <form onSubmit={confirmDelete}>
                            <div className="mb-4">
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                    <input
                                        type="password"
                                        placeholder="Enter your password"
                                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                                        value={deletePassword}
                                        onChange={(e) => setDeletePassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setDeleteModalOpen(false)}
                                    className="flex-1 py-2.5 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={deleteLoading}
                                    className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                                >
                                    {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Delete"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </ProtectedRoute>
    );
}
