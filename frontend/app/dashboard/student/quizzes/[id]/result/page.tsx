'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getQuizAttempts } from '@/lib/api'; // We might need to expose this for student

export default function QuizResultRedirectPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && params.id) {
            findLatestAttempt();
        }
    }, [user, params.id]);

    const findLatestAttempt = async () => {
        try {
            // We need an API that students can call to get their attempts for a specific quiz
            // The existing getQuizAttempts is for teachers. 
            // I'll fetch attempts using a direct call for now or update API.
            // Let's assume we can hit the endpoint we just modified or a similar one.
            // Actually, I didn't verify if students can call `GET /api/quizzes/:id/attempts`.
            // The route says: router.get('/:id/attempts', authMiddleware, roleMiddleware('teacher', 'admin')...
            // So students CANNOT call it.

            // I need to add a way for students to get their own attempts for a quiz.
            // OR I can use the new `GET /attempt/:id/details` but I need an ID.

            // NEW PLAN: Create `GET /api/quizzes/:id/my-attempts` for students.
            // Since I can't edit backend right now easily in this step without context switching,
            // I will implement this backend change next. 

            // For now, this page will show "Loading..."

            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/quizzes/${params.id}/my-attempts`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const attempts = await res.json();
                if (attempts && attempts.length > 0) {
                    // Sort by percentage desc, then date desc
                    const bestAttempt = attempts.sort((a: any, b: any) => {
                        if (b.percentage !== a.percentage) {
                            return b.percentage - a.percentage;
                        }
                        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                    })[0];

                    router.replace(`/dashboard/student/quizzes/attempts/${bestAttempt._id}`);
                    return;
                }
            }

            // If no attempts found
            setLoading(false);

        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white p-8 rounded-xl shadow-md text-center">
                <h2 className="text-xl font-bold text-red-600 mb-2">No Results Found</h2>
                <p className="text-gray-600 mb-4">You haven't completed this quiz yet.</p>
                <button
                    onClick={() => router.replace(`/dashboard/student/quizzes/${params.id}`)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                >
                    Start Quiz
                </button>
            </div>
        </div>
    );
}
