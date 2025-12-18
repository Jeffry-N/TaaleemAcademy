using System.ComponentModel.DataAnnotations;

namespace TaaleemAcademy.API.DTOs
{
    public class CreateCertificateDto
    {
        [Required]
        public int CourseId { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        [StringLength(50)]
        public string CertificateCode { get; set; } = string.Empty;

        [StringLength(500)]
        public string? DownloadUrl { get; set; }

        [Required]
        public int IssuedBy { get; set; }
    }
}