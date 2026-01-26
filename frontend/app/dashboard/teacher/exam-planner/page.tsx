'use client';

import { useState, useEffect } from 'react';
import { Search, Save, AlertCircle, CheckCircle, Users, BookOpen, Filter, Calendar, ChevronRight, PenTool, Trash2 } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';

interface Student {
    _id: string;
    id?: string;
    full_name: string;
    email: string;
}

interface MarkInput {
    [studentId: string]: {
        marks: string;
        remarks: string;
        focus_areas: string;
    };
}

export default function ExamPlannerTeacher() {
    const [students, setStudents] = useState<Student[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Exam Details State
    const [examContext, setExamContext] = useState({
        subject_name: '',
        exam_type: 'Internal',
        total_marks: '30',
        semester: '1'
    });

    const [marksData, setMarksData] = useState<MarkInput>({});
    const [loading, setLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

    // Initial Load & Search Effect
    useEffect(() => {
        const fetchStudents = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/exam-planner/students?query=${searchQuery}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStudents(res.data);
            } catch (err) {
                console.error("Failed to load students", err);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(() => {
            fetchStudents();
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);


    const handleMarkChange = (studentId: string, field: 'marks' | 'remarks' | 'focus_areas', value: string) => {
        setMarksData(prev => ({
            ...prev,
            [studentId]: {
                ...(prev[studentId] || { marks: '', remarks: '', focus_areas: '' }),
                [field]: value
            }
        }));
    };

    const handleBulkSave = async () => {
        if (!examContext.subject_name) {
            setSaveStatus({ type: 'error', text: 'Please enter a Subject Name first.' });
            return;
        }

        setLoading(true);
        setSaveStatus({ type: 'info', text: 'Saving marks...' });

        try {
            const token = localStorage.getItem('token');
            const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/exam-planner/internal-marks`;

            const entries = Object.entries(marksData);

            if (entries.length === 0) {
                setSaveStatus({ type: 'error', text: 'No marks entered to save.' });
                setLoading(false);
                return;
            }

            const promises = entries.map(([studentId, data]) => {
                if (data.marks === '' || !data.focus_areas) return Promise.resolve(); // Skip invalid or incomplete

                return axios.post(url, {
                    student_id: studentId,
                    subject_name: examContext.subject_name,
                    internal_marks_obtained: Number(data.marks),
                    total_internal_marks: Number(examContext.total_marks),
                    semester: Number(examContext.semester),
                    exam_type: examContext.exam_type,
                    remarks: data.remarks,
                    focus_areas: data.focus_areas
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            });

            await Promise.all(promises);
            setSaveStatus({ type: 'success', text: `Successfully updated records for ${entries.length} students.` });

            setTimeout(() => setSaveStatus(null), 3000);

        } catch (error) {
            console.error('Save failed', error);
            setSaveStatus({ type: 'error', text: 'Failed to save some records. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!examContext.subject_name) {
            setSaveStatus({ type: 'error', text: 'Please enter a Subject Name to delete.' });
            return;
        }
        if (students.length !== 1) {
            setSaveStatus({ type: 'error', text: 'Please filter to exactly one student to delete.' });
            return;
        }

        const student = students[0];
        const confirmDelete = window.confirm(`Are you sure you want to delete '${examContext.subject_name}' for student '${student.full_name}'? This action cannot be undone.`);

        if (!confirmDelete) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/exam-planner/internal-marks`, {
                headers: { Authorization: `Bearer ${token}` },
                data: {
                    student_id: student._id || student.id,
                    subject_name: examContext.subject_name,
                    semester: Number(examContext.semester)
                }
            });

            setSaveStatus({ type: 'success', text: 'Subject deleted successfully.' });

            // Clear local state for this student/subject if needed, or just let the teacher see the success
            setMarksData(prev => {
                const newData = { ...prev };
                delete newData[student._id || student.id || ''];
                return newData;
            });

            setTimeout(() => setSaveStatus(null), 3000);
        } catch (error) {
            console.error('Delete failed', error);
            setSaveStatus({ type: 'error', text: 'Failed to delete subject. It may not exist.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <ProtectedRoute allowedRoles={['teacher']}>
            <div className="min-h-screen bg-[#F8FAFC]">
                <Navbar />

                <main className="container mx-auto px-4 py-8 pt-24 max-w-6xl">

                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Assessment Manager</h1>
                                <p className="text-slate-500 mt-2 text-base">Record internal assessment marks efficiently.</p>
                            </div>

                            <div className="flex items-center gap-3">
                                {saveStatus && (
                                    <div className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium animate-in slide-in-from-right-5 shadow-sm border ${saveStatus.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' :
                                        saveStatus.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
                                            'bg-blue-50 text-blue-700 border-blue-200'
                                        }`}>
                                        {saveStatus.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                        {saveStatus.text}
                                    </div>
                                )}
                                <button
                                    onClick={handleDelete}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-200 rounded-xl font-semibold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete Subject
                                </button>
                                <button
                                    onClick={handleBulkSave}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all shadow-md shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}
                                    Save Marks
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Configuration Panel */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                <PenTool className="h-5 w-5" />
                            </div>
                            <h3 className="font-bold text-slate-800">Assessment Details</h3>
                        </div>

                        <div className="grid md:grid-cols-4 gap-6">

                            {/* Student Search */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Filter Students</label>
                                <div className="relative group">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Name or Email..."
                                        className="w-full pl-10 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Subject Input */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Subject Name</label>
                                <div className="relative group">
                                    <BookOpen className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="e.g. Adv. Mathematics"
                                        className="w-full pl-10 p-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                        value={examContext.subject_name}
                                        onChange={e => setExamContext({ ...examContext, subject_name: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Exam Type Selector */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Type</label>
                                <select
                                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
                                    value={examContext.exam_type}
                                    onChange={e => setExamContext({ ...examContext, exam_type: e.target.value })}
                                >
                                    <option value="Internal">Internal Assessment</option>
                                    <option value="Mid-Term">Mid-Term Exam</option>
                                    <option value="Unit Test">Unit Test</option>
                                    <option value="Practical">Practical / Viva</option>
                                    <option value="Assignment">Assignment</option>
                                </select>
                            </div>

                            {/* Max Marks & Semester */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Max Marks</label>
                                    <input
                                        type="number"
                                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-center font-medium"
                                        value={examContext.total_marks}
                                        onChange={e => setExamContext({ ...examContext, total_marks: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Semester</label>
                                    <select
                                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer text-center font-medium"
                                        value={examContext.semester}
                                        onChange={e => setExamContext({ ...examContext, semester: e.target.value })}
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Student List & Data Entry */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div className="flex items-center gap-2 text-slate-700">
                                <Users className="h-4 w-4 text-indigo-500" />
                                <span className="font-bold">{students.length} Students Found</span>
                            </div>
                            <div className="text-xs text-slate-400 font-medium bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">
                                Enter marks out of {examContext.total_marks}
                            </div>
                        </div>

                        {students.length === 0 && !loading ? (
                            <div className="py-16 text-center">
                                <div className="bg-slate-50 p-4 rounded-full inline-block mb-3">
                                    <Search className="h-8 w-8 text-slate-300" />
                                </div>
                                <p className="text-slate-500 font-medium">No students match your filter.</p>
                                <p className="text-slate-400 text-sm mt-1">Try adjusting the search query.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50/80 text-left">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-16 text-center">#</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student Details</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-32 text-center">Marks</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-48 text-center">Focus Areas <span className="text-red-500">*</span></th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-48 text-center">Remarks</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-24 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <div className="h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                                        Loading students...
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : students.map((student, index) => {
                                            const studentId = student._id || student.id || '';
                                            const studentData = marksData[studentId] || { marks: '', remarks: '', focus_areas: '' };

                                            // Validation Logic
                                            const isMarksFilled = studentData.marks !== '';
                                            const isFocusFilled = studentData.focus_areas.trim() !== '';
                                            const isValidMarks = isMarksFilled && Number(studentData.marks) <= Number(examContext.total_marks) && Number(studentData.marks) >= 0;
                                            const isComplete = isMarksFilled && isFocusFilled;

                                            return (
                                                <tr key={student._id || student.id || index} className="hover:bg-indigo-50/30 transition-colors group">
                                                    <td className="px-6 py-4 text-sm text-slate-400 font-mono text-center">
                                                        {(index + 1).toString().padStart(2, '0')}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-slate-800">{student.full_name}</div>
                                                        <div className="text-xs text-slate-500 font-medium">{student.email}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="relative max-w-[120px] mx-auto">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max={examContext.total_marks}
                                                                className={`w-full p-2.5 pl-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-center font-bold ${!isValidMarks && isMarksFilled
                                                                    ? 'border-red-300 bg-red-50 text-red-600 focus:border-red-500 focus:ring-red-200'
                                                                    : isMarksFilled
                                                                        ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                                                                        : 'border-slate-200 text-slate-700'
                                                                    }`}
                                                                placeholder="-"
                                                                value={studentData.marks}
                                                                onChange={(e) => handleMarkChange(studentId, 'marks', e.target.value)}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <input
                                                            type="text"
                                                            placeholder="Topics to improve..."
                                                            className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                                            value={studentData.focus_areas}
                                                            onChange={(e) => handleMarkChange(studentId, 'focus_areas', e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <input
                                                            type="text"
                                                            placeholder="Optional..."
                                                            className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                                            value={studentData.remarks}
                                                            onChange={(e) => handleMarkChange(studentId, 'remarks', e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {isComplete ? (
                                                            isValidMarks ? (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold border border-green-100">
                                                                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                                                    Ready
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold border border-red-100">
                                                                    Invalid
                                                                </span>
                                                            )
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold border border-slate-200">
                                                                Pending
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                </main>
            </div >
        </ProtectedRoute >
    );
}
