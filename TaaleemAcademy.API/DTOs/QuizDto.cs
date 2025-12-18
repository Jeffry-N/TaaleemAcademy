namespace TaaleemAcademy.API.DTOs
{
    public class QuizDto
    {
        public int Id { get; set; }
        public int CourseId { get; set; }
        public int? LessonId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int PassingScore { get; set; }
        public int? TimeLimit { get; set; }
        public bool ShuffleQuestions { get; set; }
        public bool ShowCorrectAnswers { get; set; }
        public bool AllowRetake { get; set; }
        public int? MaxAttempts { get; set; }
        public bool IsRequired { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}