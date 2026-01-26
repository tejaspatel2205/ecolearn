'use client';

import { useState, useEffect } from 'react';
import { Search, FileText, CheckCircle, BarChart3, Users, AlertTriangle, BookOpen, Filter, ArrowUpRight, GraduationCap, Download } from 'lucide-react';
import axios from 'axios';

import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';

interface Student {
    _id: string;
    full_name: string;
    email: string;
}

interface MarkRecord {
    _id: string;
    subject_name: string;
    internal_marks_obtained: number;
    total_internal_marks: number;
    semester: number;
    exam_type: string;
    remarks?: string;
    focus_areas?: string;
}

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ElementType;
    color: 'blue' | 'green' | 'amber' | 'purple';
}

const StatCard = ({ title, value, subtitle, icon: Icon, color }: StatCardProps) => {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        green: 'bg-green-50 text-green-600 border-green-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
        purple: 'bg-violet-50 text-violet-600 border-violet-100'
    };

    const iconBgClasses = {
        blue: 'bg-blue-100/50 text-blue-600',
        green: 'bg-green-100/50 text-green-600',
        amber: 'bg-amber-100/50 text-amber-600',
        purple: 'bg-violet-100/50 text-violet-600'
    };

    return (
        <div className={`p-5 rounded-2xl border transition-all hover:shadow-md ${colorClasses[color]}`}>
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${iconBgClasses[color]}`}>
                    <Icon className="h-6 w-6" />
                </div>
                <div className="px-2.5 py-1 rounded-full bg-white/60 text-xs font-bold backdrop-blur-sm">
                    {subtitle}
                </div>
            </div>
            <div>
                <p className="text-sm font-semibold opacity-80 mb-1">{title}</p>
                <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
            </div>
        </div>
    );
};

export default function ExamPlannerAdmin() {
    const [students, setStudents] = useState<Student[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [marks, setMarks] = useState<MarkRecord[]>([]);
    const [loading, setLoading] = useState(false);

    const [dashboardStats, setDashboardStats] = useState({
        completionRate: '0%',
        avgInternalScore: '0%',
        pendingAssessments: 0,
        activePolicies: 4
    });

    useEffect(() => {
        fetchStudents();
        fetchStats();
    }, [searchQuery]);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/admin/exam-planner-stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDashboardStats(res.data);
        } catch (error) {
            console.error('Error fetching dashboard stats', error);
        }
    };

    const fetchStudents = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/exam-planner/students?query=${searchQuery}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStudents(res.data);
        } catch (error) {
            console.error('Error fetching students', error);
        }
    };

    const downloadReport = () => {
        if (!selectedStudent || marks.length === 0) return;

        // 1. Define CSV Headers
        const headers = ["Subject", "Assessment Type", "Marks Obtained", "Total Marks", "Percentage", "Performance"];

        // 2. Map Data to Rows
        const rows = marks.map(mark => {
            const percentage = mark.total_internal_marks > 0
                ? ((mark.internal_marks_obtained / mark.total_internal_marks) * 100).toFixed(1)
                : "0.0";

            let performanceLabel = "Needs Improvement";
            const numPerc = Number(percentage);
            if (numPerc >= 75) performanceLabel = "Excellent";
            else if (numPerc >= 60) performanceLabel = "Good";
            else if (numPerc >= 40) performanceLabel = "Average";

            return [
                `"${mark.subject_name}"`, // Quote strings to handle commas
                `"${mark.exam_type}"`,
                mark.internal_marks_obtained,
                mark.total_internal_marks,
                `${percentage}%`,
                `"${performanceLabel}"`
            ];
        });

        // 3. Construct CSV Content
        // Add Student Info Block at top
        const studentInfoParams = [
            [`"Student Name:", "${selectedStudent.full_name}"`],
            [`"Email:", "${selectedStudent.email}"`],
            [`"Report Date:", "${new Date().toLocaleDateString()}"`],
            [] // Empty line for spacing
        ];

        const csvContent = [
            ...studentInfoParams.map(e => e.join(",")),
            headers.join(","),
            ...rows.map(e => e.join(","))
        ].join("\n");

        // 4. Trigger Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Report_${selectedStudent.full_name.replace(/ /g, "_")}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const fetchMarks = async (studentId: string) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/exam-planner/marks/${studentId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMarks(res.data);
        } catch (error) {
            console.error("Error fetching marks", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedStudent) {
            fetchMarks(selectedStudent._id);
        } else {
            setMarks([]);
        }
    }, [selectedStudent]);

    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <div className="min-h-screen bg-[#F8FAFC]">
                <Navbar />

                <main className="container mx-auto px-4 pt-24 pb-12 max-w-[1400px]">

                    {/* Header */}
                    <div className="mb-10">
                        <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mb-2">
                            <GraduationCap className="h-4 w-4" />
                            <span>Academic Administration</span>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Examination Oversight</h1>
                        <p className="text-slate-500 mt-2 max-w-2xl text-lg">Monitor internal assessments, grade distributions, and ensure academic data integrity.</p>
                    </div>

                    {/* 5. ADMIN EXAM MODULE UI - Summary Dashboards */}
                    <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        <StatCard
                            title="Assessment Completion"
                            value={dashboardStats.completionRate}
                            subtitle="Sem 1-8"
                            icon={CheckCircle}
                            color="green"
                        />
                        <StatCard
                            title="Avg. Internal Score"
                            value={dashboardStats.avgInternalScore}
                            subtitle="Global"
                            icon={BarChart3}
                            color="blue"
                        />
                        <StatCard
                            title="Pending Reviews"
                            value={dashboardStats.pendingAssessments}
                            subtitle="Action Req."
                            icon={AlertTriangle}
                            color="amber"
                        />
                        <StatCard
                            title="Active Policies"
                            value={dashboardStats.activePolicies}
                            subtitle="NEP 2020"
                            icon={BookOpen}
                            color="purple"
                        />
                    </section>

                    <div className="grid lg:grid-cols-12 gap-8 h-[calc(100vh-320px)] min-h-[600px]">

                        {/* Student Search Sidebar */}
                        <div className="lg:col-span-4 flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                                    <Users className="h-4 w-4 text-indigo-500" />
                                    Student Directory
                                </h2>
                            </div>

                            <div className="p-4 border-b border-slate-100">
                                <div className="relative group">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Search by name or email..."
                                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 text-sm outline-none transition-all"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                                {students.map(student => (
                                    <button
                                        key={student._id}
                                        onClick={() => setSelectedStudent(student)}
                                        className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 border ${selectedStudent?._id === student._id
                                            ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                                            : 'hover:bg-slate-50 border-transparent hover:border-slate-100'
                                            }`}
                                    >
                                        <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${selectedStudent?._id === student._id
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-white border border-slate-200 text-slate-500'
                                            }`}>
                                            {student.full_name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className={`font-semibold text-sm truncate ${selectedStudent?._id === student._id ? 'text-indigo-900' : 'text-slate-700'}`}>
                                                {student.full_name}
                                            </div>
                                            <div className="text-xs text-slate-500 truncate">{student.email}</div>
                                        </div>
                                        {selectedStudent?._id === student._id && <ArrowUpRight className="h-4 w-4 text-indigo-500" />}
                                    </button>
                                ))}
                                {students.length === 0 && (
                                    <div className="text-center py-12">
                                        <div className="bg-slate-50 p-3 rounded-full inline-block mb-3">
                                            <Users className="h-6 w-6 text-slate-300" />
                                        </div>
                                        <p className="text-slate-400 text-sm font-medium">No students found</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Detail View */}
                        <div className="lg:col-span-8 flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                            {selectedStudent ? (
                                <>
                                    {/* Student Header */}
                                    <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-indigo-500 to-purple-600 text-white relative overflow-hidden">
                                        <div className="relative z-10 flex justify-between items-start">
                                            <div className="flex items-center gap-5">
                                                <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-2xl font-bold shadow-inner border border-white/20">
                                                    {selectedStudent.full_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h2 className="text-2xl font-bold tracking-tight">{selectedStudent.full_name}</h2>
                                                    <p className="text-indigo-100 text-sm opacity-90">{selectedStudent.email}</p>
                                                    <div className="flex items-center gap-2 mt-3">
                                                        <span className="px-2.5 py-1 bg-white/20 text-white text-[10px] font-bold uppercase rounded-md tracking-wide backdrop-blur-sm">Good Standing</span>
                                                        <span className="px-2.5 py-1 bg-black/20 text-white text-[10px] font-bold uppercase rounded-md tracking-wide backdrop-blur-sm">Consistent Performer</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={downloadReport}
                                                className="px-4 py-2 bg-white text-indigo-600 rounded-lg text-xs font-bold shadow-lg hover:shadow-xl transition-all hover:bg-slate-50 flex items-center gap-2"
                                            >
                                                <Download className="h-4 w-4" /> Download Report
                                            </button>
                                        </div>

                                        {/* Decorative Background */}
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>
                                    </div>

                                    {/* Stats Grid for Student */}
                                    <div className="flex-1 overflow-auto p-0">
                                        {loading ? (
                                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                                <div className="h-8 w-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                                                <p className="font-medium animate-pulse">Loading academic data...</p>
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-100">
                                                        <tr>
                                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider pl-8">Subject</th>
                                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Assessment Type</th>
                                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Score</th>
                                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Focus Areas</th>
                                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider pr-8">Performance</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-50">
                                                        {marks.map((mark) => {
                                                            const percentage = mark.total_internal_marks > 0 ? (mark.internal_marks_obtained / mark.total_internal_marks) : 0;
                                                            return (
                                                                <tr key={mark._id} className="hover:bg-slate-50/80 transition-colors group">
                                                                    <td className="px-6 py-5 pl-8">
                                                                        <div className="font-bold text-slate-800 text-sm group-hover:text-indigo-700 transition-colors">{mark.subject_name}</div>
                                                                    </td>
                                                                    <td className="px-6 py-5">
                                                                        <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
                                                                            {mark.exam_type}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-6 py-5">
                                                                        <div className="flex items-baseline gap-1">
                                                                            <span className="font-bold text-slate-900 text-base">{mark.internal_marks_obtained}</span>
                                                                            <span className="text-slate-400 text-xs font-medium">/ {mark.total_internal_marks}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-5">
                                                                        <div className="text-sm text-slate-600 max-w-[200px] truncate" title={mark.focus_areas}>
                                                                            {mark.focus_areas || '-'}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-5 pr-8">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                                                <div
                                                                                    className={`h-full rounded-full transition-all duration-1000 ${percentage >= 0.75 ? 'bg-green-500' :
                                                                                        percentage >= 0.50 ? 'bg-indigo-500' :
                                                                                            'bg-amber-500'
                                                                                        }`}
                                                                                    style={{ width: `${percentage * 100}%` }}
                                                                                ></div>
                                                                            </div>
                                                                            <span className={`text-xs font-bold ${percentage >= 0.75 ? 'text-green-600' :
                                                                                percentage >= 0.50 ? 'text-indigo-600' :
                                                                                    'text-amber-600'
                                                                                }`}>{Math.round(percentage * 100)}%</span>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                        {marks.length === 0 && (
                                                            <tr>
                                                                <td colSpan={4} className="px-6 py-20 text-center text-slate-400 text-sm">
                                                                    <div className="flex flex-col items-center gap-3">
                                                                        <div className="p-3 bg-slate-50 rounded-full">
                                                                            <FileText className="h-6 w-6 text-slate-300" />
                                                                        </div>
                                                                        <p>No internal marks recorded for this student.</p>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50/50">
                                    <div className="bg-white p-6 rounded-full shadow-sm mb-6 border border-slate-100">
                                        <Users className="h-10 w-10 text-indigo-200" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">Select a Student</h3>
                                    <p className="text-slate-500 max-w-sm text-sm leading-relaxed">Choose a student from the directory to view their comprehensive academic profile, performance analytics, and assessment history.</p>
                                </div>
                            )}
                        </div>

                    </div>
                </main>
            </div >
        </ProtectedRoute >
    );
}
