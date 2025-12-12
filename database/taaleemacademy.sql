-- =====================================================
-- Taaleem Academy - SQL SERVER DATABASE
-- =====================================================

CREATE DATABASE TaaleemAcademy;
GO

USE TaaleemAcademy;
GO

-- =====================================================
-- TABLE 1: User
-- =====================================================


CREATE TABLE [User] (
    Id INT IDENTITY(1,1) NOT NULL,
    FullName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(255) NOT NULL,
    HashedPassword NVARCHAR(255) NOT NULL,
    Role NVARCHAR(20) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME NULL,
    CONSTRAINT PkUser_Id PRIMARY KEY (Id),
    CONSTRAINT UnUser_Email UNIQUE (Email),
    CONSTRAINT CkUser_Role CHECK (Role IN ('Student', 'Instructor', 'Admin', 'SuperAdmin'))
);
GO

CREATE INDEX IX_User_Email ON [User](Email);
CREATE INDEX IX_User_Role ON [User](Role);
GO

-- =====================================================
-- TABLE 2: Category
-- =====================================================
CREATE TABLE Category (
    Id INT IDENTITY(1,1) NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    Slug NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PkCategory_Id PRIMARY KEY (Id),
    CONSTRAINT UnCategory_Name UNIQUE (Name),
    CONSTRAINT UnCategory_Slug UNIQUE (Slug)
);
GO

CREATE INDEX IX_Category_Slug ON Category(Slug);
GO

-- =====================================================
-- TABLE 3: Course
-- =====================================================
CREATE TABLE Course (
    Id INT IDENTITY(1,1) NOT NULL,
    Title NVARCHAR(255) NOT NULL,
    ShortDescription NVARCHAR(500) NULL,
    LongDescription NVARCHAR(MAX) NULL,
    CategoryId INT NOT NULL,
    Difficulty NVARCHAR(20) NOT NULL,
    ThumbnailUrl NVARCHAR(500) NULL,
    EstimatedDuration INT NULL,
    CreatedBy INT NOT NULL,
    IsPublished BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME NULL,
    CONSTRAINT PkCourse_Id PRIMARY KEY (Id),
    CONSTRAINT FkCourse_CategoryId FOREIGN KEY (CategoryId) REFERENCES Category(Id) ON DELETE CASCADE,
    CONSTRAINT FkCourse_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES [User](Id) ON DELETE NO ACTION,
    CONSTRAINT CkCourse_Difficulty CHECK (Difficulty IN ('Beginner', 'Intermediate', 'Advanced'))
);
GO

CREATE INDEX IX_Course_CategoryId ON Course(CategoryId);
CREATE INDEX IX_Course_CreatedBy ON Course(CreatedBy);
CREATE INDEX IX_Course_IsPublished ON Course(IsPublished);
GO

-- =====================================================
-- TABLE 4: Enrollment
-- =====================================================
CREATE TABLE Enrollment (
    Id INT IDENTITY(1,1) NOT NULL,
    UserId INT NOT NULL,
    CourseId INT NOT NULL,
    EnrolledAt DATETIME NOT NULL DEFAULT GETDATE(),
    LastAccessedAt DATETIME NULL,
    CompletionPercentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    IsCompleted BIT NOT NULL DEFAULT 0,
    CompletedAt DATETIME NULL,
    CONSTRAINT PkEnrollment_Id PRIMARY KEY (Id),
    CONSTRAINT FkEnrollment_UserId FOREIGN KEY (UserId) REFERENCES [User](Id) ON DELETE CASCADE,
    CONSTRAINT FkEnrollment_CourseId FOREIGN KEY (CourseId) REFERENCES Course(Id) ON DELETE CASCADE,
    CONSTRAINT UnEnrollment_UserIdCourseId UNIQUE(UserId, CourseId)
);
GO

CREATE INDEX IX_Enrollment_UserId ON Enrollment(UserId);
CREATE INDEX IX_Enrollment_CourseId ON Enrollment(CourseId);
CREATE INDEX IX_Enrollment_UserIdCourseId ON Enrollment(UserId, CourseId);
GO

-- =====================================================
-- TABLE 5: Lesson
-- =====================================================
CREATE TABLE Lesson (
    Id INT IDENTITY(1,1) NOT NULL,
    CourseId INT NOT NULL,
    Title NVARCHAR(255) NOT NULL,
    Content NVARCHAR(MAX) NULL,
    VideoUrl NVARCHAR(500) NULL,
    LessonType NVARCHAR(20) NOT NULL,
    OrderIndex INT NOT NULL DEFAULT 0,
    EstimatedDuration INT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME NULL,
    CONSTRAINT PkLesson_Id PRIMARY KEY (Id),
    CONSTRAINT FkLesson_CourseId FOREIGN KEY (CourseId) REFERENCES Course(Id) ON DELETE CASCADE,
    CONSTRAINT CkLesson_LessonType CHECK (LessonType IN ('Video', 'Article', 'Mixed'))
);
GO

