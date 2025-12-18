using System.ComponentModel.DataAnnotations;

namespace TaaleemAcademy.API.DTOs
{
    public class CreateStudentAnswerDto
    {
        [Required]
        public int AttemptId { get; set; }

        [Required]
        public int QuestionId { get; set; }

        public int? AnswerId { get; set; }

        public string? TextAnswer { get; set; }

        public bool IsCorrect { get; set; } = false;

        public int PointsEarned { get; set; } = 0;
    }
}