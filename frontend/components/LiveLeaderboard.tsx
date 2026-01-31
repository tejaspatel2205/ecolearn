'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/components/SocketProvider';
import { Trophy, Medal, Crown } from 'lucide-react';
import { getLeaderboard } from '@/lib/api';

interface LeaderboardEntry {
    _id: string;
    student_id: {
        _id: string;
        full_name: string;
        email: string;
    };
    total_points: number;
    current_level: number;
}

export default function LiveLeaderboard() {
    const { socket } = useSocket();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLeaderboard = async () => {
        try {
            const data = await getLeaderboard(10);
            setLeaderboard(data);
        } catch (error) {
            console.error('Failed to fetch leaderboard', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();

        // Listen for real-time updates
        socket.on('leaderboard_update', () => {
            console.log('Leaderboard update received!');
            fetchLeaderboard();
        });

        return () => {
            socket.off('leaderboard_update');
        };
    }, [socket]);

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden border border-zinc-100 dark:border-zinc-800">
            <div className="p-6 bg-gradient-to-r from-yellow-500 to-amber-600 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Trophy className="w-6 h-6" />
                    <h2 className="text-xl font-bold">Live Leaderboard</h2>
                </div>
                <div className="text-xs bg-white/20 px-2 py-1 rounded-full animate-pulse">
                    ● Live Updates
                </div>
            </div>

            <div className="p-0">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading...</div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                        {leaderboard.map((entry, index) => (
                            <div
                                key={entry._id}
                                className={`flex items-center p-4 hover:bg-gray-50 dark:hover:bg-zinc-800 transition ${index < 3 ? 'bg-yellow-50/10' : ''
                                    }`}
                            >
                                <div className="w-12 text-center font-bold text-gray-400">
                                    {index === 0 ? (
                                        <Crown className="w-6 h-6 text-yellow-500 mx-auto" />
                                    ) : index === 1 ? (
                                        <Medal className="w-6 h-6 text-gray-400 mx-auto" />
                                    ) : index === 2 ? (
                                        <Medal className="w-6 h-6 text-amber-700 mx-auto" />
                                    ) : (
                                        `#${index + 1}`
                                    )}
                                </div>
                                <div className="flex-1 ml-4">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                        {entry.student_id ? entry.student_id.full_name : 'Unknown Student'}
                                    </h3>
                                    <p className="text-xs text-gray-500">Level {entry.current_level}</p>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-emerald-600">
                                        {entry.total_points.toLocaleString()} pts
                                    </div>
                                </div>
                            </div>
                        ))}
                        {leaderboard.length === 0 && (
                            <div className="p-8 text-center text-gray-500">
                                No rankings yet. Be the first!
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
