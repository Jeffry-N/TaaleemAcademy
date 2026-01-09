import { api } from './client';
import type {
  AuthResponse,
  Course,
  Category,
  Enrollment,
  Lesson,
  LessonCompletion,
  CreateLesson,
  UpdateLesson,
  Quiz,
  CreateQuiz,
  UpdateQuiz,
  Question,
  CreateQuestion,
  UpdateQuestion,
  QuizAttempt,
  CreateQuizAttempt,
  UpdateQuizAttempt,
  StudentAnswer,
  CreateStudentAnswer,
  Certificate,
  CreateCertificate,
  User,
  RegisterPayload,
  Answer,
} from '../types/api';

export type LoginPayload = { email: string; password: string };

export const login = async (payload: LoginPayload): Promise<AuthResponse> => {
  const res = await api.post<AuthResponse>('/Auth/login', payload);
  return res.data;
};

export const fetchCourses = async (): Promise<Course[]> => {
  const res = await api.get<Course[]>('/Course');
  return res.data;
};

export const fetchCategories = async (): Promise<Category[]> => {
  const res = await api.get<Category[]>('/Category');
  return res.data;
};

export const fetchCourseById = async (id: number): Promise<Course> => {
  const res = await api.get<Course>(`/Course/${id}`);
  return res.data;
};

export const createCourse = async (payload: Partial<Course> & { title: string; categoryId: number; difficulty: string; createdBy: number }): Promise<Course> => {
  const res = await api.post<Course>('/Course', payload);
  return res.data;
};

export const updateCourse = async (id: number, payload: Partial<Course> & { id: number; createdBy: number }): Promise<Course> => {
  const res = await api.put(`/Course/${id}`, payload);
  return (res.data as any).course as Course;
};

export const fetchLessons = async (): Promise<Lesson[]> => {
  const res = await api.get<Lesson[]>('/Lesson');
  return res.data;
};

export const createLesson = async (payload: CreateLesson): Promise<Lesson> => {
  const res = await api.post<Lesson>('/Lesson', payload);
  return res.data;
};

export const updateLesson = async (id: number, payload: UpdateLesson): Promise<Lesson> => {
  const res = await api.put(`/Lesson/${id}`, payload);
  return (res.data as any).lesson as Lesson;
};

export const deleteLesson = async (id: number): Promise<void> => {
  await api.delete(`/Lesson/${id}`);
};

export const fetchLessonCompletions = async (): Promise<LessonCompletion[]> => {
  const res = await api.get<LessonCompletion[]>('/LessonCompletion');
  return res.data;
};

export const markLessonComplete = async (lessonId: number, userId: number) => {
  const res = await api.post<LessonCompletion>('/LessonCompletion', {
    lessonId,
    userId,
  });
  return res.data;
};

export const fetchEnrollments = async (): Promise<Enrollment[]> => {
  const res = await api.get<Enrollment[]>('/Enrollment');
  return res.data;
};

export const createEnrollment = async (userId: number, courseId: number) => {
  const res = await api.post('/Enrollment', { userId, courseId });
  return res.data as Enrollment;
};

// Quizzes
export const fetchQuizzes = async (): Promise<Quiz[]> => {
  const res = await api.get<Quiz[]>('/Quiz');
  return res.data;
};
export const fetchQuizById = async (id: number): Promise<Quiz> => {
  const res = await api.get<Quiz>(`/Quiz/${id}`);
  return res.data;
};
export const createQuiz = async (payload: CreateQuiz): Promise<Quiz> => {
  const res = await api.post<Quiz>('/Quiz', payload);
  return res.data;
};
export const updateQuiz = async (id: number, payload: UpdateQuiz): Promise<Quiz> => {
  const res = await api.put<Quiz>(`/Quiz/${id}`, payload);
  return res.data as unknown as Quiz; // some controllers wrap response
};
export const deleteQuiz = async (id: number): Promise<void> => {
  await api.delete(`/Quiz/${id}`);
};

// Questions
export const fetchQuestions = async (): Promise<Question[]> => {
  const res = await api.get<Question[]>('/Question');
  return res.data;
};
export const createQuestion = async (payload: CreateQuestion): Promise<Question> => {
  const res = await api.post<Question>('/Question', payload);
  return res.data;
};
export const updateQuestion = async (id: number, payload: UpdateQuestion): Promise<Question> => {
  const res = await api.put<Question>(`/Question/${id}`, payload);
  return res.data as unknown as Question;
};
export const deleteQuestion = async (id: number): Promise<void> => {
  await api.delete(`/Question/${id}`);
};

// Quiz Attempts
export const fetchQuizAttempts = async (): Promise<QuizAttempt[]> => {
  const res = await api.get<QuizAttempt[]>('/QuizAttempt');
  return res.data;
};
export const createQuizAttempt = async (payload: CreateQuizAttempt): Promise<QuizAttempt> => {
  const res = await api.post<QuizAttempt>('/QuizAttempt', payload);
  return res.data;
};
export const updateQuizAttempt = async (id: number, payload: UpdateQuizAttempt): Promise<QuizAttempt> => {
  const res = await api.put(`/QuizAttempt/${id}`, payload);
  return (res.data as any).quizAttempt as QuizAttempt;
};

// Student Answers
export const createStudentAnswer = async (payload: CreateStudentAnswer): Promise<StudentAnswer> => {
  const res = await api.post<StudentAnswer>('/StudentAnswer', payload);
  return res.data;
};

// Certificates
export const fetchCertificates = async (): Promise<Certificate[]> => {
  const res = await api.get<Certificate[]>('/Certificate');
  return res.data;
};

export const createCertificate = async (payload: CreateCertificate): Promise<Certificate> => {
  const res = await api.post<Certificate>('/Certificate', payload);
  return res.data;
};

// Users (Admin)
export const fetchUsers = async (): Promise<User[]> => {
  const res = await api.get<User[]>('/User');
  return res.data;
};
export const fetchUserById = async (id: number): Promise<User> => {
  const res = await api.get<User>(`/User/${id}`);
  return res.data;
};
export const updateUser = async (id: number, payload: Partial<User>): Promise<User> => {
  const res = await api.put(`/User/${id}`, { id, ...payload });
  return (res.data as any).user as User;
};
export const deleteUser = async (id: number): Promise<void> => {
  await api.delete(`/User/${id}`);
};

// Registration (Admin UI will call with desired role)
export const register = async (payload: RegisterPayload): Promise<AuthResponse> => {
  const res = await api.post<AuthResponse>('/Auth/register', payload);
  return res.data;
};

// Answers
export const fetchAnswersByQuiz = async (quizId: number): Promise<Answer[]> => {
  const res = await api.get<Answer[]>(`/Answer/quiz/${quizId}`);
  return res.data;
};
