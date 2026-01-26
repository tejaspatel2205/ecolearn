'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { Check, X, Clock, User, FileText, Trophy } from 'lucide-react';

export default function RetakeRequestsPage() {
    const { user } = useAuth();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && user.role === 'teacher') {
            loadRequests();
        }
    }, [user]);

    const loadRequests = async () => {
        try {
            const token = localStorage.getItem('token');

            // Fetch Quiz Requests
            const quizResponse = await fetch('http://localhost:3001/api/quizzes/teacher/requests', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const quizData = await quizResponse.json();

            // Fetch Challenge Requests
            // Assuming this endpoint exists and returns similar structure
            let challengeData = [];
            try {
                const challengeResponse = await fetch('http://localhost:3001/api/challenges/teacher/requests', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (challengeResponse.ok) {
                    challengeData = await challengeResponse.json();
                }
            } catch (e) {
                console.warn("Could not fetch challenge requests", e);
            }

            // Normalize and Merge
            const normalizedQuizzes = Array.isArray(quizData) ? quizData.map((r: any) => ({
                ...r,
                type: 'quiz',
                itemName: r.quiz_id?.title || 'Unknown Quiz',
                itemId: r.quiz_id?._id
            })) : [];

            const normalizedChallenges = Array.isArray(challengeData) ? challengeData.map((r: any) => ({
                ...r,
                type: 'challenge',
                itemName: r.challenge_id?.title || 'Unknown Challenge',
                itemId: r.challenge_id?._id
            })) : [];

            // Sort by date created/updated
            const merged = [...normalizedQuizzes, ...normalizedChallenges].sort((a, b) => {
                const dateA = new Date(a.created_at || a.updated_at).getTime();
                const dateB = new Date(b.created_at || b.updated_at).getTime();
                return dateB - dateA;
            });

            setRequests(merged);
        } catch (error) {
            console.error('Error loading requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (request: any, status: 'approved' | 'rejected') => {
        try {
            const token = localStorage.getItem('token');
            let url = '';
            let method = '';
            let body = {};

            if (request.type === 'quiz') {
                url = `http://localhost:3001/api/quizzes/requests/${request._id}`;
                method = 'PUT';
                body = { status };
            } else if (request.type === 'challenge') {
                // Endpoint for challenge retake handling
                // Note: The challenge submission endpoint expects /submission/:id/handle-retake
                // And the request object for challenge is actually the submission object itself
                url = `http://localhost:3001/api/challenges/submission/${request._id}/handle-retake`;
                method = 'POST';
                body = { status };
            }

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                setRequests(requests.filter(r => r._id !== request._id));
                alert(`Request ${status} successfully`);
            } else {
                const err = await response.json();
                alert(`Failed to update request: ${err.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error updating request:', error);
            alert('Error updating request');
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

    return (
        <ProtectedRoute allowedRoles={['teacher']}>
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="container mx-auto px-4 pt-24 pb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center">
                        <Clock className="w-8 h-8 mr-3" />
                        Retake Requests
                    </h1>

                    {requests.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
                            <p className="text-xl">No pending requests</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {requests.map((request) => (
                                        <tr key={request._id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    {request.type === 'quiz' ? (
                                                        <span className="flex items-center text-blue-600 bg-blue-100 px-2 py-1 rounded-full text-xs font-medium">
                                                            <FileText className="w-3 h-3 mr-1" /> Quiz
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center text-orange-600 bg-orange-100 px-2 py-1 rounded-full text-xs font-medium">
                                                            <Trophy className="w-3 h-3 mr-1" /> Challenge
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                                                        <User className="h-6 w-6 text-gray-500" />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{request.student_id?.full_name || 'Unknown'}</div>
                                                        <div className="text-sm text-gray-500">{request.student_id?.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 font-medium">{request.itemName}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(request.created_at || request.updated_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleAction(request, 'approved')}
                                                    className="text-green-600 hover:text-green-900 mr-4 bg-green-50 px-3 py-1 rounded-full hover:bg-green-100 transition-colors"
                                                >
                                                    <span className="flex items-center">
                                                        <Check className="w-4 h-4 mr-1" /> Approve
                                                    </span>
                                                </button>
                                                <button
                                                    onClick={() => handleAction(request, 'rejected')}
                                                    className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-full hover:bg-red-100 transition-colors"
                                                >
                                                    <span className="flex items-center">
                                                        <X className="w-4 h-4 mr-1" /> Reject
                                                    </span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}
