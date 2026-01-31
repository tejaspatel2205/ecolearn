'use client';

import { useState, useEffect, useRef } from 'react';
import { Target, TrendingUp, BookOpen, AlertCircle, Award, ChevronRight, BarChart, Sparkles, UserCheck, ArrowRight, X, MessageSquare, Send, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';

interface MarkRecord {
    _id: string;
    subject_name: string;
    internal_marks_obtained: number;
    total_internal_marks: number;
    semester: number;
    exam_type: string;
    remarks?: string;
    focus_areas?: string;
    created_at?: string;
}

interface Prediction {
    subject: string;
    target_grade: string;
    internal_obtained: number;
    internal_max: number;
    required_external_marks: number;
    message: string;
    trend?: 'improving' | 'declining' | 'stable';
    priority?: 'high' | 'medium' | 'low';
    readiness?: 'on_track' | 'needs_focus' | 'critical';
    advice?: string;
    feasibility?: 'achievable' | 'ambitious' | 'hard';
    action_plan?: string;
}

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export default function ExamPlannerStudent() {
    const [marks, setMarks] = useState<MarkRecord[]>([]);
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [guidanceData, setGuidanceData] = useState<any[]>([]); // New AI Guidance
    const [selectedSemester, setSelectedSemester] = useState<number>(1);

    // UI Refs for scrolling
    const aiSectionRef = useRef<HTMLElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Goal setting form
    const [goalForm, setGoalForm] = useState({
        subject_name: '',
        target_grade: 'A',
    });
    const [loading, setLoading] = useState(false);
    const [guidanceLoading, setGuidanceLoading] = useState(false); // Separated loading state

    // Modals State
    const [showGoalModal, setShowGoalModal] = useState(false);
    const [showFullReportModal, setShowFullReportModal] = useState(false);

    // New Features State
    const [showSubjectModal, setShowSubjectModal] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [showImprovementModal, setShowImprovementModal] = useState(false);
    const [showChatModal, setShowChatModal] = useState(false);

    const [expandedProblemSubject, setExpandedProblemSubject] = useState<string | null>(null); // For accordion

    const [selectedGuidanceSubject, setSelectedGuidanceSubject] = useState<string | null>(null); // New: Filter for Guidance
    const [guidanceInputSubject, setGuidanceInputSubject] = useState<string>(''); // For manual generation input
    const [customSubject, setCustomSubject] = useState<string>('');
    const [customTopic, setCustomTopic] = useState<string>('');

    // Chat State
    const [chatInput, setChatInput] = useState('');
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
        { role: 'assistant', content: 'Hello! I am your Academic Assistant. I can help you analyze your grades or suggest study plans. How can I help you today?' }
    ]);
    const [chatLoading, setChatLoading] = useState(false);

    useEffect(() => {
        fetchSemesterData(selectedSemester);
    }, [selectedSemester]);

    useEffect(() => {
        if (showChatModal) {
            scrollToBottom();
        }
    }, [chatHistory, showChatModal]);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchSemesterData = async (semester: number) => {
        setLoading(true);
        setMarks([]); // Strict UI Rule: Clear previous data immediately
        try {
            const token = localStorage.getItem('token');
            // Strict Semester Filtering: Fetch only what is displayed
            const marksRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/exam-planner/marks/me?semester=${semester}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMarks(marksRes.data);

            // Predictions currently rely on historical data (handled by backend or this endpoint needs update too)
            // For now, we fetch predictions separately. Ideally backend should filter these too if strict privacy is needed per semester for predictions.
            fetchPredictions(token);
            // Fetch detailed guidance only if marks exist
            if (marksRes.data && marksRes.data.length > 0) {
                // Auto-fetch removed as per request. User must clear/generate manually.
                // fetchGuidance(token); 
            }
        } catch (error) {
            console.error('Error loading data', error);
            setMarks([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchGuidance = async (subject: string) => {
        if (!subject) return;
        setGuidanceLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/exam-planner/guidance`,
                { subject: subject === 'Others' ? customSubject : subject, topic: subject === 'Others' ? customTopic : undefined },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data) {
                // Backend returns { guidance: [...] }
                const items = res.data.guidance || (Array.isArray(res.data) ? res.data : [res.data]);
                // Ensure items is an array
                const newGuidanceItems = Array.isArray(items) ? items : [items];

                if (newGuidanceItems.length === 0) {
                    // Handle empty response logic if needed, or just return
                    return;
                }

                setGuidanceData(prev => {
                    // Create a map of existing items for easier checking
                    const newSubjects = new Set(newGuidanceItems.map((item: any) => item.subject));
                    // Remove OLD entries for the same subjects (update them), keep entries for OTHER subjects
                    const filteredPrev = prev.filter(item => !newSubjects.has(item.subject));
                    return [...filteredPrev, ...newGuidanceItems];
                });

                // Auto-select the requested subject if it exists in the response
                const foundSubject = newGuidanceItems.find((item: any) => item.subject === subject);
                if (foundSubject) {
                    setSelectedGuidanceSubject(subject);
                }
                if (foundSubject) {
                    setSelectedGuidanceSubject(subject === 'Others' ? customSubject : subject);
                }
                setGuidanceInputSubject(''); // Clear input
                setCustomSubject('');
                setCustomTopic('');
            }
        } catch (error: any) {
            console.error("Error fetching AI guidance", error);
            // Show user-friendly error message
            if (error.response?.data?.error) {
                alert(`Guidance generation failed: ${error.response.data.error}`);
            }
        } finally {
            setGuidanceLoading(false);
        }
    };

    const fetchPredictions = async (token: string | null) => {
        try {
            const predRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/exam-planner/prediction`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPredictions(predRes.data);
        } catch (err) {
            console.error("Error fetching predictions", err);
        }
    }

    const handleGoalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/exam-planner/goals`,
                { ...goalForm, target_sgpa: '' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchPredictions(token);
            setGoalForm(prev => ({ ...prev, subject_name: '' }));
            setShowGoalModal(false);
        } catch (error) {
            console.error("Failed to save goal", error);
            alert('Could not save goal.');
        } finally {
            setLoading(false);
        }
    };

    const scrollToAnalysis = () => {
        if (aiSectionRef.current) {
            aiSectionRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const openSubjectModal = (subject: string) => {
        setSelectedSubject(subject);
        setShowSubjectModal(true);
    };

    const handleChatSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        const userMsg = chatInput;
        setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
        setChatInput('');
        setChatLoading(true);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/exam-planner/chat`,
                {
                    message: userMsg,
                    context: { predictions, marks }
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setChatHistory(prev => [...prev, { role: 'assistant', content: res.data.response }]);
        } catch (error) {
            console.error('Chat error', error);
            setChatHistory(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now. Please try again later." }]);
        } finally {
            setChatLoading(false);
        }
    };

    // Derived State
    const currentSemesterMarks = marks; // Backend now strictly filters this
    const uniqueSubjects = Array.from(new Set(currentSemesterMarks.map(m => m.subject_name)));
    const avgScore = currentSemesterMarks.length > 0
        ? Math.round(currentSemesterMarks.reduce((acc, m) => acc + (m.internal_marks_obtained / m.total_internal_marks) * 100, 0) / currentSemesterMarks.length)
        : 0;

    const getStatusColor = (percentage: number) => {
        if (percentage >= 80) return 'text-green-600 bg-green-50 border-green-200';
        if (percentage >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
        if (percentage >= 40) return 'text-amber-600 bg-amber-50 border-amber-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    const getStatusText = (percentage: number) => {
        if (percentage >= 80) return 'Excellent';
        if (percentage >= 60) return 'Good';
        if (percentage >= 40) return 'Needs Attention';
        return 'Critical';
    };

    return (
        <ProtectedRoute allowedRoles={['student']}>
            <div className="min-h-screen bg-[#F8FAFC]">
                <Navbar />

                <main className="container mx-auto px-4 py-8 pt-24 max-w-6xl">

                    {/* Header */}
                    <header className="mb-8">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Exam Planner & Achievement Predictor</h1>
                                <p className="text-slate-500 mt-2 text-base">Plan your semester exams, track internal progress, and predict your grades.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <select
                                    className="p-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm cursor-pointer hover:border-indigo-300 transition-colors"
                                    value={selectedSemester}
                                    onChange={(e) => setSelectedSemester(Number(e.target.value))}
                                >
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                                </select>
                                <div className="bg-white px-4 py-2.5 rounded-lg border border-slate-200 shadow-sm text-sm font-medium text-slate-600">
                                    FY 2025-26
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Main Content Area */}
                    {marks.length > 0 ? (
                        <>
                            {/* Summary Section */}
                            <section className="mb-8 grid md:grid-cols-12 gap-6">
                                <div className="md:col-span-8 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
                                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                                        <div className="flex items-center gap-5">
                                            <div className={`h-20 w-20 rounded-full flex items-center justify-center text-2xl font-bold bg-white border-4 shadow-sm ${avgScore >= 75 ? 'border-green-100 text-green-600' : 'border-blue-100 text-blue-600'
                                                }`}>
                                                {avgScore}%
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-bold text-slate-800">Overall Academic Standing</h2>
                                                <p className="text-slate-500 text-sm mt-1">Based on current internal assessments</p>
                                                <div className="mt-3 flex items-center gap-2">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${avgScore >= 75 ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                                                        }`}>
                                                        {avgScore >= 75 ? 'Strong Performance' : 'Consistent Progress'}
                                                    </span>
                                                    <span className="text-xs text-slate-400">•</span>
                                                    <span className="text-xs text-slate-500">Keep it up!</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-full md:w-48 bg-slate-50 rounded-xl p-4 border border-slate-100">
                                            <div className="text-xs text-slate-500 font-semibold uppercase mb-2">Subject Coverage</div>
                                            <div className="flex justify-between items-end mb-1">
                                                <span className="text-2xl font-bold text-slate-800">{uniqueSubjects.length}</span>
                                                <span className="text-xs text-slate-400 mb-1">Active Subjects</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 bg-slate-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                                </div>

                                <div className="md:col-span-4 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center group hover:shadow-md transition-shadow relative overflow-hidden">
                                    <div className="relative z-10 flex flex-col items-center">
                                        <div className="mb-4 p-4 bg-indigo-50 rounded-full group-hover:scale-110 transition-transform duration-300">
                                            <Target className="h-8 w-8 text-indigo-600" />
                                        </div>
                                        <h4 className="font-bold text-slate-800 text-lg mb-2">Set Your Targets</h4>
                                        <p className="text-slate-500 text-sm mb-6 max-w-[200px]">
                                            Define your academic goals to get personalized AI advice.
                                        </p>

                                        <button
                                            onClick={() => setShowGoalModal(true)}
                                            className="w-full py-3 px-6 bg-slate-900 text-white rounded-xl font-semibold shadow-lg shadow-slate-200 hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                                        >
                                            <span className="text-lg">+</span> Set New Goal
                                        </button>
                                    </div>
                                    <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 bg-indigo-50 rounded-full blur-2xl opacity-50 pointer-events-none"></div>
                                </div>
                            </section>

                            {/* Subject Cards */}
                            <section className="mb-10">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                        <BookOpen className="h-5 w-5 text-indigo-500" />
                                        Subject Performance
                                    </h3>
                                    <button
                                        onClick={() => setShowFullReportModal(true)}
                                        className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
                                    >
                                        View Full Report
                                    </button>
                                </div>

                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {uniqueSubjects.length > 0 ? uniqueSubjects.map((subject) => {
                                        const subjectMarks = currentSemesterMarks.filter(m => m.subject_name === subject);
                                        const totalObtained = subjectMarks.reduce((sum, m) => sum + m.internal_marks_obtained, 0);
                                        const totalMax = subjectMarks.reduce((sum, m) => sum + m.total_internal_marks, 0);
                                        const percentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
                                        const statusClass = getStatusColor(percentage);
                                        const statusLabel = getStatusText(percentage);

                                        return (
                                            <div key={subject} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                                                <div className="flex justify-between items-start mb-4">
                                                    <h4 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors text-lg truncate pr-2" title={subject}>
                                                        {subject}
                                                    </h4>
                                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusClass}`}>
                                                        {statusLabel}
                                                    </span>
                                                </div>

                                                <div className="space-y-4">
                                                    <div>
                                                        <div className="flex justify-between text-sm mb-1.5">
                                                            <span className="text-slate-500">Internal Score</span>
                                                            <span className="font-bold text-slate-700">{totalObtained} <span className="text-slate-400 font-normal">/ {totalMax}</span></span>
                                                        </div>
                                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-1000 ${percentage >= 75 ? 'bg-green-500' : percentage >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`}
                                                                style={{ width: `${percentage}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>

                                                    <div className="pt-3 border-t border-slate-50 flex justify-between items-center">
                                                        <div className="text-xs text-slate-400">
                                                            {subjectMarks.length} Assessment{subjectMarks.length !== 1 ? 's' : ''}
                                                        </div>
                                                        <button
                                                            onClick={() => openSubjectModal(subject)}
                                                            className="text-xs font-semibold text-indigo-600 flex items-center hover:underline"
                                                        >
                                                            Details <ChevronRight className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }) : (
                                        <div className="col-span-full py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                            <div className="bg-white p-3 rounded-full shadow-sm inline-block mb-3">
                                                <BookOpen className="h-6 w-6 text-slate-400" />
                                            </div>
                                            <p className="text-slate-600 font-medium">No subjects found for this semester.</p>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* New: Focus Areas & Remarks Section */}
                            <section className="mb-10">
                                <div className="flex items-center gap-2 mb-6">
                                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                        <Target className="h-5 w-5 text-indigo-500" />
                                        Areas for Improvement
                                    </h3>
                                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">Focused Analysis</span>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    {uniqueSubjects.map(subject => {
                                        // Get all marks for this subject that have focus areas
                                        const subjectFocusPoints = currentSemesterMarks
                                            .filter(m => m.subject_name === subject && m.focus_areas)
                                            .map(m => ({ exam: m.exam_type, focus: m.focus_areas }));

                                        if (subjectFocusPoints.length === 0) return null;

                                        return (
                                            <div key={subject} className="bg-orange-50/50 border border-orange-100 rounded-xl p-5 hover:shadow-sm transition-shadow">
                                                <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                                                    {subject}
                                                </h4>
                                                <div className="space-y-3">
                                                    {subjectFocusPoints.map((point, idx) => (
                                                        <div key={idx} className="bg-white p-3 rounded-lg border border-orange-100/50 text-sm shadow-sm">
                                                            <div className="text-xs font-semibold text-orange-600 mb-1 uppercase tracking-wide">{point.exam}</div>
                                                            <div className="text-slate-700 leading-relaxed">{point.focus}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {/* Fallback if no focus areas found at all across subjects (though map returns null for individual subjects) */}
                                    {currentSemesterMarks.every(m => !m.focus_areas) && (
                                        <div className="col-span-full py-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                            No focus areas identified by teachers yet. Keep up the good work!
                                        </div>
                                    )}
                                </div>
                            </section>

                            <div className="grid lg:grid-cols-12 gap-8">
                                {/* AI Guidance Panel */}
                                <section ref={aiSectionRef} className="col-span-full bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden scroll-mt-24">
                                    <div className="bg-indigo-50/50 p-6 border-b border-indigo-100/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div>
                                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-lg">
                                                <Sparkles className="h-5 w-5 text-indigo-500" />
                                                Personalized Guidance
                                            </h3>
                                            <p className="text-slate-500 text-sm mt-1">AI-driven insights to improve your score before the finals.</p>
                                        </div>

                                        <div className="mt-4 md:mt-0 flex items-center gap-3">
                                            {/* Manual Generation Input */}
                                            <div className="flex flex-col md:flex-row items-end gap-3">
                                                {guidanceInputSubject === 'Others' && (
                                                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                                                        <div className="relative">
                                                            <input
                                                                type="text"
                                                                placeholder="Enter Subject Name..."
                                                                value={customSubject}
                                                                onChange={(e) => setCustomSubject(e.target.value)}
                                                                className="pl-3 pr-3 py-2 w-48 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm placeholder:text-slate-400"
                                                            />
                                                        </div>
                                                        <div className="relative">
                                                            <input
                                                                type="text"
                                                                placeholder="Enter Specific Topic..."
                                                                value={customTopic}
                                                                onChange={(e) => setCustomTopic(e.target.value)}
                                                                className="pl-3 pr-3 py-2 w-48 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm placeholder:text-slate-400"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-2">
                                                    <select
                                                        value={guidanceInputSubject}
                                                        onChange={(e) => setGuidanceInputSubject(e.target.value)}
                                                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm cursor-pointer"
                                                    >
                                                        <option value="">Select Subject to Analyze...</option>
                                                        {uniqueSubjects.map(s => (
                                                            <option key={s} value={s}>{s}</option>
                                                        ))}
                                                        <option value="Others" className="font-semibold text-indigo-600">✨ Others (Custom Topic)</option>
                                                    </select>
                                                    <button
                                                        onClick={() => fetchGuidance(guidanceInputSubject)}
                                                        disabled={!guidanceInputSubject || guidanceLoading || (guidanceInputSubject === 'Others' && (!customSubject || !customTopic))}
                                                        className={`px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-2 transition-all ${!guidanceInputSubject || guidanceLoading || (guidanceInputSubject === 'Others' && (!customSubject || !customTopic))
                                                            ? 'bg-slate-300 cursor-not-allowed'
                                                            : 'bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg'
                                                            }`}
                                                    >
                                                        {guidanceLoading ? (
                                                            <>
                                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                                Analyzing...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Sparkles className="w-4 h-4" />
                                                                Start Analysis
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Subject Filters (Tabs) - Only show if we have data */}
                                    {guidanceData.length > 0 && (
                                        <div className="px-6 py-3 bg-white border-b border-slate-100 flex flex-wrap gap-2 overflow-x-auto">
                                            <button
                                                onClick={() => setSelectedGuidanceSubject(null)}
                                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${!selectedGuidanceSubject
                                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                                    }`}
                                            >
                                                All Subjects
                                            </button>
                                            {guidanceData.filter((item: any) => item.subject).map((item: any) => (
                                                <button
                                                    key={item.subject}
                                                    onClick={() => setSelectedGuidanceSubject(item.subject)}
                                                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${selectedGuidanceSubject === item.subject
                                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-100'
                                                        }`}
                                                >
                                                    {item.subject}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <div className="p-6">
                                        {guidanceData.length > 0 ? (
                                            <div className="grid gap-6">
                                                {guidanceData
                                                    .filter((item: any) => !selectedGuidanceSubject || item.subject === selectedGuidanceSubject)
                                                    .map((item: any, i: number) => (
                                                        <div key={i} className="p-6 rounded-xl bg-gradient-to-br from-white to-slate-50 border border-slate-200 hover:shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                            {/* Header Section */}
                                                            <div className="flex justify-between items-start mb-4 pb-4 border-b border-slate-200">
                                                                <div className="flex-1">
                                                                    <h4 className="font-bold text-slate-900 text-xl mb-2">{item.subject}</h4>
                                                                    <div className="flex flex-wrap items-center gap-3">
                                                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${item.currentStatus?.includes('Critical') || item.currentStatus?.includes('Needs Improvement')
                                                                            ? 'bg-red-100 text-red-700'
                                                                            : item.currentStatus?.includes('Average')
                                                                                ? 'bg-yellow-100 text-yellow-700'
                                                                                : item.currentStatus?.includes('Good')
                                                                                    ? 'bg-blue-100 text-blue-700'
                                                                                    : 'bg-green-100 text-green-700'
                                                                            }`}>
                                                                            {item.currentStatus || 'Analyzing...'}
                                                                        </span>
                                                                        {item.performancePercentage !== undefined && (
                                                                            <span className="text-sm text-slate-600 font-medium">
                                                                                Score: {item.performancePercentage}%
                                                                            </span>
                                                                        )}
                                                                        {item.targetScore && (
                                                                            <span className="text-sm text-indigo-600 font-semibold">
                                                                                Target: {item.targetScore}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Strengths & Weak Areas */}
                                                            {(item.strengths?.length > 0 || item.weakAreas?.length > 0) && (
                                                                <div className="grid md:grid-cols-2 gap-4 mb-4">
                                                                    {item.strengths?.length > 0 && (
                                                                        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                                                            <h5 className="font-semibold text-green-800 text-sm mb-3 flex items-center gap-2">
                                                                                <Award className="w-4 h-4" /> Strengths
                                                                            </h5>
                                                                            <ul className="space-y-2">
                                                                                {item.strengths.map((strength: string, idx: number) => (
                                                                                    <li key={idx} className="text-xs text-green-700 flex items-start gap-2">
                                                                                        <span className="text-green-500 mt-1 shrink-0">✓</span>
                                                                                        <span>{strength}</span>
                                                                                    </li>
                                                                                ))}
                                                                            </ul>
                                                                        </div>
                                                                    )}
                                                                    {item.weakAreas?.length > 0 && (
                                                                        <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                                                            <h5 className="font-semibold text-red-800 text-sm mb-3 flex items-center gap-2">
                                                                                <AlertCircle className="w-4 h-4" /> Areas to Improve
                                                                            </h5>
                                                                            <ul className="space-y-2">
                                                                                {item.weakAreas.map((area: string, idx: number) => (
                                                                                    <li key={idx} className="text-xs text-red-700 flex items-start gap-2">
                                                                                        <span className="text-red-500 mt-1 shrink-0">•</span>
                                                                                        <span>{area}</span>
                                                                                    </li>
                                                                                ))}
                                                                            </ul>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Detailed Advice */}
                                                            {item.advice && (
                                                                <div className="mb-4 bg-white p-5 rounded-xl border border-indigo-100 shadow-sm relative overflow-hidden">
                                                                    <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50 rounded-bl-full -mr-8 -mt-8"></div>
                                                                    <h5 className="font-semibold text-indigo-700 text-sm mb-3 flex items-center gap-2 relative z-10">
                                                                        <Sparkles className="w-4 h-4" /> Personalized Guidance
                                                                    </h5>
                                                                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line relative z-10">
                                                                        {item.advice}
                                                                    </p>
                                                                </div>
                                                            )}

                                                            {/* Study Plan */}
                                                            {item.studyPlan && (
                                                                <div className="mb-4 bg-blue-50 p-5 rounded-xl border border-blue-100">
                                                                    <h5 className="font-semibold text-blue-800 text-sm mb-4 flex items-center gap-2">
                                                                        <Target className="w-4 h-4" /> Recommended Study Plan
                                                                    </h5>
                                                                    <div className="grid md:grid-cols-2 gap-4">
                                                                        {item.studyPlan.weekly && item.studyPlan.weekly.length > 0 && (
                                                                            <div className="bg-white/50 p-3 rounded-lg">
                                                                                <h6 className="text-xs font-bold text-blue-700 mb-2 uppercase tracking-wide">Weekly Focus</h6>
                                                                                <ul className="space-y-2">
                                                                                    {item.studyPlan.weekly.map((week: string, idx: number) => (
                                                                                        <li key={idx} className="text-xs text-blue-800 flex items-start gap-2">
                                                                                            <span className="text-blue-500 mt-0.5">▸</span>
                                                                                            <span>{week}</span>
                                                                                        </li>
                                                                                    ))}
                                                                                </ul>
                                                                            </div>
                                                                        )}
                                                                        {item.studyPlan.daily && item.studyPlan.daily.length > 0 && (
                                                                            <div className="bg-white/50 p-3 rounded-lg">
                                                                                <h6 className="text-xs font-bold text-blue-700 mb-2 uppercase tracking-wide">Daily Habits</h6>
                                                                                <ul className="space-y-2">
                                                                                    {item.studyPlan.daily.map((day: string, idx: number) => (
                                                                                        <li key={idx} className="text-xs text-blue-800 flex items-start gap-2">
                                                                                            <span className="text-blue-500 mt-0.5">▸</span>
                                                                                            <span>{day}</span>
                                                                                        </li>
                                                                                    ))}
                                                                                </ul>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Recommended Topics */}
                                                            {item.recommendedTopics && item.recommendedTopics.length > 0 && (
                                                                <div className="mb-4 bg-purple-50 p-4 rounded-xl border border-purple-100">
                                                                    <h5 className="font-semibold text-purple-800 text-xs mb-3">Recommended Topics to Focus On:</h5>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {item.recommendedTopics.map((topic: string, idx: number) => (
                                                                            <span key={idx} className="px-3 py-1.5 bg-white text-purple-700 text-xs font-medium rounded-full border border-purple-100 shadow-sm">
                                                                                {topic}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Practice Problems Accordion */}
                                                            {item.practiceProblems && item.practiceProblems.length > 0 && (
                                                                <div className="mt-4 pt-4 border-t border-slate-200">
                                                                    <button
                                                                        onClick={() => setExpandedProblemSubject(expandedProblemSubject === item.subject ? null : item.subject)}
                                                                        className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 px-4 py-2 rounded-lg w-full justify-center md:w-auto md:justify-start mb-4"
                                                                    >
                                                                        <BookOpen className="w-4 h-4" />
                                                                        {expandedProblemSubject === item.subject ? "Hide Practice Problems" : `View ${item.practiceProblems.length} Practice Problems`}
                                                                    </button>

                                                                    {expandedProblemSubject === item.subject && (
                                                                        <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                                                                            {item.practiceProblems.map((prob: any, idx: number) => (
                                                                                <div key={idx} className="bg-white p-5 rounded-lg border-2 border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                                                                    <div className="flex items-start gap-3 mb-3">
                                                                                        <div className="bg-indigo-100 text-indigo-700 font-bold text-sm px-3 py-1 rounded-full">
                                                                                            Problem {idx + 1}
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="mb-4">
                                                                                        <p className="font-medium text-slate-800 text-sm leading-relaxed whitespace-pre-line">
                                                                                            {prob.problem}
                                                                                        </p>
                                                                                    </div>
                                                                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                                                                                        <h6 className="font-bold text-green-800 text-sm mb-2 flex items-center gap-2">
                                                                                            <CheckCircle className="w-4 h-4" /> Detailed Solution:
                                                                                        </h6>
                                                                                        <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line font-mono text-xs bg-white p-3 rounded border border-green-100">
                                                                                            {prob.solution}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 text-slate-500">
                                                {guidanceLoading ? (
                                                    <div className="flex flex-col items-center">
                                                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
                                                        <p className="text-sm font-medium">Analyzing your performance...</p>
                                                        <p className="text-xs mt-2 text-slate-400">Generating personalized AI insights and practice problems</p>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center">
                                                        <Sparkles className="w-12 h-12 text-slate-300 mb-3" />
                                                        <p className="text-sm">Add internal marks to generate personalized AI insights.</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>
                        </>
                    ) : (
                        // EMPTY STATE: Display ONLY Goal Setting when no marks exist
                        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
                            <div className="bg-white p-8 rounded-3xl shadow-lg shadow-slate-200 border border-slate-100 max-w-md w-full text-center relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                                <div className="mb-6 p-5 bg-indigo-50 rounded-full inline-flex items-center justify-center">
                                    <Target className="h-10 w-10 text-indigo-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-3">Start with a Goal!</h2>
                                <p className="text-slate-500 mb-8 leading-relaxed">
                                    No marks have been recorded for this semester yet. Set your academic targets now to let our AI build a personalized improvement roadmap for you.
                                </p>
                                <button
                                    onClick={() => setShowGoalModal(true)}
                                    className="w-full py-3.5 px-6 bg-slate-900 text-white rounded-xl font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                                >
                                    <Target className="h-5 w-5" /> Set Your First Target
                                </button>
                                <div className="mt-6 pt-6 border-t border-slate-50 text-xs text-slate-400">
                                    Your dashboard will unlock automatically once your first assessment marks are entered by your teacher.
                                </div>
                            </div>
                        </div>
                    )}


                    {/* --- MODALS --- */}

                    {/* 1. Subject Details Modal */}
                    {showSubjectModal && selectedSubject && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-in fade-in zoom-in duration-200">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold text-slate-900">{selectedSubject} - Performance</h3>
                                    <button onClick={() => setShowSubjectModal(false)} className="text-slate-400 hover:text-slate-600">
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {currentSemesterMarks.filter(m => m.subject_name === selectedSubject).map((mark, i) => (
                                        <div key={i} className="mb-3 bg-slate-50 rounded-lg border border-slate-100 overflow-hidden">
                                            <div className="flex justify-between items-center p-3">
                                                <div>
                                                    <div className="font-medium text-slate-800">{mark.exam_type}</div>
                                                    <div className="text-xs text-slate-500">Max: {mark.total_internal_marks}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold text-slate-900 text-lg">{mark.internal_marks_obtained}</div>
                                                    <div className={`text-xs font-semibold ${(mark.internal_marks_obtained / mark.total_internal_marks) >= 0.75 ? 'text-green-600' :
                                                        (mark.internal_marks_obtained / mark.total_internal_marks) >= 0.5 ? 'text-blue-600' : 'text-amber-600'
                                                        }`}>
                                                        {Math.round((mark.internal_marks_obtained / mark.total_internal_marks) * 100)}%
                                                    </div>
                                                </div>
                                            </div>
                                            {(mark.focus_areas || mark.remarks) && (
                                                <div className="px-3 pb-3 pt-0">
                                                    <div className="text-xs text-slate-600 bg-white p-2.5 rounded border border-slate-200">
                                                        {mark.focus_areas && (
                                                            <div className="mb-1.5"><span className="font-bold text-indigo-600 uppercase text-[10px] tracking-wide">Focus Area:</span> <span className="block mt-0.5">{mark.focus_areas}</span></div>
                                                        )}
                                                        {mark.remarks && (
                                                            <div><span className="font-bold text-slate-500 uppercase text-[10px] tracking-wide">Teacher's Note:</span> <span className="block mt-0.5 italic">{mark.remarks}</span></div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {currentSemesterMarks.filter(m => m.subject_name === selectedSubject).length === 0 && (
                                        <div className="text-center text-slate-400">No marks recorded yet.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. Improvement Plan Modal */}
                    {showImprovementModal && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 animate-in fade-in zoom-in duration-200">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">Your Improvement Plan</h3>
                                        <p className="text-slate-500 text-sm">Actionable steps generated by AI.</p>
                                    </div>
                                    <button onClick={() => setShowImprovementModal(false)} className="text-slate-400 hover:text-slate-600">
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                                    {predictions.filter(p => p.action_plan).length > 0 ? (
                                        predictions.filter(p => p.action_plan).map((pred, i) => (
                                            <div key={i} className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl relative">
                                                <div className="absolute top-4 right-4 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                                                    {pred.subject}
                                                </div>
                                                <h4 className="font-semibold text-indigo-900 mb-2">Goal: {pred.target_grade}</h4>
                                                <div className="flex gap-3 items-start">
                                                    <div className="bg-white p-1.5 rounded-full shadow-sm mt-0.5">
                                                        <TrendingUp className="h-4 w-4 text-indigo-600" />
                                                    </div>
                                                    <p className="text-indigo-800 text-sm leading-relaxed">{pred.action_plan}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                            <p className="text-slate-500">No improvement actions generated yet. Set more specific goals to get a plan!</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3. Academic Assistant Chat Modal */}
                    {showChatModal && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md h-[600px] flex flex-col animate-in slide-in-from-bottom duration-200">
                                {/* Chat Header */}
                                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-indigo-600 rounded-t-2xl text-white">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white/20 p-2 rounded-full">
                                            <Sparkles className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold">Academic Assistant</h3>
                                            <p className="text-indigo-100 text-xs">AI-powered & Context aware</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowChatModal(false)} className="text-white/70 hover:text-white transition-colors">
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                {/* Chat Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                                    {chatHistory.map((msg, i) => (
                                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.role === 'user'
                                                ? 'bg-indigo-600 text-white rounded-tr-none'
                                                : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-tl-none'
                                                }`}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    ))}
                                    {chatLoading && (
                                        <div className="flex justify-start">
                                            <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-100">
                                                <div className="flex gap-1">
                                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                {/* Chat Input */}
                                <form onSubmit={handleChatSubmit} className="p-4 border-t border-slate-100 bg-white rounded-b-2xl">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Ask about your grades or study tips..."
                                            className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm"
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                        />
                                        <button
                                            type="submit"
                                            disabled={!chatInput.trim() || chatLoading}
                                            className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <Send className="h-5 w-5" />
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Full Report Modal (Existing) */}
                    {showFullReportModal && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">Detailed Performance Report</h3>
                                        <p className="text-slate-500 text-sm">Full history of all internal assessments and exams.</p>
                                    </div>
                                    <button onClick={() => setShowFullReportModal(false)} className="p-2 bg-white rounded-full hover:bg-slate-100 transition-colors border border-slate-200 text-slate-500">
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="overflow-y-auto p-6">
                                    <div className="border rounded-lg overflow-hidden border-slate-200">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                                <tr>
                                                    <th className="px-6 py-3">Subject</th>
                                                    <th className="px-6 py-3">Exam Type</th>
                                                    <th className="px-6 py-3">Score</th>
                                                    <th className="px-6 py-3">Percentage</th>
                                                    <th className="px-6 py-3">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {marks.map((mark, idx) => {
                                                    const pct = mark.total_internal_marks > 0 ? Math.round((mark.internal_marks_obtained / mark.total_internal_marks) * 100) : 0;
                                                    return (
                                                        <tr key={mark._id || idx} className="hover:bg-slate-50/50">
                                                            <td className="px-6 py-4 font-medium text-slate-900">{mark.subject_name}</td>
                                                            <td className="px-6 py-4 text-slate-500">{mark.exam_type}</td>
                                                            <td className="px-6 py-4 text-slate-900 font-medium">
                                                                {mark.internal_marks_obtained} <span className="text-slate-400 font-normal">/ {mark.total_internal_marks}</span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                        <div className={`h-full rounded-full ${pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }}></div>
                                                                    </div>
                                                                    <span className="text-xs text-slate-500">{pct}%</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${pct >= 75 ? 'bg-green-100 text-green-700' :
                                                                    pct >= 50 ? 'bg-blue-100 text-blue-700' :
                                                                        'bg-amber-100 text-amber-700'
                                                                    }`}>
                                                                    {pct >= 75 ? 'Excellent' : pct >= 50 ? 'Good' : 'Needs Work'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                {marks.length === 0 && (
                                                    <tr>
                                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                                            No records found.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                                    <button
                                        onClick={() => setShowFullReportModal(false)}
                                        className="px-6 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                                    >
                                        Close Report
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Goal Modal (Keep Existing) */}
                    {showGoalModal && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">Set New Target</h3>
                                        <p className="text-slate-500 text-sm">Choose a subject and your desired grade.</p>
                                    </div>
                                    <button onClick={() => setShowGoalModal(false)} className="text-slate-400 hover:text-slate-600">
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleGoalSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                                        <select
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                                            value={goalForm.subject_name}
                                            onChange={e => setGoalForm({ ...goalForm, subject_name: e.target.value })}
                                            required
                                        >
                                            <option value="">Select Subject...</option>
                                            {uniqueSubjects.map(sub => (
                                                <option key={sub} value={sub}>{sub}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Target Grade</label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {['O', 'A+', 'A', 'B+', 'B', 'C', 'P'].map((grade) => (
                                                <button
                                                    key={grade}
                                                    type="button"
                                                    onClick={() => setGoalForm({ ...goalForm, target_grade: grade })}
                                                    className={`py-2 rounded-lg text-sm font-semibold border ${goalForm.target_grade === grade
                                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    {grade}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowGoalModal(false)}
                                            className="flex-1 py-3 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex-1 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-colors disabled:opacity-50"
                                        >
                                            {loading ? 'Saving...' : 'Set Goal'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                </main>
            </div >
        </ProtectedRoute >
    );
}
