'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Compass, CheckSquare, BarChart2, Target, BookOpen,
    Activity, TrendingUp, Scale, Award, Zap,
    Star, Medal, CornerRightUp, Brain, Trophy,
    Lock, CheckCircle, ChevronRight
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';

interface Badge {
    _id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    earned: boolean;
    earned_at?: string;
}

const ICON_MAP: Record<string, React.ElementType> = {
    Compass, CheckSquare, BarChart2, Target, BookOpen,
    Activity, TrendingUp, Scale, Award, Zap,
    Star, Medal, CornerRightUp, Brain, Trophy
};

export default function AchievementsPage() {
    const [badges, setBadges] = useState<Badge[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBadges();
    }, []);

    const fetchBadges = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/badges/my-badges`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBadges(res.data);
        } catch (error) {
            console.error('Failed to load badges', error);
        } finally {
            setLoading(false);
        }
    };

    const BadgeCard = ({ badge }: { badge: Badge }) => {
        const Icon = ICON_MAP[badge.icon] || Award;

        // Dynamic Styles based on Level
        let bgStyle = "bg-slate-50 border-slate-200";
        let iconColor = "text-slate-400";
        let titleColor = "text-slate-500";
        let shadow = "shadow-sm";

        if (badge.earned) {
            if (badge.category === 'Basic') {
                bgStyle = "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200";
                iconColor = "text-emerald-600";
                titleColor = "text-emerald-900";
                shadow = "shadow-emerald-100";
            } else if (badge.category === 'Intermediate') {
                bgStyle = "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200";
                iconColor = "text-blue-600";
                titleColor = "text-blue-900";
                shadow = "shadow-blue-100";
            } else if (badge.category === 'Advanced') {
                bgStyle = "bg-gradient-to-br from-purple-50 to-fuchsia-50 border-purple-200";
                iconColor = "text-purple-600";
                titleColor = "text-purple-900";
                shadow = "shadow-purple-100";
            }
        }

        return (
            <div className={`relative p-5 rounded-2xl border ${bgStyle} ${badge.earned ? 'shadow-lg ' + shadow : 'grayscale opacity-70'} transition-all duration-500 hover:scale-[1.02]`}>
                {!badge.earned && (
                    <div className="absolute top-3 right-3 text-slate-300">
                        <Lock className="h-4 w-4" />
                    </div>
                )}
                {badge.earned && (
                    <div className="absolute top-3 right-3 text-white bg-green-500 rounded-full p-1 shadow-sm animate-in zoom-in duration-300">
                        <CheckCircle className="h-3 w-3" />
                    </div>
                )}

                <div className="flex flex-col items-center text-center">
                    <div className={`h-16 w-16 rounded-full flex items-center justify-center mb-4 ${badge.earned ? 'bg-white shadow-md' : 'bg-slate-200'}`}>
                        <Icon className={`h-8 w-8 ${iconColor}`} />
                    </div>

                    <h3 className={`font-bold text-sm mb-1 ${titleColor}`}>{badge.name}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-[180px]">{badge.description}</p>

                    {badge.earned && badge.earned_at && (
                        <div className="mt-4 px-2 py-0.5 bg-white/50 rounded text-[10px] items-center text-slate-500 font-medium">
                            Earned {new Date(badge.earned_at).toLocaleDateString()}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderSection = (title: string, level: string, color: string) => {
        const levelBadges = badges.filter(b => b.category === level);
        const earnedCount = levelBadges.filter(b => b.earned).length;

        return (
            <section className="mb-12 animate-in slide-in-from-bottom duration-500">
                <div className="flex items-end gap-3 mb-6">
                    <h2 className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${color}`}>
                        {title}
                    </h2>
                    <div className="h-px flex-1 bg-slate-200 mb-2"></div>
                    <span className="mb-1 text-sm font-semibold text-slate-400">
                        {earnedCount} / {levelBadges.length} Unlocked
                    </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {levelBadges.map(badge => (
                        <BadgeCard key={badge._id} badge={badge} />
                    ))}
                    {levelBadges.length === 0 && !loading && (
                        <div className="col-span-full text-center py-8 text-slate-400 text-sm">No badges available.</div>
                    )}
                </div>
            </section>
        );
    };

    return (
        <ProtectedRoute allowedRoles={['student']}>
            <div className="min-h-screen bg-[#F8FAFC]">
                <Navbar />

                <main className="container mx-auto px-4 py-8 pt-24 max-w-6xl">
                    {/* Header */}
                    <div className="mb-10 text-center">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Hall of Achievements</h1>
                        <p className="text-slate-500 text-lg">Track your academic milestones and earn badges.</p>

                        {!loading && badges.length > 0 && (
                            <div className="inline-flex mt-6 items-center gap-3 px-6 py-2 bg-white rounded-full shadow-sm border border-slate-200">
                                <Trophy className="h-5 w-5 text-yellow-500" />
                                <span className="font-bold text-slate-700">
                                    {badges.filter(b => b.earned).length} <span className="text-slate-400 font-normal">of</span> {badges.length} Badges Earned
                                </span>
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <>
                            {renderSection("Basic Level", "Basic", "from-emerald-600 to-teal-500")}
                            {renderSection("Intermediate Level", "Intermediate", "from-blue-600 to-indigo-600")}
                            {renderSection("Advanced Level", "Advanced", "from-purple-600 to-fuchsia-600")}
                        </>
                    )}

                </main>
            </div>
        </ProtectedRoute>
    );
}
