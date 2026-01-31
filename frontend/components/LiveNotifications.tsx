'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/components/SocketProvider';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

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

    useEffect(() => {
        if (!socket || !user) return;

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
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
            <AnimatePresence>
                {notifications.map(n => (
                    <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg border-l-4 border-blue-500 p-4 w-80 pointer-events-auto flex items-start gap-3"
                    >
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                            <Bell size={18} />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">{n.title}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{n.message}</p>
                        </div>
                        <button
                            onClick={() => removeNotification(n.id)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                            <X size={16} />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
