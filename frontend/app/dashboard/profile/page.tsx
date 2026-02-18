'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getInstitutions } from '@/lib/api';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { User, School, Building2, GraduationCap, Briefcase, Save, Loader2, AlertCircle, CheckCircle, Lock, Clock } from 'lucide-react';
import axios from 'axios';

export default function ProfilePage() {
    const { user, refreshUser, loading: authLoading } = useAuth();
    const [institutions, setInstitutions] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        full_name: '',
        mobile: '',
        institution_id: '',
        semester: '',
        standard: '',
        university_details: '',
        college_name: '',
        ngo_details: ''
    });

    const [selectedInstitutionType, setSelectedInstitutionType] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // State to determine if the profile is "locked" by system (requires approval to change)
    const [hasExistingProfile, setHasExistingProfile] = useState(false);

    // State to control UI editing capability
    const [isEditing, setIsEditing] = useState(true);

    const [pendingRequest, setPendingRequest] = useState<any>(null);

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            try {
                const instData = await getInstitutions();
                setInstitutions(instData || []);

                if (user) {
                    setFormData({
                        full_name: user.full_name || '',
                        mobile: (user as any).mobile || '',
                        institution_id: typeof user.institution_id === 'object' ? (user.institution_id as any)?._id : user.institution_id || '',
                        semester: (user as any).semester || '',
                        standard: (user as any).standard || '',
                        university_details: (user as any).university_details || '',
                        college_name: (user as any).college_name || '',
                        ngo_details: (user as any).ngo_details || ''
                    });

                    // Set initial institution type if user has one
                    if (user.institution_id) {
                        const userInstId = typeof user.institution_id === 'object' ? (user.institution_id as any)?._id : user.institution_id;
                        const inst = instData?.find((i: any) => i.id === userInstId || i._id === userInstId);
                        if (inst) setSelectedInstitutionType(inst.type);

                        // If user has institution, profile is locked and view-only by default
                        if (userInstId) {
                            setHasExistingProfile(true);
                            setIsEditing(false);
                        }
                    }

                    // Check for pending requests
                    const token = localStorage.getItem('token');
                    const requestRes = await axios.get(
                        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/profile-requests/my-request`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    setPendingRequest(requestRes.data);
                }
            } catch (error) {
                console.error("Failed to load profile data", error);
            }
        };

        if (user) loadData();
    }, [user]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('[ProfilePage] No token found in localStorage');
                setMessage({ type: 'error', text: 'Authentication error. Please log in again.' });
                setLoading(false);
                return;
            }

            // Logic: If user already has a profile (locked by system), we MUST send a request.
            // Even if they are currently "editing" (UI unlocked), the underlying requirement is a request.
            if (hasExistingProfile) {
                // Send Request
                await axios.post(
                    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/profile-requests`,
                    { changes: formData },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setMessage({ type: 'success', text: 'Update request sent to admin for approval.' });

                // Refresh pending request
                const requestRes = await axios.get(
                    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/profile-requests/my-request`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setPendingRequest(requestRes.data);

                // Lock UI again after request
                setIsEditing(false);
            } else {
                // Direct Update (First time setup)
                await axios.put(
                    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/profile`,
                    formData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                await refreshUser(); // Refresh local user state

                // Now they have a profile, key it as existing
                setHasExistingProfile(true);
                setIsEditing(false);
            }
        } catch (error) {
            console.error("Update failed", error);
            setMessage({ type: 'error', text: 'Failed to update profile.' });
        } finally {
            setLoading(false);
        }
    };

    const handleRequestUnlock = () => {
        if (pendingRequest) {
            alert('You already have a pending request. Please wait for admin approval.');
            return;
        }
        const confirmUnlock = window.confirm("To change your details, you must submit a request to the admin. Do you want to proceed?");
        if (confirmUnlock) {
            setIsEditing(true); // Unlock UI fields
        }
    };

    if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <ProtectedRoute allowedRoles={['student', 'teacher']}>
            <div className="min-h-screen bg-gray-50">
                <Navbar />

                <main className="container mx-auto px-4 py-8 pt-24 max-w-2xl">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                    <User className="h-6 w-6 text-indigo-600" />
                                    My Profile
                                </h1>
                                <p className="text-slate-500 text-sm mt-1">Update your personal and academic details.</p>
                            </div>
                            {hasExistingProfile && !isEditing && (
                                <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 text-xs rounded-full border border-amber-200">
                                    <Lock className="h-3 w-3" />
                                    Profile Locked
                                </div>
                            )}
                            {hasExistingProfile && isEditing && (
                                <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200">
                                    <Clock className="h-3 w-3" />
                                    Request Mode
                                </div>
                            )}
                        </div>

                        <div className="p-6">
                            {message && (
                                <div className={`p-4 mb-6 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                                    }`}>
                                    {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                                    {message.text}
                                </div>
                            )}

                            {pendingRequest && (
                                <div className="p-4 mb-6 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-3">
                                    <Clock className="h-5 w-5 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold">Update Request Pending</p>
                                        <p className="text-xs mt-1">You have requested changes to your profile. An admin will review them shortly.</p>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSave} className="space-y-6">
                                {/* Personal Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Full Name</label>
                                        <input
                                            type="text"
                                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                                            value={formData.full_name}
                                            onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                            required
                                            disabled={!isEditing}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Mobile</label>
                                        <input
                                            type="text"
                                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                                            value={formData.mobile}
                                            onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                                            required
                                            disabled={!isEditing}
                                        />
                                    </div>
                                </div>

                                {/* Institution Selection */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Institution Type</label>
                                        <select
                                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                                            value={selectedInstitutionType}
                                            onChange={e => {
                                                setSelectedInstitutionType(e.target.value);
                                                setFormData(prev => ({ ...prev, institution_id: '' })); // Reset institution when type changes
                                            }}
                                            required
                                            disabled={!isEditing}
                                        >
                                            <option value="">Select Type</option>
                                            <option value="school">School</option>
                                            <option value="college">College</option>
                                            <option value="university">University</option>
                                            <option value="ngo">NGO</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Institution Name</label>
                                        <select
                                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                                            value={formData.institution_id}
                                            onChange={e => setFormData(prev => ({ ...prev, institution_id: e.target.value }))}
                                            required
                                            disabled={!selectedInstitutionType || !isEditing}
                                        >
                                            <option value="">Select Institution</option>
                                            {institutions
                                                .filter(inst => inst.type === selectedInstitutionType)
                                                .map((inst) => (
                                                    <option key={inst.id || inst._id} value={inst.id || inst._id}>
                                                        {inst.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Dynamic Fields based on Institution Type */}
                                {selectedInstitutionType === 'school' && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                            <School className="h-4 w-4" /> Standard (Grade)
                                        </label>
                                        <select
                                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                                            value={formData.standard}
                                            onChange={e => setFormData({ ...formData, standard: e.target.value })}
                                            required
                                            disabled={!isEditing}
                                        >
                                            <option value="">Select Standard</option>
                                            {[...Array(12)].map((_, i) => (
                                                <option key={i + 1} value={i + 1}>Standard {i + 1}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {selectedInstitutionType === 'college' && user?.role === 'student' && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                            <Building2 className="h-4 w-4" /> Semester
                                        </label>
                                        <select
                                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                                            value={formData.semester}
                                            onChange={e => setFormData({ ...formData, semester: e.target.value })}
                                            required
                                            disabled={!isEditing}
                                        >
                                            <option value="">Select Semester</option>
                                            {[...Array(8)].map((_, i) => (
                                                <option key={i + 1} value={i + 1}>Semester {i + 1}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {selectedInstitutionType === 'university' && (
                                    <>
                                        {/* College Selection for University */}
                                        {institutions.find(i => i.id === formData.institution_id || i._id === formData.institution_id)?.colleges?.length > 0 && (
                                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                    <Building2 className="h-4 w-4" /> Constituent College
                                                </label>
                                                <select
                                                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                                                    value={(formData as any).college_name || ''}
                                                    onChange={e => setFormData({ ...formData, college_name: e.target.value } as any)}
                                                    required
                                                    disabled={!isEditing}
                                                >
                                                    <option value="">Select College</option>
                                                    {institutions.find(i => i.id === formData.institution_id || i._id === formData.institution_id)?.colleges.map((col: string, idx: number) => (
                                                        <option key={idx} value={col}>{col}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {user?.role === 'student' && (
                                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                    <Building2 className="h-4 w-4" /> Semester
                                                </label>
                                                <select
                                                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                                                    value={formData.semester}
                                                    onChange={e => setFormData({ ...formData, semester: e.target.value })}
                                                    required
                                                    disabled={!isEditing}
                                                >
                                                    <option value="">Select Semester</option>
                                                    {[...Array(8)].map((_, i) => (
                                                        <option key={i + 1} value={i + 1}>Semester {i + 1}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                <GraduationCap className="h-4 w-4" /> Department / Course
                                            </label>
                                            <select
                                                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                                                value={formData.university_details}
                                                onChange={e => setFormData({ ...formData, university_details: e.target.value })}
                                                required
                                                disabled={!isEditing}
                                            >
                                                <option value="">Select Department</option>
                                                {[
                                                    "Computer Science and Engineering",
                                                    "Computer Engineering",
                                                    "Artificial Intelligence and Machine Learning",
                                                    "Information Technology",
                                                    "Electronics and Communication",
                                                    "Electrical",
                                                    "Mechanical",
                                                    "Civil"
                                                ].map((dept, idx) => (
                                                    <option key={idx} value={dept}>{dept}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                )}

                                {selectedInstitutionType === 'ngo' && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                            <Briefcase className="h-4 w-4" /> Role / Function
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Volunteer, Coordinator..."
                                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                                            value={formData.ngo_details}
                                            onChange={e => setFormData({ ...formData, ngo_details: e.target.value })}
                                            required
                                            disabled={!isEditing}
                                        />
                                    </div>
                                )}

                                <div className="pt-4">
                                    {hasExistingProfile && !isEditing ? (
                                        <button
                                            type="button"
                                            onClick={handleRequestUnlock}
                                            className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-amber-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            <Lock className="h-5 w-5" />
                                            Request to Update Profile
                                        </button>
                                    ) : (
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                                            {hasExistingProfile ? 'Submit Update Request' : 'Save Changes'}
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}
