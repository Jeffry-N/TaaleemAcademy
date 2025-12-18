using System.ComponentModel.DataAnnotations;

namespace TaaleemAcademy.API.DTOs
{
    public class UpdateQuizDto
    {
        [Required]
        public int Id { get; set; }

        [Required]
        public int CourseId { get; set; }

        public int? LessonId { get; set; }

        [Required]
        [StringLength(255)]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Range(0, 100)]
        public int PassingScore { get; set; }

        public int? TimeLimit { get; set; }

        public bool ShuffleQuestions { get; set; }

        public bool ShowCorrectAnswers { get; set; }

        public bool AllowRetake { get; set; }

        public int? MaxAttempts { get; set; }

        public bool IsRequired { get; set; }
    }
}