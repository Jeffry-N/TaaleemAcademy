namespace TaaleemAcademy.API.DTOs
{

    public class CreateAnswerDto
    {
        public int QuestionId { get; set; }
        public string AnswerText { get; set; } = string.Empty;
        public bool IsCorrect { get; set; } = false;
        public int OrderIndex { get; set; } = 0;
    }
}