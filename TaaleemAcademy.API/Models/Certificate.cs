using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TaaleemAcademy.API.Models
{
    [Table("Certificate")]
    public class Certificate
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int CourseId { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        [StringLength(50)]
        public string CertificateCode { get; set; } = string.Empty;

        [StringLength(500)]
        public string? DownloadUrl { get; set; }

        public DateTime GeneratedAt { get; set; } = DateTime.Now;

        [Required]
        public int IssuedBy { get; set; }
    }
}