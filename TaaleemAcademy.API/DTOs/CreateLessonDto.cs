using System.ComponentModel.DataAnnotations;

namespace TaaleemAcademy.API.DTOs
{
    public class CreateLessonDto
    {
        [Required]
        public int CourseId { get; set; }

        [Required]
        [StringLength(255)]
        public string Title { get; set; } = string.Empty;

        public string? Content { get; set; }

        [StringLength(500)]
        public string? VideoUrl { get; set; }

        [Required]
        [RegularExpression("^(Video|Article|Mixed)$")]
        public string LessonType { get; set; } = "Article";

        public int OrderIndex { get; set; } = 0;

        public int? EstimatedDuration { get; set; }
    }
}