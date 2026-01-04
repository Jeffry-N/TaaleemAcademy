export type AuthResponse = {
  userId: number;
  fullName: string;
  email: string;
  role: string;
  token: string;
  refreshToken: string;
  tokenExpiration: string;
};

export type Course = {
  id: number;
  title: string;
  shortDescription?: string | null;
  longDescription?: string | null;
  categoryId: number;
  difficulty: string;
  thumbnailUrl?: string | null;
  estimatedDuration?: number | null;
  createdBy: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt?: string | null;
};

export type Category = {
  id: number;
  name: string;
  description?: string | null;
  slug: string;
  createdAt: string;
};

export type Lesson = {
  id: number;
  courseId: number;
  title: string;
  content?: string | null;
  videoUrl?: string | null;
  lessonType: string;
  orderIndex: number;
  estimatedDuration?: number | null;
  createdAt: string;
  updatedAt?: string | null;
};

export type Enrollment = {
  id: number;
  userId: number;
  courseId: number;
  enrolledAt: string;
  lastAccessedAt?: string | null;
  completionPercentage: number;
  isCompleted: boolean;
  completedAt?: string | null;
};

export type LessonCompletion = {
  id: number;
  lessonId: number;
  userId: number;
  completedAt: string;
};

export type ApiError = {
  message?: string;
  error?: string;
};
