'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { apiCall } from '@/lib/api';

type Props = {
    context?: string;
    hideLauncher?: boolean;
    noLauncher?: boolean;
    launcherLabel?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
};

export default function AiTutor({
    context,
    hideLauncher = false,
    noLauncher = false,
    launcherLabel = 'Help me understand',
    open,
    onOpenChange
}: Props) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isOpen = open ?? internalOpen;
    const setIsOpen = (next: boolean) => {
        onOpenChange?.(next);
        if (open === undefined) setInternalOpen(next);
    };
    const [question, setQuestion] = useState('');
    const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
    const [loading, setLoading] = useState(false);

    const handleAsk = async () => {
        if (!question.trim()) return;

        const userQ = question;
        setMessages((prev) => [...prev, { role: 'user', text: userQ }]);
        setQuestion('');
        setLoading(true);

        try {
            const data = await apiCall('/api/ai/ask', {
                method: 'POST',
                body: JSON.stringify({ question: userQ, context }),
            });
            setMessages((prev) => [...prev, { role: 'ai', text: data.answer || 'Sorry, I could not understand that.' }]);
        } catch (err: any) {
            const errorMsg = err?.message || 'Error connecting to AI tutor. Please try again.';
            setMessages((prev) => [...prev, { role: 'ai', text: `⚠️ ${errorMsg}` }]);
            console.error('AI Tutor Error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {!hideLauncher && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 p-4 bg-indigo-900 text-white rounded-full shadow-lg hover:bg-indigo-800 transition"
                    title="Ask AI Tutor"
                >
                    <Bot size={24} />
                </button>
            )}

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        className="fixed bottom-24 right-6 w-96 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden z-50"
                        style={{ maxHeight: '600px', height: '500px' }}
                    >
                        {/* Header */}
                        <div className="bg-indigo-900 text-white p-4 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Bot size={20} />
                                <h3 className="font-semibold">AI Tutor</h3>
                            </div>
                            <button onClick={() => setIsOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 p-4 overflow-y-auto space-y-4 [&::-webkit-scrollbar-thumb]:!bg-indigo-400 dark:[&::-webkit-scrollbar-thumb]:!bg-indigo-600 hover:[&::-webkit-scrollbar-thumb]:!bg-indigo-500">
                            {messages.length === 0 && (
                                <div className="text-center text-zinc-500 mt-10">
                                    <p>👋 Hi! I'm your AI Tutor.</p>
                                    <p className="text-sm mt-2">Ask me anything about this quiz or topic!</p>
                                </div>
                            )}
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] p-3 rounded-lg text-sm ${msg.role === 'user'
                                            ? 'bg-indigo-900 text-white rounded-br-none'
                                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-bl-none'
                                            }`}
                                    >
                                        {msg.role === 'user' ? (
                                            msg.text
                                        ) : (
                                            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
                                                <ReactMarkdown>{msg.text}</ReactMarkdown>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-lg rounded-bl-none text-sm space-x-1 flex items-center">
                                        <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce delay-75"></div>
                                        <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce delay-150"></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                                    placeholder="Ask a question..."
                                    className="flex-1 bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-900 outline-none"
                                />
                                <button
                                    onClick={handleAsk}
                                    disabled={!question.trim() || loading}
                                    className="p-2 bg-indigo-900 text-white rounded-xl hover:bg-indigo-800 disabled:opacity-50 transition"
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {hideLauncher && !noLauncher && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-900 text-white hover:bg-indigo-800 transition"
                    type="button"
                >
                    <Bot size={18} />
                    <span className="text-sm font-semibold">{launcherLabel}</span>
                </button>
            )}
        </>
    );
}
