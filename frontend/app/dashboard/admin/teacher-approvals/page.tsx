'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Check, X, Bell } from 'lucide-react';
import Button from '@/components/Button';

export default function TeacherApprovalsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [subjects, setSubjects] = useState<string>('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (user && user.role === 'admin') {
            fetchRequests();
        }
    }, [user]);

    const fetchRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3001/api/admin/teacher-requests', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setRequests(data);
            }
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!subjects.trim()) {
            alert('Please assign at least one subject (comma separated).');
            return;
        }

        try {
            setActionLoading(true);
            const token = localStorage.getItem('token');
            const assignedSubjects = subjects.split(',').map(s => s.trim()).filter(s => s.length > 0);

            const response = await fetch('http://localhost:3001/api/admin/approve-teacher', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId: selectedRequest._id, assigned_subjects: assignedSubjects })
            });

            if (response.ok) {
                setRequests(requests.filter(r => r._id !== selectedRequest._id));
                setSelectedRequest(null);
                setSubjects('');
            } else {
                alert('Failed to approve');
            }
        } catch (error) {
            console.error('Error approving:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!confirm('Are you sure you want to reject this teacher?')) return;

        try {
            setActionLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3001/api/admin/reject-teacher', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId: selectedRequest._id })
            });

            if (response.ok) {
                setRequests(requests.filter(r => r._id !== selectedRequest._id));
                setSelectedRequest(null);
            } else {
                alert('Failed to reject');
            }
        } catch (error) {
            console.error('Error rejecting:', error);
        } finally {
            setActionLoading(false);
        }
    };

    if (!user || user.role !== 'admin') {
        return <div className="p-8">Access Denied</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold flex items-center">
                    <Bell className="w-6 h-6 mr-2 text-green-600" />
                    Teacher Approval Requests ({requests.length})
                </h1>
                <Button variant="outline" onClick={() => router.back()}>
                    Back to Dashboard
                </Button>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : requests.length === 0 ? (
                <div className="text-gray-500">No pending requests.</div>
            ) : (
                <div className="grid gap-4">
                    {requests.map(req => (
                        <div key={req._id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
                            <div>
                                <h3 className="font-bold">{req.full_name}</h3>
                                <p className="text-sm text-gray-600">{req.email}</p>
                                <p className="text-xs text-gray-500">Mobile: {req.mobile}</p>
                            </div>
                            <Button onClick={() => setSelectedRequest(req)} size="sm">
                                Review
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {selectedRequest && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4">Approve Teacher</h2>
                        <p className="mb-4">
                            <strong>Name:</strong> {selectedRequest.full_name}<br />
                            <strong>Email:</strong> {selectedRequest.email}
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Assign Subjects (comma separated)</label>
                            <input
                                type="text"
                                value={subjects}
                                onChange={(e) => setSubjects(e.target.value)}
                                placeholder="e.g. Mathematics, Physics"
                                className="w-full border p-2 rounded"
                            />
                            <p className="text-xs text-gray-500 mt-1">At least one subject is required.</p>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button variant="danger" onClick={handleReject} disabled={actionLoading}>
                                Reject
                            </Button>
                            <Button variant="ghost" onClick={() => setSelectedRequest(null)} disabled={actionLoading}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={handleApprove} disabled={actionLoading}>
                                Approve & Assign
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