CREATE INDEX IX_Lesson_CourseId ON Lesson(CourseId);
CREATE INDEX IX_Lesson_CourseIdOrderIndex ON Lesson(CourseId, OrderIndex);
GO

-- =====================================================
-- TABLE 6: LessonAttachment
-- =====================================================
CREATE TABLE LessonAttachment (
    Id INT IDENTITY(1,1) NOT NULL,
    LessonId INT NOT NULL,
    FileName NVARCHAR(255) NOT NULL,
    FileUrl NVARCHAR(500) NOT NULL,
    FileType NVARCHAR(50) NULL,
    FileSize BIGINT NULL,
    UploadedAt DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PkLessonAttachment_Id PRIMARY KEY (Id),
    CONSTRAINT FkLessonAttachment_LessonId FOREIGN KEY (LessonId) REFERENCES Lesson(Id) ON DELETE CASCADE
);
GO

CREATE INDEX IX_LessonAttachment_LessonId ON LessonAttachment(LessonId);
GO

-- =====================================================
-- TABLE 7: LessonCompletion
-- =====================================================
CREATE TABLE LessonCompletion (
    Id INT IDENTITY(1,1) NOT NULL,
    LessonId INT NOT NULL,
    UserId INT NOT NULL,
    CompletedAt DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PkLessonCompletion_Id PRIMARY KEY (Id),
    CONSTRAINT FkLessonCompletion_LessonId FOREIGN KEY (LessonId) REFERENCES Lesson(Id) ON DELETE CASCADE,
    CONSTRAINT FkLessonCompletion_UserId FOREIGN KEY (UserId) REFERENCES [User](Id) ON DELETE CASCADE,
    CONSTRAINT UnLessonCompletion_LessonIdUserId UNIQUE(LessonId, UserId)
);
GO

CREATE INDEX IX_LessonCompletion_UserId ON LessonCompletion(UserId);
CREATE INDEX IX_LessonCompletion_LessonId ON LessonCompletion(LessonId);
GO

-- =====================================================
-- TABLE 8: Quiz
-- =====================================================
CREATE TABLE Quiz (
    Id INT IDENTITY(1,1) NOT NULL,
    CourseId INT NOT NULL,
    LessonId INT NULL,
    Title NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    PassingScore INT NOT NULL DEFAULT 70,
    TimeLimit INT NULL,
    ShuffleQuestions BIT NOT NULL DEFAULT 0,
    ShowCorrectAnswers BIT NOT NULL DEFAULT 1,
    AllowRetake BIT NOT NULL DEFAULT 1,
    MaxAttempts INT NULL,
    IsRequired BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME NULL,
    CONSTRAINT PkQuiz_Id PRIMARY KEY (Id),
    CONSTRAINT FkQuiz_CourseId FOREIGN KEY (CourseId) REFERENCES Course(Id) ON DELETE CASCADE,
    CONSTRAINT FkQuiz_LessonId FOREIGN KEY (LessonId) REFERENCES Lesson(Id) ON DELETE NO ACTION
);
GO

CREATE INDEX IX_Quiz_CourseId ON Quiz(CourseId);
CREATE INDEX IX_Quiz_LessonId ON Quiz(LessonId);
GO

-- =====================================================
-- TABLE 9: Question
-- =====================================================
CREATE TABLE Question (
    Id INT IDENTITY(1,1) NOT NULL,
    QuizId INT NOT NULL,
    QuestionText NVARCHAR(MAX) NOT NULL,
    QuestionType NVARCHAR(20) NOT NULL,
    Points INT NOT NULL DEFAULT 1,
    OrderIndex INT NOT NULL DEFAULT 0,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PkQuestion_Id PRIMARY KEY (Id),
    CONSTRAINT FkQuestion_QuizId FOREIGN KEY (QuizId) REFERENCES Quiz(Id) ON DELETE CASCADE,
    CONSTRAINT CkQuestion_QuestionType CHECK (QuestionType IN ('MCQ', 'TrueFalse', 'MultiSelect', 'ShortAnswer'))
);
GO

CREATE INDEX IX_Question_QuizId ON Question(QuizId);
CREATE INDEX IX_Question_QuizIdOrderIndex ON Question(QuizId, OrderIndex);
GO

