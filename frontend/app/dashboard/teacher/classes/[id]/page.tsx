'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { Class } from '@/lib/types';
import { getClasses, getClassStudents } from '@/lib/api';
import Link from 'next/link';
import { Users, BookOpen, Calendar, Mail } from 'lucide-react';

export default function ManageClassPage({ params }: { params: { id: string } }) {
    const { user } = useAuth();
    const [classData, setClassData] = useState<Class | null>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user, params.id]);

    const loadData = async () => {
        try {
            const classesData = await getClasses();
            const currentClass = classesData.find((c: Class) => (c.id === params.id || (c as any)._id === params.id));

            if (currentClass) {
                setClassData(currentClass);
                // Load students
                const studentsData = await getClassStudents(params.id);
                setStudents(studentsData || []);
            }
        } catch (error) {
            console.error('Error loading class data:', error);
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

    if (!classData) {
        return (
            <ProtectedRoute allowedRoles={['teacher']}>
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Class not found</h1>
                        <Link href="/dashboard/teacher/classes" className="text-green-600 hover:underline">
                            Return to Classes
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
                <div className="container mx-auto px-4 pt-24 pb-8">
                    <Link
                        href="/dashboard/teacher/classes"
                        className="text-green-600 hover:text-green-700 font-medium mb-4 inline-block"
                    >
                        ← Back to Classes
                    </Link>

                    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{classData.name}</h1>
                        <div className="flex items-center text-gray-600 space-x-6 mt-4">
                            <div className="flex items-center">
                                <Users className="w-5 h-5 mr-2" />
                                {students.length} Students
                            </div>
                            <div className="flex items-center">
                                <Calendar className="w-5 h-5 mr-2" />
                                Created: {new Date(classData.created_at || '').toLocaleDateString()}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-gray-800">Enrolled Students</h2>
                            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                                Total: {students.length}
                            </span>
                        </div>

                        {students.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                No students enrolled in this class yet.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {students.map((student) => (
                                            <tr key={student._id || student.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                                    {student.full_name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-600 flex items-center">
                                                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                                                    {student.email}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                                    {/* Assuming joined_at or similar exists, fallback to N/A */}
                                                    {student.joined_at ? new Date(student.joined_at).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:text-blue-900 cursor-pointer">
                                                    View Progress
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
