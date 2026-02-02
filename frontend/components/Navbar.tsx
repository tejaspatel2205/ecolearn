'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Button from './Button';
import { LogOut, LayoutDashboard, Leaf, Bell, FileText, Sparkles } from 'lucide-react';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    if (user && user.role === 'teacher') {
      fetchRequests();
      // Optional: Poll every minute or so
      const interval = setInterval(fetchRequests, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      // Fetch quiz requests
      const quizResponse = await fetch('http://localhost:3001/api/quizzes/teacher/requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      let total = 0;
      if (quizResponse.ok) {
        const data = await quizResponse.json();
        if (Array.isArray(data)) {
          total += data.length;
        }
      }

      // Fetch challenge requests
      try {
        const challengeResponse = await fetch('http://localhost:3001/api/challenges/teacher/requests', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (challengeResponse.ok) {
          const data = await challengeResponse.json();
          if (Array.isArray(data)) {
            total += data.length;
          }
        }
      } catch (e) {
        console.warn('Could not fetch challenge requests', e);
      }

      setPendingRequests(total);

      // Admin: Fetch teacher approval requests
      if (user.role === 'admin') {
        try {
          const teacherResponse = await fetch('http://localhost:3001/api/admin/teacher-requests', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (teacherResponse.ok) {
            const data = await teacherResponse.json();
            if (Array.isArray(data)) {
              setPendingRequests(data.length);
            }
          }
        } catch (e) {
          console.warn('Could not fetch teacher requests', e);
        }
      }

    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    return `/dashboard/${user.role}`;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-elevated border-b border-white/20 transition-all duration-300">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="bg-green-100 p-2 rounded-xl group-hover:bg-green-200 transition-colors">
              <Leaf className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-800 bg-clip-text text-transparent">
              EcoLearn
            </span>
          </Link>

          <div className="flex items-center space-x-6">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link href={getDashboardLink()}>
                  <Button variant="ghost" size="sm" className="hidden md:flex">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>

                <Link href={`/dashboard/${user.role}/exam-planner`}>
                  <Button variant="ghost" size="sm" className="hidden md:flex text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700">
                    <FileText className="w-4 h-4 mr-2" />
                    Exam Planner
                  </Button>
                </Link>

                {(user.role === 'teacher' || user.role === 'admin') && (
                  <Link href={user.role === 'admin' ? "/dashboard/admin/teacher-approvals" : "/dashboard/teacher/requests"} className="relative group">
                    <div className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors relative">
                      <Bell className="w-5 h-5" />
                      {pendingRequests > 0 && (
                        <span className="absolute top-1 right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 text-[10px] text-white items-center justify-center">
                            {pendingRequests > 9 ? '9+' : pendingRequests}
                          </span>
                        </span>
                      )}
                    </div>
                  </Link>
                )}

                {user.role === 'student' && (
                  <Link href="/dashboard/student/smart-practice">
                    <Button variant="ghost" size="sm" className="hidden md:flex text-amber-600 hover:bg-amber-50 hover:text-amber-700">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Smart Practice
                    </Button>
                  </Link>
                )}

                <div className="hidden md:flex flex-col items-end mr-2 px-3 py-1 bg-gray-50/50 rounded-lg border border-gray-100">
                  <span className="text-sm font-bold text-gray-800">{user.full_name}</span>
                  <span className="text-[10px] uppercase tracking-wider text-green-600 font-bold flex items-center justify-end">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
                    {user.role}
                  </span>
                </div>

                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleSignOut}
                  className="shadow-red-500/20"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/login">
                  <Button variant="ghost" className="font-semibold text-gray-600">Login</Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" className="shadow-green-500/30">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
