using System.ComponentModel.DataAnnotations;
namespace TaaleemAcademy.API.DTOs
{
    public class CreateQuestionDto
    {
        [Required]
        public int QuizId { get; set; }
        [Required]
        public string QuestionText { get; set; } = string.Empty;
        [Required]
        [RegularExpression("^(MCQ|TrueFalse|MultiSelect|ShortAnswer)$")]
        public string QuestionType { get; set; } = "MCQ";
        public int Points { get; set; } = 1;
        public int OrderIndex { get; set; } = 0;
    }
}