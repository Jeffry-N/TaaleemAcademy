namespace TaaleemAcademy.API.DTOs
{
    public class CertificateDto
    {
        public int Id { get; set; }
        public int CourseId { get; set; }
        public int UserId { get; set; }
        public string CertificateCode { get; set; } = string.Empty;
        public string? DownloadUrl { get; set; }
        public DateTime GeneratedAt { get; set; }
        public int IssuedBy { get; set; }
    }
}