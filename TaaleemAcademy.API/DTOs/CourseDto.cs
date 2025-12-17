namespace TaaleemAcademy.API.DTOs
{
    public class CourseDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? ShortDescription { get; set; }
        public string? LongDescription { get; set; }
        public int CategoryId { get; set; }
        public string Difficulty { get; set; } = string.Empty;
        public string? ThumbnailUrl { get; set; }
        public int? EstimatedDuration { get; set; }
        public int CreatedBy { get; set; }
        public bool IsPublished { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}