using System.ComponentModel.DataAnnotations;

namespace TaaleemAcademy.API.DTOs
{
    public class CreateQuizDto
    {
        [Required]
        public int CourseId { get; set; }

        public int? LessonId { get; set; }

        [Required]
        [StringLength(255)]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Range(0, 100)]
        public int PassingScore { get; set; } = 70;

        public int? TimeLimit { get; set; }

        public bool ShuffleQuestions { get; set; } = false;

        public bool ShowCorrectAnswers { get; set; } = true;

        public bool AllowRetake { get; set; } = true;

        public int? MaxAttempts { get; set; }

        public bool IsRequired { get; set; } = false;
    }
}