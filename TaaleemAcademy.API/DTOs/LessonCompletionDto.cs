namespace TaaleemAcademy.API.DTOs
{
    public class LessonCompletionDto
    {
        public int Id { get; set; }
        public int LessonId { get; set; }
        public int UserId { get; set; }
        public DateTime CompletedAt { get; set; }
    }
}