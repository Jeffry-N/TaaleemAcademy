using System.ComponentModel.DataAnnotations;

namespace TaaleemAcademy.API.DTOs
{
    public class UpdateStudentAnswerDto
    {
        [Required]
        public int Id { get; set; }

        [Required]
        public int AttemptId { get; set; }

        [Required]
        public int QuestionId { get; set; }

        public int? AnswerId { get; set; }

        public string? TextAnswer { get; set; }

        public bool IsCorrect { get; set; }

        public int PointsEarned { get; set; }
    }
}