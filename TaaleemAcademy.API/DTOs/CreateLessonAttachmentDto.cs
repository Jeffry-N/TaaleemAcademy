using System.ComponentModel.DataAnnotations;

namespace TaaleemAcademy.API.DTOs
{
    public class CreateLessonAttachmentDto
    {
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
    }
}