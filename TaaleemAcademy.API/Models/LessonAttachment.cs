using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TaaleemAcademy.API.Models
{
    [Table("LessonAttachment")]
    public class LessonAttachment
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int LessonId { get; set; }

        [Required]
        [StringLength(255)]
        public string FileName { get; set; } = string.Empty;

        [Required]
        [StringLength(500)]
        public string FileUrl { get; set; } = string.Empty;

        [StringLength(50)]
        public string? FileType { get; set; }

        public long? FileSize { get; set; }

        public DateTime UploadedAt { get; set; } = DateTime.Now;
    }
}