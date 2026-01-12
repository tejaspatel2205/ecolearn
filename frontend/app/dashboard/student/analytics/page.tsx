'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { getAnalytics } from '@/lib/api';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [quizScores, setQuizScores] = useState<any[]>([]);
  const [weakTopics, setWeakTopics] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user]);

  const loadAnalytics = async () => {
    try {
      const analyticsData = await getAnalytics();
      if (analyticsData && analyticsData.attempts) {
        const attempts = analyticsData.attempts;

        setQuizScores(attempts.map((a: any) => ({
          name: a.quiz_id?.title || 'Quiz',
          score: a.percentage || 0,
          date: new Date(a.completed_at || a.started_at || Date.now()).toLocaleDateString(),
        })));

        // Analyze weak topics (simplified - would need lesson data)
        const topicScores: Record<string, { total: number; correct: number }> = {};
        for (const attempt of attempts) {
          const topic = attempt.lesson_id?.topic || 'Unknown';
          if (!topicScores[topic]) {
            topicScores[topic] = { total: 0, correct: 0 };
          }
          topicScores[topic].total += 1;
          if ((attempt.percentage || 0) >= 70) {
            topicScores[topic].correct += 1;
          }
        }

        const weakTopicsList = Object.entries(topicScores)
          .map(([topic, data]) => ({
            topic,
            performance: (data.correct / data.total) * 100,
            totalQuizzes: data.total,
          }))
          .filter(t => t.performance < 70)
          .sort((a, b) => a.performance - b.performance)
          .slice(0, 5);

        setWeakTopics(weakTopicsList);

        // Generate suggestions
        const generatedSuggestions = weakTopicsList.map(weak => ({
          weak_topic: weak.topic,
          suggestion_text: `You're struggling with ${weak.topic}. We recommend revisiting related lessons and practicing more quizzes on this topic.`,
          recommended_lessons: [],
          recommended_quizzes: [],
        }));

        setSuggestions(generatedSuggestions);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Performance Analytics</h1>
            <Link
              href="/dashboard/student"
              className="text-green-600 hover:text-green-700 font-medium"
            >
              ← Back to Dashboard
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Quiz Performance Chart */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Quiz Performance Over Time</h2>
                {quizScores.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={quizScores}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500 text-center py-8">No quiz data available yet</p>
                )}
              </div>

              {/* Weak Topics */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Areas Needing Improvement</h2>
                {weakTopics.length > 0 ? (
                  <div className="space-y-4">
                    {weakTopics.map((topic, index) => (
                      <div key={index} className="border-l-4 border-red-500 pl-4 py-2">
                        <h3 className="font-semibold text-gray-900">{topic.topic}</h3>
                        <p className="text-sm text-gray-600">
                          Performance: {topic.performance.toFixed(1)}% ({topic.totalQuizzes} quizzes)
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div
                            className="bg-red-500 h-2 rounded-full"
                            style={{ width: `${topic.performance}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Great job! No weak areas identified.</p>
                )}
              </div>

              {/* Suggestions */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Personalized Suggestions</h2>
                {suggestions.length > 0 ? (
                  <div className="space-y-4">
                    {suggestions.map((suggestion, index) => (
                      <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-900 mb-2">
                          Focus on: {suggestion.weak_topic}
                        </h3>
                        <p className="text-blue-800">{suggestion.suggestion_text}</p>
                        <div className="mt-3">
                          <Link
                            href="/dashboard/student/lessons"
                            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                          >
                            View Related Lessons →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Keep up the great work! No specific suggestions at this time.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

