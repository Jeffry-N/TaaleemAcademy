using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TaaleemAcademy.API.Models
{
    [Table("Course")]
    public class Course
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(255)]
        public string Title { get; set; } = string.Empty;

        [StringLength(500)]
        public string? ShortDescription { get; set; }

        public string? LongDescription { get; set; }

        [Required]
        public int CategoryId { get; set; }

        [Required]
        [StringLength(20)]
        public string Difficulty { get; set; } = string.Empty;

        [StringLength(500)]
        public string? ThumbnailUrl { get; set; }

        public int? EstimatedDuration { get; set; }

        [Required]
        public int CreatedBy { get; set; }

        public bool IsPublished { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime? UpdatedAt { get; set; }
    }
}