'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { QuizQuestion } from '@/lib/types';
import { getQuiz, submitQuiz } from '@/lib/api';

export default function TakeQuizPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPractice = searchParams.get('practice') === 'true';
  const { user } = useAuth();
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<any>(null);
  const [requestStatus, setRequestStatus] = useState<'pending' | 'none' | null>(null);
  const [canAttempt, setCanAttempt] = useState(true);
  const [attemptsCount, setAttemptsCount] = useState(0);
  const [allowedAttempts, setAllowedAttempts] = useState(1);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (user && params.id) {
      loadQuiz();
      startAttempt();
    }
  }, [user, params.id]);

  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0 && !submitted) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === null || prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, submitted]);

  const loadQuiz = async () => {
    try {
      const quizData = await getQuiz(params.id as string);
      if (quizData) {
        setQuiz(quizData);
        setCanAttempt(quizData.canAttempt !== false);
        setAttemptsCount(quizData.attemptsCount || 0);
        setAllowedAttempts(quizData.allowedAttempts || 1);
        setRequestStatus(quizData.requestStatus || 'none');

        if (quizData.time_limit) {
          setTimeLeft(quizData.time_limit * 60); // Convert to seconds
        }

        if (quizData.questions) {
          let loadedQuestions = quizData.questions;
          if (isPractice) {
            // Shuffle questions
            loadedQuestions = [...loadedQuestions].sort(() => Math.random() - 0.5);
          }
          setQuestions(loadedQuestions);
        }
      }
    } catch (error) {
      console.error('Error loading quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const startAttempt = async () => {
    // Attempt is started automatically when quiz is loaded
    // Backend will handle attempt creation on submit
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (submitted) return;

    try {
      // Submit answers to backend
      const result = await submitQuiz(params.id as string, answers);

      if (result) {
        setScore({
          totalScore: result.score || 0,
          totalMarks: result.total_marks || 0,
          percentage: result.percentage || 0
        });
        setSubmitted(true);
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  };

  const handleRequestRetake = async () => {
    if (!confirm('Request a retake from your teacher?')) return;
    setRequesting(true);
    try {
      // We need to move api calls to lib/api.ts properly, but inline for now or import
      // Assuming we add a helper in api.ts or use direct fetch here for speed, 
      // but let's stick to using the api.ts pattern. 
      // I'll assume I need to add `requestRetake` to api.ts, but for this specific step 
      // I will use a direct fetch pattern if api.ts isn't easily editable in same turn, 
      // but better to add it to api.ts first? 
      // Actually, I can add the function to api.ts in a subsequent step or just use `apiCall` if exported.
      // Let's manually fetch for now to keep it self-contained or use the token.
      // Wait, `getQuiz` is imported. I should really update `lib/api.ts`.
      // I'll proceed with frontend view logic first, but I'll add the `requestRetake` call logic here assuming it exists
      // or valid fetch.

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/quizzes/${params.id}/request-retake`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to request retake');
      }

      setRequestStatus('pending');
      alert('Retake request sent successfully!');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setRequesting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['student']}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!quiz) {
    return (
      <ProtectedRoute allowedRoles={['student']}>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-xl text-red-500">Quiz not found</p>
        </div>
      </ProtectedRoute>
    );
  }

  // Blocked View
  if (!canAttempt) {
    return (
      <ProtectedRoute allowedRoles={['student']}>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="container mx-auto px-4 py-8 max-w-2xl">
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="text-5xl mb-4">🔒</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Maximum Attempts Reached</h1>
              <p className="text-gray-600 mb-6">
                You have used {attemptsCount} of {allowedAttempts} allowed attempts for this quiz.
              </p>

              {requestStatus === 'pending' ? (
                <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg inline-block">
                  <span className="font-semibold">Retake Request Pending...</span>
                  <p className="text-sm mt-1">Waiting for teacher approval.</p>
                </div>
              ) : (
                <div>
                  <p className="mb-4 text-gray-500">Would you like to try again?</p>
                  <button
                    onClick={handleRequestRetake}
                    disabled={requesting}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {requesting ? 'Sending Request...' : 'Request Retake'}
                  </button>
                </div>
              )}

              <div className="mt-8">
                <button
                  onClick={() => router.push('/dashboard/student/quizzes')}
                  className="text-gray-500 hover:text-gray-700 underline"
                >
                  Back to Quizzes
                </button>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (submitted && score) {
    return (
      <ProtectedRoute allowedRoles={['student']}>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="container mx-auto px-4 py-8 max-w-2xl">
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Quiz Completed!</h1>
              <div className="bg-green-50 rounded-lg p-6 mb-6">
                <p className="text-2xl font-bold text-green-600 mb-2">
                  Score: {score.totalScore}/{score.totalMarks}
                </p>
                <p className="text-xl text-gray-700">
                  Percentage: {Number(score.percentage).toFixed(2)}%
                </p>
              </div>
              <button
                onClick={() => router.push('/dashboard/student/quizzes')}
                className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Back to Quizzes
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute >
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <ProtectedRoute allowedRoles={['student']}>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="container mx-auto px-4 pt-24 pb-8">
            <p className="text-gray-500">Quiz not found</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
              {timeLeft !== null && (
                <div className="text-lg font-semibold text-red-600">
                  Time: {formatTime(timeLeft)}
                </div>
              )}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Question {currentQuestion + 1} of {questions.length}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {currentQ.question_text}
            </h2>

            {currentQ.question_type === 'multiple_choice' && currentQ.options && (
              <div className="space-y-3">
                {Object.entries(currentQ.options).map(([key, value]) => (
                  <label
                    key={key}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${answers[currentQ._id || currentQ.id] === key
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQ._id || currentQ.id}`}
                      value={key}
                      checked={answers[currentQ._id || currentQ.id] === key}
                      onChange={(e) => handleAnswerChange(currentQ._id || currentQ.id, e.target.value)}
                      className="mr-3"
                    />
                    <span className="font-medium mr-2">{key}:</span>
                    <span>{value as string}</span>
                  </label>
                ))}
              </div>
            )}

            {currentQ.question_type === 'true_false' && (
              <div className="space-y-3">
                {['True', 'False'].map((option) => (
                  <label
                    key={option}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${answers[currentQ._id || currentQ.id] === option
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQ._id || currentQ.id}`}
                      value={option}
                      checked={answers[currentQ._id || currentQ.id] === option}
                      onChange={(e) => handleAnswerChange(currentQ._id || currentQ.id, e.target.value)}
                      className="mr-3"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            )}

            {currentQ.question_type === 'short_answer' && (
              <input
                type="text"
                value={answers[currentQ._id || currentQ.id] || ''}
                onChange={(e) => handleAnswerChange(currentQ._id || currentQ.id, e.target.value)}
                className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                placeholder="Type your answer here..."
              />
            )}

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                disabled={currentQuestion === 0}
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {currentQuestion < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQuestion(prev => prev + 1)}
                  className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                >
                  Submit Quiz
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

