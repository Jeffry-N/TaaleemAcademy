namespace TaaleemAcademy.API.DTOs
{
    public class StudentAnswerDto
    {
        public int Id { get; set; }
        public int AttemptId { get; set; }
        public int QuestionId { get; set; }
        public int? AnswerId { get; set; }
        public string? TextAnswer { get; set; }
        public bool IsCorrect { get; set; }
        public int PointsEarned { get; set; }
    }
}