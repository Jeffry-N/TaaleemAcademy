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
export type CreateLesson = {
  courseId: number;
  title: string;
  content?: string | null;
  videoUrl?: string | null;
  lessonType: string;
  orderIndex: number;
  estimatedDuration?: number | null;
};
export type UpdateLesson = {
  id: number;
  courseId: number;
  title: string;
  content?: string | null;
  videoUrl?: string | null;
  lessonType: string;
  orderIndex: number;
  estimatedDuration?: number | null;
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

// Answers (quiz options)
export type Answer = {
  id: number;
  questionId: number;
  answerText: string;
  isCorrect: boolean;
  orderIndex: number;
};

export type ApiError = {
  message?: string;
  error?: string;
};

// Quizzes
export type Quiz = {
  id: number;
  courseId: number;
  lessonId?: number | null;
  title: string;
  description?: string | null;
  passingScore: number;
  timeLimit?: number | null;
  shuffleQuestions: boolean;
  showCorrectAnswers: boolean;
  allowRetake: boolean;
  maxAttempts?: number | null;
  isRequired: boolean;
  createdAt: string;
  updatedAt?: string | null;
};

export type CreateQuiz = Omit<Quiz, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateQuiz = Quiz;

// Questions
export type Question = {
  id: number;
  quizId: number;
  questionText: string;
  questionType: 'MCQ' | 'TrueFalse' | 'MultiSelect' | 'ShortAnswer';
  points: number;
  orderIndex: number;
  createdAt: string;
};
export type CreateQuestion = Omit<Question, 'id' | 'createdAt'>;
export type UpdateQuestion = Question;

// Quiz Attempts
export type QuizAttempt = {
  id: number;
  quizId: number;
  userId: number;
  score: number;
  totalPoints: number;
  earnedPoints: number;
  startedAt: string;
  submittedAt?: string | null;
  timeTaken?: number | null;
  isPassed: boolean;
};
export type CreateQuizAttempt = { quizId: number; userId: number };
export type UpdateQuizAttempt = QuizAttempt;

// Student Answers
export type StudentAnswer = {
  id: number;
  attemptId: number;
  questionId: number;
  answerId?: number | null;
  textAnswer?: string | null;
  isCorrect: boolean;
  pointsEarned: number;
};
export type CreateStudentAnswer = {
  attemptId: number;
  questionId: number;
  answerId?: number | null;
  textAnswer?: string | null;
  isCorrect?: boolean;
  pointsEarned?: number;
};

// Certificates
export type Certificate = {
  id: number;
  courseId: number;
  userId: number;
  certificateCode: string;
  downloadUrl?: string | null;
  generatedAt: string;
  issuedBy: number;
};
export type CreateCertificate = {
  courseId: number;
  userId: number;
  certificateCode: string;
  downloadUrl?: string | null;
  issuedBy: number;
};

// Users
export type User = {
  id: number;
  fullName: string;
  email: string;
  role: 'Student' | 'Instructor' | 'Admin';
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
};
export type UpdateUser = {
  id: number;
  fullName: string;
  email: string;
  role: 'Student' | 'Instructor' | 'Admin';
  isActive: boolean;
};

export type RegisterPayload = {
  fullName: string;
  email: string;
  password: string;
  role: 'Student' | 'Instructor' | 'Admin';
};
