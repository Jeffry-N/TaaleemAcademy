using Microsoft.EntityFrameworkCore;
using TaaleemAcademy.API.Models;

namespace TaaleemAcademy.API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // All DbSets
        public DbSet<User> Users { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Course> Courses { get; set; }
        public DbSet<Enrollment> Enrollments { get; set; }
        public DbSet<Lesson> Lessons { get; set; }
        public DbSet<LessonAttachment> LessonAttachments { get; set; }
        public DbSet<LessonCompletion> LessonCompletions { get; set; }
        public DbSet<Quiz> Quizzes { get; set; }
        public DbSet<Question> Questions { get; set; }
        public DbSet<Answer> Answers { get; set; }
        public DbSet<QuizAttempt> QuizAttempts { get; set; }
        public DbSet<StudentAnswer> StudentAnswers { get; set; }
        public DbSet<Certificate> Certificates { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User configuration
            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("User");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Email).IsUnique();
                entity.Property(e => e.Role).HasMaxLength(20);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");
            });

            // Category configuration
            modelBuilder.Entity<Category>(entity =>
            {
                entity.ToTable("Category");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Name).IsUnique();
                entity.HasIndex(e => e.Slug).IsUnique();
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");
            });

            // Course configuration
            modelBuilder.Entity<Course>(entity =>
            {
                entity.ToTable("Course");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");
            });

            // Enrollment configuration
            modelBuilder.Entity<Enrollment>(entity =>
            {
                entity.ToTable("Enrollment");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.UserId, e.CourseId }).IsUnique();
                entity.Property(e => e.EnrolledAt).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.CompletionPercentage).HasDefaultValue(0.00M);
            });

            // Lesson configuration
            modelBuilder.Entity<Lesson>(entity =>
            {
                entity.ToTable("Lesson");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");
            });

            // LessonAttachment configuration
            modelBuilder.Entity<LessonAttachment>(entity =>
            {
                entity.ToTable("LessonAttachment");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.UploadedAt).HasDefaultValueSql("GETDATE()");
            });

            // LessonCompletion configuration
            modelBuilder.Entity<LessonCompletion>(entity =>
            {
                entity.ToTable("LessonCompletion");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.LessonId, e.UserId }).IsUnique();
                entity.Property(e => e.CompletedAt).HasDefaultValueSql("GETDATE()");
            });

            // Quiz configuration
            modelBuilder.Entity<Quiz>(entity =>
            {
                entity.ToTable("Quiz");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.PassingScore).HasDefaultValue(70);
                entity.Property(e => e.ShuffleQuestions).HasDefaultValue(false);
                entity.Property(e => e.ShowCorrectAnswers).HasDefaultValue(true);
                entity.Property(e => e.AllowRetake).HasDefaultValue(true);
                entity.Property(e => e.IsRequired).HasDefaultValue(false);
            });

            // Question configuration
            modelBuilder.Entity<Question>(entity =>
            {
                entity.ToTable("Question");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.Points).HasDefaultValue(1);
                entity.Property(e => e.OrderIndex).HasDefaultValue(0);
            });

            // Answer configuration
            modelBuilder.Entity<Answer>(entity =>
            {
                entity.ToTable("Answer");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.IsCorrect).HasDefaultValue(false);
                entity.Property(e => e.OrderIndex).HasDefaultValue(0);
            });

            // QuizAttempt configuration
            modelBuilder.Entity<QuizAttempt>(entity =>
            {
                entity.ToTable("QuizAttempt");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.StartedAt).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.Score).HasDefaultValue(0.00M);
                entity.Property(e => e.TotalPoints).HasDefaultValue(0);
                entity.Property(e => e.EarnedPoints).HasDefaultValue(0);
                entity.Property(e => e.IsPassed).HasDefaultValue(false);
            });

            // StudentAnswer configuration
            modelBuilder.Entity<StudentAnswer>(entity =>
            {
                entity.ToTable("StudentAnswer");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.IsCorrect).HasDefaultValue(false);
                entity.Property(e => e.PointsEarned).HasDefaultValue(0);
            });

            // Certificate configuration
            modelBuilder.Entity<Certificate>(entity =>
            {
                entity.ToTable("Certificate");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.CertificateCode).IsUnique();
                entity.HasIndex(e => new { e.UserId, e.CourseId }).IsUnique();
                entity.Property(e => e.GeneratedAt).HasDefaultValueSql("GETDATE()");
            });

            // RefreshToken configuration
            modelBuilder.Entity<RefreshToken>(entity =>
{
                entity.ToTable("RefreshToken");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Token);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.IsRevoked).HasDefaultValue(false);
        });
        }
    }
}