'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { Class, Lesson } from '@/lib/types';
import { getLesson, updateLesson, deleteLesson, getClasses } from '@/lib/api';
import Link from 'next/link';
import { Trash2, BarChart2, Save } from 'lucide-react';

export default function EditLessonPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const [classes, setClasses] = useState<Class[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        content: '',
        topic: '',
        class_number: '',
        order_index: 0,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user && params.id) {
            loadData();
        }
    }, [user, params.id]);

    const loadData = async () => {
        try {
            const [lessonData, classesData] = await Promise.all([
                getLesson(params.id as string),
                getClasses()
            ]);

            if (lessonData) {
                setFormData({
                    title: lessonData.title,
                    description: lessonData.description || '',
                    content: lessonData.content,
                    topic: lessonData.topic,
                    class_number: lessonData.class_number ? lessonData.class_number.toString() : '',
                    order_index: lessonData.order_index || 0,
                });
            }

            if (classesData) {
                const teacherClasses = classesData.filter((c: Class) => c.teacher_id === user!.id);
                setClasses(teacherClasses);
            }
        } catch (error) {
            console.error('Error loading data:', error);
            setError('Failed to load lesson data');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSaving(true);

        try {
            await updateLesson(params.id as string, {
                ...formData,
                class_number: formData.class_number || null,
            });

            alert('Lesson updated successfully');
            router.push('/dashboard/teacher');
        } catch (err: any) {
            setError(err.message || 'Failed to update lesson');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this lesson? This action cannot be undone.')) {
            return;
        }

        try {
            await deleteLesson(params.id as string);
            router.push('/dashboard/teacher');
        } catch (err: any) {
            alert('Failed to delete lesson: ' + err.message);
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
                <div className="container mx-auto px-4 pt-28 pb-8 max-w-4xl">
                    <div className="flex justify-between items-center mb-6">
                        <Link
                            href="/dashboard/teacher"
                            className="text-green-600 hover:text-green-700 font-medium"
                        >
                            ← Back to Dashboard
                        </Link>
                        <div className="flex gap-3">
                            <Link
                                href={`/dashboard/teacher/lessons/${params.id}/analytics`}
                                className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                                <BarChart2 className="w-4 h-4 mr-2" />
                                Analytics
                            </Link>
                            <button
                                onClick={handleDelete}
                                className="flex items-center px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Lesson</h1>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                                    Lesson Title *
                                </label>
                                <input
                                    id="title"
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    placeholder="Introduction to Climate Change"
                                />
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    placeholder="Brief description of the lesson"
                                />
                            </div>

                            <div>
                                <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
                                    Topic *
                                </label>
                                <select
                                    id="topic"
                                    value={formData.topic}
                                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                >
                                    <option value="">Select a topic</option>
                                    <option value="Climate Change">Climate Change</option>
                                    <option value="Renewable Energy">Renewable Energy</option>
                                    <option value="Waste Management">Waste Management</option>
                                    <option value="Biodiversity">Biodiversity</option>
                                    <option value="Water Conservation">Water Conservation</option>
                                    <option value="Sustainable Living">Sustainable Living</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="class_number" className="block text-sm font-medium text-gray-700 mb-2">
                                    Class Number (Optional)
                                </label>
                                <input
                                    id="class_number"
                                    type="text"
                                    value={formData.class_number}
                                    onChange={(e) => setFormData({ ...formData, class_number: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    placeholder="e.g., 10 or 1A"
                                />
                            </div>

                            <div>
                                <label htmlFor="order_index" className="block text-sm font-medium text-gray-700 mb-2">
                                    Order Index
                                </label>
                                <input
                                    id="order_index"
                                    type="number"
                                    value={formData.order_index}
                                    onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                                    min="0"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                                    Lesson Content *
                                </label>
                                <textarea
                                    id="content"
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    required
                                    rows={15}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
                                    placeholder="Enter the lesson content here. You can use markdown formatting..."
                                />
                            </div>

                            <div className="flex justify-end space-x-4">
                                <Link
                                    href="/dashboard/teacher"
                                    className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 flex items-center"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