-- =====================================================
-- TABLE 10: Answer
-- =====================================================
CREATE TABLE Answer (
    Id INT IDENTITY(1,1) NOT NULL,
    QuestionId INT NOT NULL,
    AnswerText NVARCHAR(MAX) NOT NULL,
    IsCorrect BIT NOT NULL DEFAULT 0,
    OrderIndex INT NOT NULL DEFAULT 0,
    CONSTRAINT PkAnswer_Id PRIMARY KEY (Id),
    CONSTRAINT FkAnswer_QuestionId FOREIGN KEY (QuestionId) REFERENCES Question(Id) ON DELETE CASCADE
);
GO

CREATE INDEX IX_Answer_QuestionId ON Answer(QuestionId);
GO

-- =====================================================
-- TABLE 11: QuizAttempt
-- =====================================================
CREATE TABLE QuizAttempt (
    Id INT IDENTITY(1,1) NOT NULL,
    QuizId INT NOT NULL,
    UserId INT NOT NULL,
    Score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    TotalPoints INT NOT NULL DEFAULT 0,
    EarnedPoints INT NOT NULL DEFAULT 0,
    StartedAt DATETIME NOT NULL DEFAULT GETDATE(),
    SubmittedAt DATETIME NULL,
    TimeTaken INT NULL,
    IsPassed BIT NOT NULL DEFAULT 0,
    CONSTRAINT PkQuizAttempt_Id PRIMARY KEY (Id),
    CONSTRAINT FkQuizAttempt_QuizId FOREIGN KEY (QuizId) REFERENCES Quiz(Id) ON DELETE CASCADE,
    CONSTRAINT FkQuizAttempt_UserId FOREIGN KEY (UserId) REFERENCES [User](Id) ON DELETE CASCADE
);
GO

CREATE INDEX IX_QuizAttempt_UserId ON QuizAttempt(UserId);
CREATE INDEX IX_QuizAttempt_QuizId ON QuizAttempt(QuizId);
CREATE INDEX IX_QuizAttempt_UserIdQuizId ON QuizAttempt(UserId, QuizId);
GO

-- =====================================================
-- TABLE 12: StudentAnswer
-- =====================================================
CREATE TABLE StudentAnswer (
    Id INT IDENTITY(1,1) NOT NULL,
    AttemptId INT NOT NULL,
    QuestionId INT NOT NULL,
    AnswerId INT NULL,
    TextAnswer NVARCHAR(MAX) NULL,
    IsCorrect BIT NOT NULL DEFAULT 0,
    PointsEarned INT NOT NULL DEFAULT 0,
    CONSTRAINT PkStudentAnswer_Id PRIMARY KEY (Id),
    CONSTRAINT FkStudentAnswer_AttemptId FOREIGN KEY (AttemptId) REFERENCES QuizAttempt(Id) ON DELETE CASCADE,
    CONSTRAINT FkStudentAnswer_QuestionId FOREIGN KEY (QuestionId) REFERENCES Question(Id) ON DELETE NO ACTION,
    CONSTRAINT FkStudentAnswer_AnswerId FOREIGN KEY (AnswerId) REFERENCES Answer(Id) ON DELETE NO ACTION
);
GO

CREATE INDEX IX_StudentAnswer_AttemptId ON StudentAnswer(AttemptId);
CREATE INDEX IX_StudentAnswer_QuestionId ON StudentAnswer(QuestionId);
GO

-- =====================================================
-- TABLE 13: Certificate
-- =====================================================
CREATE TABLE Certificate (
    Id INT IDENTITY(1,1) NOT NULL,
    CourseId INT NOT NULL,
    UserId INT NOT NULL,
    CertificateCode NVARCHAR(50) NOT NULL,
    DownloadUrl NVARCHAR(500) NULL,
    GeneratedAt DATETIME NOT NULL DEFAULT GETDATE(),
    IssuedBy INT NOT NULL,
    CONSTRAINT PkCertificate_Id PRIMARY KEY (Id),
    CONSTRAINT FkCertificate_CourseId FOREIGN KEY (CourseId) REFERENCES Course(Id) ON DELETE CASCADE,
    CONSTRAINT FkCertificate_UserId FOREIGN KEY (UserId) REFERENCES [User](Id) ON DELETE NO ACTION,
    CONSTRAINT FkCertificate_IssuedBy FOREIGN KEY (IssuedBy) REFERENCES [User](Id) ON DELETE NO ACTION,
    CONSTRAINT UnCertificate_CertificateCode UNIQUE(CertificateCode),
    CONSTRAINT UnCertificate_UserIdCourseId UNIQUE(UserId, CourseId)
);
GO

CREATE INDEX IX_Certificate_CertificateCode ON Certificate(CertificateCode);
CREATE INDEX IX_Certificate_UserId ON Certificate(UserId);
CREATE INDEX IX_Certificate_CourseId ON Certificate(CourseId);
GO

PRINT 'Database created successfully!';
PRINT 'Total Tables Created: 13';
GO