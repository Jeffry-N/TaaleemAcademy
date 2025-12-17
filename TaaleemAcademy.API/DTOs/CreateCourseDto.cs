using System.ComponentModel.DataAnnotations;

namespace TaaleemAcademy.API.DTOs
{
    public class CreateCourseDto
    {
        [Required]
        [StringLength(255)]
        public string Title { get; set; } = string.Empty;

        [StringLength(500)]
        public string? ShortDescription { get; set; }

        public string? LongDescription { get; set; }

        [Required]
        public int CategoryId { get; set; }

        [Required]
        [RegularExpression("^(Beginner|Intermediate|Advanced)$")]
        public string Difficulty { get; set; } = "Beginner";

        [StringLength(500)]
        public string? ThumbnailUrl { get; set; }

        public int? EstimatedDuration { get; set; }

        [Required]
        public int CreatedBy { get; set; }

        public bool IsPublished { get; set; } = false;
    }
}