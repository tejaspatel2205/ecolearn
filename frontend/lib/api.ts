// API utility functions for backend communication

// Try to detect backend port automatically, fallback to default
const getApiBaseUrl = () => {
  // Check if API URL is set in environment (highest priority)
  if (typeof window !== 'undefined') {
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envUrl) {
      return envUrl;
    }

    // Try to detect port from localStorage (cached from previous detection)
    const savedPort = localStorage.getItem('backend_port');
    if (savedPort) {
      return `http://localhost:${savedPort}`;
    }
  }

  // Default fallback
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
};

let API_BASE_URL = getApiBaseUrl();

// Auto-detect backend port on first load
if (typeof window !== 'undefined') {
  // Try to detect the actual port the backend is running on
  const detectPort = async () => {
    const commonPorts = [3001, 3002, 3003, 3004, 3005];

    for (const port of commonPorts) {
      try {
        const response = await fetch(`http://localhost:${port}/api/port`, {
          method: 'GET',
          signal: AbortSignal.timeout(1000) // 1 second timeout
        });

        if (response.ok) {
          const data = await response.json();
          const detectedPort = data.port;
          API_BASE_URL = `http://localhost:${detectedPort}`;
          localStorage.setItem('backend_port', detectedPort.toString());
          console.log(`✅ Auto-detected backend on port ${detectedPort}`);
          return;
        }
      } catch (error) {
        // Port not available, try next
        continue;
      }
    }
  };

  // Run detection in background (don't block)
  detectPort().catch(() => {
    // Silently fail, use default
  });
}

// Helper function for API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Only add auth header if token exists (for public routes like register/login)
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`[API] ${options.method || 'GET'} ${url}`);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorData;
      const contentType = response.headers.get('content-type');

      try {
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          const text = await response.text();
          errorData = { error: text || `Request failed with status ${response.status}` };
        }
      } catch (parseError) {
        errorData = { error: `Request failed with status ${response.status}` };
      }

      // Handle different error response formats
      const errorMessage = errorData.error || errorData.message || errorData.msg || errorData.toString() || `Request failed with status ${response.status}`;

      // Don't log expected errors (no token for auth check endpoints when not logged in)
      const isAuthCheckEndpoint = endpoint.includes('/auth/me') || endpoint.includes('/auth/user');
      const isPublicEndpoint = endpoint.includes('/institutions') && options.method !== 'POST';
      const isNoTokenError = errorMessage.includes('No token') || errorMessage.includes('token') || errorMessage.includes('auth required');

      // Registration and login endpoints should always show errors
      const isAuthAction = endpoint.includes('/auth/register') || endpoint.includes('/auth/login');

      // Only suppress logging for expected "no token" errors on auth check/public endpoints
      // Never suppress errors for registration/login
      if (isAuthAction || !((isAuthCheckEndpoint || isPublicEndpoint) && isNoTokenError)) {
        console.error(`[API Error] ${endpoint}:`, errorMessage, errorData);
      } else {
        // Silently handle expected errors for public/auth check endpoints
        console.debug(`[API] Expected auth error for ${endpoint} (user not logged in)`);
      }

      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error: any) {
    // If connection fails, log the error
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      console.error(`[API] Failed to connect to ${API_BASE_URL}${endpoint}`);
      console.error('Make sure backend is running and API URL is correct');
    }
    throw error;
  }
}

// Auth API
export async function register(email: string, password: string, fullName: string, role: string, institutionId?: string) {
  try {
    return await apiCall('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName, role, institutionId }),
    });
  } catch (error: any) {
    // Re-throw with better error message
    throw new Error(error.message || 'Registration failed');
  }
}

export async function login(email: string, password: string) {
  try {
    return await apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  } catch (error: any) {
    // Re-throw with better error message
    throw new Error(error.message || 'Login failed');
  }
}

export async function getCurrentUser() {
  return apiCall('/api/auth/me');
}

// Institutions API
export async function getInstitutions() {
  try {
    return await apiCall('/api/institutions');
  } catch (error: any) {
    // If it's an auth error for institutions, return empty array (public endpoint should work)
    // This handles cases where backend might have auth issues but we want registration to work
    if (error.message?.includes('auth required') || error.message?.includes('No token')) {
      console.warn('[API] Institutions endpoint returned auth error, but it should be public. Returning empty array.');
      return [];
    }
    throw error;
  }
}

// Classes API
export async function getClasses() {
  return apiCall('/api/classes');
}

export async function createClass(classData: any) {
  return apiCall('/api/classes', {
    method: 'POST',
    body: JSON.stringify(classData),
  });
}

export async function updateClass(classId: string, classData: any) {
  return apiCall(`/api/classes/${classId}`, {
    method: 'PUT',
    body: JSON.stringify(classData),
  });
}

export async function enrollStudent(classId: string, studentId: string) {
  return apiCall(`/api/classes/${classId}/enroll`, {
    method: 'POST',
    body: JSON.stringify({ studentId }),
  });
}

// Lessons API
export async function getLessons(classId?: string) {
  const endpoint = classId ? `/api/lessons?classId=${classId}` : '/api/lessons';
  return apiCall(endpoint);
}

export async function createLesson(lessonData: any) {
  return apiCall('/api/lessons', {
    method: 'POST',
    body: JSON.stringify(lessonData),
  });
}

export async function getLesson(id: string) {
  return apiCall(`/api/lessons/${id}`);
}

