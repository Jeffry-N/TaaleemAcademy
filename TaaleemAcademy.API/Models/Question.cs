using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TaaleemAcademy.API.Models
{
    [Table("Question")]
    public class Question
    {
        [Key]
        public int Id { get; set; }
        [Required]
        public int QuizId { get; set; }
        [Required]
        public string QuestionText { get; set; } = string.Empty;
        [Required]
        [StringLength(20)]
        public string QuestionType { get; set; } = string.Empty;
        public int Points { get; set; } = 1;
        public int OrderIndex { get; set; } = 0;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}