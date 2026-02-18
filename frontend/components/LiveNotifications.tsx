'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/components/SocketProvider';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import axios from 'axios';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
}

export default function LiveNotifications() {
    const { socket } = useSocket();
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // ...

    useEffect(() => {
        if (!user) return;

        // Fetch stored notifications on load
        const fetchNotifications = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(
                    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/notifications`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                // Add unread stored notifications to the list
                const unread = res.data.filter((n: any) => !n.is_read).map((n: any) => ({
                    id: n._id,
                    title: n.title,
                    message: n.message,
                    type: n.type
                }));

                // Add to state one by one with delay for effect, or just batch
                if (unread.length > 0) {
                    // We add them with a slight stagger so they don't all pop at once identically
                    unread.forEach((n: any, index: number) => {
                        setTimeout(() => {
                            setNotifications(prev => {
                                // Prevent duplicates
                                if (prev.some(existing => existing.id === n.id)) return prev;
                                return [...prev, n];
                            });
                            // Mark as read immediately or let user dismiss? 
                            // For now, let's mark as read so they don't appear next refresh
                            axios.put(
                                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/notifications/${n.id}/read`,
                                {},
                                { headers: { Authorization: `Bearer ${token}` } }
                            );
                        }, index * 300);
                    });
                }
            } catch (error) {
                console.error('Failed to fetch notifications:', error);
            }
        };

        fetchNotifications();

        if (!socket) return;

        // Listener for Retake Requests (Teachers)
        if (user.role === 'teacher') {
            const handleRetakeRequest = (data: any) => {
                // Only show if the request is for this teacher
                // Note: Ideally backend should emit to specific room, but filtering here works for MVP
                if (data.teacher_id === user.id || data.teacher_id === user._id) {
                    addNotification({
                        title: 'New Retake Request',
                        message: `${data.student} requested a retake for "${data.quiz}"`,
                        type: 'info'
                    });
                }
            };

            socket.on('retake_request', handleRetakeRequest);

            return () => {
                socket.off('retake_request', handleRetakeRequest);
            };
        }

        // Listener for Graded Quizzes (Students) - Assuming we add this event later
        // or just 'leaderboard_update' as a trigger to check results

    }, [socket, user]);

    const addNotification = (n: Omit<Notification, 'id'>) => {
        const id = Date.now().toString();
        setNotifications(prev => [...prev, { ...n, id }]);

        // Auto remove after 5 seconds
        setTimeout(() => {
            removeNotification(id);
        }, 5000);
    };

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2">
            <AnimatePresence>
                {notifications.map(n => (
                    <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        className={`
                            rounded-lg shadow-xl border-l-4 p-4 w-96 pointer-events-auto flex items-start gap-3 backdrop-blur-sm
                            ${n.type === 'success' ? 'bg-green-50/90 border-green-500' :
                                n.type === 'error' ? 'bg-red-50/90 border-red-500' :
                                    n.type === 'warning' ? 'bg-yellow-50/90 border-yellow-500' :
                                        'bg-white/90 border-blue-500'}
                        `}
                    >
                        <div className={`
                            p-2 rounded-full 
                            ${n.type === 'success' ? 'bg-green-100 text-green-600' :
                                n.type === 'error' ? 'bg-red-100 text-red-600' :
                                    n.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                                        'bg-blue-100 text-blue-600'}
                        `}>
                            <Bell size={18} />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-sm text-gray-900">{n.title}</h4>
                            <p className="text-sm text-gray-700 mt-1 leading-relaxed">{n.message}</p>
                        </div>
                        <button
                            onClick={() => removeNotification(n.id)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
