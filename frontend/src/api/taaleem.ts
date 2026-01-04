import { api } from './client';
import type {
  AuthResponse,
  Course,
  Category,
  Enrollment,
  Lesson,
  LessonCompletion,
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

export const fetchLessons = async (): Promise<Lesson[]> => {
  const res = await api.get<Lesson[]>('/Lesson');
  return res.data;
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
