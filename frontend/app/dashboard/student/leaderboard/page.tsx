'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { getLeaderboard } from '@/lib/api';
import Link from 'next/link';
import { Trophy, Medal, Award } from 'lucide-react';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadLeaderboard();
    }
  }, [user]);

  const loadLeaderboard = async () => {
    try {
      const data = await getLeaderboard(100);
      if (data) {
        setLeaderboard(data);

        // Find user's rank
        const rank = data.findIndex((s: any) => s.student_id === user!.id || s.student_id?._id === user!.id) + 1;
        setUserRank(rank > 0 ? rank : null);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-orange-500" />;
    return <span className="text-gray-600 font-semibold">#{rank}</span>;
  };

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Global Leaderboard</h1>
            <Link
              href="/dashboard/student"
              className="text-green-600 hover:text-green-700 font-medium"
            >
              ← Back to Dashboard
            </Link>
          </div>

          {userRank && (
            <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-lg shadow-md p-6 mb-8 text-white">
              <h2 className="text-xl font-semibold mb-2">Your Rank</h2>
              <p className="text-3xl font-bold">#{userRank}</p>
              <p className="text-sm mt-2 opacity-90">
                {leaderboard.find((s: any) => (s.student_id?._id || s.student_id) === user!.id)?.total_points || 0} points
              </p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto"></div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Rank</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Level</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Points</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Eco Impact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {leaderboard.map((entry, index) => {
                      const rank = index + 1;
                      const studentId = entry.student_id?._id || entry.student_id;
                      const isCurrentUser = studentId === user!.id;
                      return (
                        <tr
                          key={`leaderboard-${studentId}-${index}`}
                          className={isCurrentUser ? 'bg-green-50 font-semibold' : ''}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              {getRankIcon(rank)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {entry.student_id?.full_name || entry.student_id?.email || 'Unknown'}
                            {isCurrentUser && <span className="ml-2 text-green-600">(You)</span>}
                          </td>
                          <td className="px-6 py-4">Level {entry.current_level || 1}</td>
                          <td className="px-6 py-4 font-semibold text-green-600">{entry.total_points || 0}</td>
                          <td className="px-6 py-4">{entry.eco_impact_score || 0}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

