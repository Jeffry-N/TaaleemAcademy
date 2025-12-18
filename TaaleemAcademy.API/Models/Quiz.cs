using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TaaleemAcademy.API.Models
{
    [Table("Quiz")]
    public class Quiz
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int CourseId { get; set; }

        public int? LessonId { get; set; }

        [Required]
        [StringLength(255)]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        public int PassingScore { get; set; } = 70;

        public int? TimeLimit { get; set; }

        public bool ShuffleQuestions { get; set; } = false;

        public bool ShowCorrectAnswers { get; set; } = true;

        public bool AllowRetake { get; set; } = true;

        public int? MaxAttempts { get; set; }

        public bool IsRequired { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime? UpdatedAt { get; set; }
    }
}