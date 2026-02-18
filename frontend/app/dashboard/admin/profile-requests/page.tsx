'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import axios from 'axios';
import { Loader2, CheckCircle, XCircle, User, Clock, ArrowRight } from 'lucide-react';

export default function ProfileRequests() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/profile-requests/admin`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setRequests(response.data);
        } catch (error) {
            console.error('Error loading requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: string, status: 'approved' | 'rejected') => {
        setActionLoading(id);
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/profile-requests/${id}/status`,
                { status, feedback: status === 'rejected' ? 'Request rejected by admin.' : '' },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Remove processed request from list
            setRequests(prev => prev.filter(r => r._id !== id));
            alert(`Request ${status} successfully.`);
        } catch (error) {
            console.error(`Error ${status} request:`, error);
            alert(`Failed to ${status} request.`);
        } finally {
            setActionLoading(null);
        }
    };

    const getChangedFields = (changes: any) => {
        return Object.entries(changes).filter(([_, value]) => value).map(([key, value]) => (
            <div key={key} className="text-sm">
                <span className="font-semibold capitalize text-gray-700">{key.replace('_', ' ')}:</span>{' '}
                <span className="text-gray-600">{String(value)}</span>
            </div>
        ));
    };

    if (loading) {
        return (
            <ProtectedRoute allowedRoles={['admin']}>
                <div className="min-h-screen flex items-center justify-center">
                    <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="container mx-auto px-4 pt-24 pb-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <User className="h-6 w-6 text-indigo-600" />
                        Profile Update Requests
                    </h1>

                    {requests.length === 0 ? (
                        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                            <p>No pending requests.</p>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {requests.map((request) => (
                                <div key={request._id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {request.user_id?.full_name || 'Unknown User'}
                                                </h3>
                                                <p className="text-sm text-gray-500">{request.user_id?.email}</p>
                                                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    Requested on {new Date(request.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full border border-yellow-200 capitalize">
                                                {request.user_id?.role}
                                            </span>
                                        </div>

                                        <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-100">
                                            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                Requested Changes <ArrowRight className="h-3 w-3" />
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {getChangedFields(request.requested_changes)}
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                                            <button
                                                onClick={() => handleAction(request._id, 'rejected')}
                                                disabled={actionLoading === request._id}
                                                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors"
                                            >
                                                <XCircle className="h-4 w-4" />
                                                Reject
                                            </button>
                                            <button
                                                onClick={() => handleAction(request._id, 'approved')}
                                                disabled={actionLoading === request._id}
                                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition-colors shadow-sm"
                                            >
                                                {actionLoading === request._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                                Approve Update
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}
