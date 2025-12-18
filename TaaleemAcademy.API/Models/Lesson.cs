using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TaaleemAcademy.API.Models
{
    [Table("Lesson")]
    public class Lesson
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int CourseId { get; set; }

        [Required]
        [StringLength(255)]
        public string Title { get; set; } = string.Empty;

        public string? Content { get; set; }

        [StringLength(500)]
        public string? VideoUrl { get; set; }

        [Required]
        [StringLength(20)]
        public string LessonType { get; set; } = string.Empty;

        public int OrderIndex { get; set; } = 0;

        public int? EstimatedDuration { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime? UpdatedAt { get; set; }
    }
}