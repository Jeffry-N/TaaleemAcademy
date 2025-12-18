using System.ComponentModel.DataAnnotations;
namespace TaaleemAcademy.API.DTOs
{
    public class UpdateQuestionDto
    {
        [Required]
        public int Id { get; set; }
        [Required]
        public int QuizId { get; set; }
        [Required]
        public string QuestionText { get; set; } = string.Empty;
        [Required]
        [RegularExpression("^(MCQ|TrueFalse|MultiSelect|ShortAnswer)$")]
        public string QuestionType { get; set; } = string.Empty;
        public int Points { get; set; }
        public int OrderIndex { get; set; }
    }
}