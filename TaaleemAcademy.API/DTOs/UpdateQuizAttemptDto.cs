namespace TaaleemAcademy.API.DTOs
{
    public class UpdateQuizAttemptDto
    {
        public int Id { get; set; }
        public int QuizId { get; set; }
        public int UserId { get; set; }
        public decimal Score { get; set; }
        public int TotalPoints { get; set; }
        public int EarnedPoints { get; set; }
        public DateTime? SubmittedAt { get; set; }
        public int? TimeTaken { get; set; }
        public bool IsPassed { get; set; }
    }
}