export async function updateLesson(id: string, lessonData: any) {
  return apiCall(`/api/lessons/${id}`, {
    method: 'PUT',
    body: JSON.stringify(lessonData),
  });
}

export async function getLessonAnalytics(id: string) {
  return apiCall(`/api/lessons/${id}/analytics`);
}

export async function deleteLesson(id: string) {
  return apiCall(`/api/lessons/${id}`, {
    method: 'DELETE',
  });
}

// Quizzes API
export async function getQuizzes(classId?: string) {
  const endpoint = classId ? `/api/quizzes?classId=${classId}` : '/api/quizzes';
  return apiCall(endpoint);
}

export async function createQuiz(quizData: any) {
  return apiCall('/api/quizzes', {
    method: 'POST',
    body: JSON.stringify(quizData),
  });
}

export async function getQuiz(id: string) {
  return apiCall(`/api/quizzes/${id}`);
}

export async function updateQuiz(id: string, quizData: any) {
  return apiCall(`/api/quizzes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(quizData),
  });
}

export async function deleteQuiz(id: string) {
  return apiCall(`/api/quizzes/${id}`, {
    method: 'DELETE',
  });
}

export async function submitQuiz(quizId: string, answers: any) {
  return apiCall(`/api/quizzes/${quizId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  });
}

export async function getQuizAttempts(quizId: string) {
  return apiCall(`/api/quizzes/${quizId}/attempts`);
}

// Challenges API
export async function getChallenges(classId?: string) {
  const endpoint = classId ? `/api/challenges?classId=${classId}` : '/api/challenges';
  return apiCall(endpoint);
}

export async function getChallenge(id: string) {
  return apiCall(`/api/challenges/${id}`);
}

export async function createChallenge(challengeData: any) {
  return apiCall('/api/challenges', {
    method: 'POST',
    body: JSON.stringify(challengeData),
  });
}

export async function updateChallenge(id: string, challengeData: any) {
  return apiCall(`/api/challenges/${id}`, {
    method: 'PUT',
    body: JSON.stringify(challengeData),
  });
}

export async function deleteChallenge(id: string) {
  return apiCall(`/api/challenges/${id}`, {
    method: 'DELETE',
  });
}

export function submitChallenge(challengeId: string, submission: any) {
  return apiCall(`/api/challenges/${challengeId}/submit`, {
    method: 'POST',
    body: JSON.stringify(submission),
  });
}

export function requestChallengeRetake(challengeId: string) {
  return apiCall(`/api/challenges/${challengeId}/request-retake`, {
    method: 'POST',
  });
}

export function gradeChallengeSubmission(submissionId: string, data: { status: string, points: number }) {
  return apiCall(`/api/challenges/submission/${submissionId}/grade`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function handleRetakeRequest(submissionId: string, status: 'approved' | 'rejected') {
  return apiCall(`/api/challenges/submission/${submissionId}/handle-retake`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  });
}

// Student API
export async function getStudentStats() {
  return apiCall('/api/student/stats');
}

export async function getStudentProgress() {
  return apiCall('/api/student/progress');
}

export async function markLessonComplete(lessonId: string) {
  return apiCall(`/api/lessons/${lessonId}/complete`, {
    method: 'POST',
  });
}

export async function getLeaderboard(limit = 100) {
  return apiCall(`/api/student/leaderboard?limit=${limit}`);
}

export async function getAnalytics() {
  return apiCall('/api/student/analytics');
}

// Teacher API
export async function getTeacherStats() {
  try {
    const stats = await apiCall('/api/teacher/stats');
    // Calculate average quiz score if we have quiz attempts
    // This would need to be added to backend, but for now return as is
    return {
      ...stats,
      avgQuizScore: stats.avgQuizScore || 0
    };
  } catch (error) {
    console.error('Error getting teacher stats:', error);
    return {
      totalStudents: 0,
      totalLessons: 0,
      totalQuizzes: 0,
      totalClasses: 0,
      avgQuizScore: 0
    };
  }
}

export async function getChallengeSubmissions() {
  return apiCall('/api/teacher/challenge-results');
}

export async function getClassStudents(classId: string) {
  return apiCall(`/api/teacher/classes/${classId}/students`);
}

// Admin API
export async function getAdminStats() {
  return apiCall('/api/admin/stats');
}

export async function getAdminUsers() {
  return apiCall('/api/admin/users');
}

export async function updateUserRole(userId: string, role: string) {
  return apiCall(`/api/admin/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({ role })
  });
}

export async function deleteUser(userId: string) {
  return apiCall(`/api/admin/users/${userId}`, {
    method: 'DELETE'
  });
}

export async function getAdminAnalytics() {
  return apiCall('/api/admin/analytics');
}

export async function getAdminLeaderboard(period = 'all-time') {
  return apiCall(`/api/admin/leaderboard?period=${period}`);
}

export async function resetUserStats(userId: string) {
  return apiCall(`/api/admin/users/${userId}/reset-stats`, {
    method: 'POST'
  });
}

export async function updateContentStatus(type: string, id: string, status: string) {
  return apiCall(`/api/admin/content/${type}/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });
}

// Institutions API (extended)
export async function createInstitution(institutionData: any) {
  return apiCall('/api/institutions', {
    method: 'POST',
    body: JSON.stringify(institutionData)
  });
}

export async function updateInstitution(id: string, institutionData: any) {
  return apiCall(`/api/institutions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(institutionData)
  });
}

export async function deleteInstitution(id: string) {
  return apiCall(`/api/institutions/${id}`, {
    method: 'DELETE'
  });
}
