'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getMyQuizAttempts } from '@/lib/api';

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
            const attempts = await getMyQuizAttempts(params.id as string);
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
