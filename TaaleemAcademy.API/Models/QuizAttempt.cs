using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace TaaleemAcademy.API.Models
{
    [Table("QuizAttempt")]
    public class QuizAttempt
    {
        [Key]
        public int Id { get; set; }
        [Required]
        public int QuizId { get; set; }
        [Required]
        public int UserId { get; set; }
        [Column(TypeName = "decimal(5,2)")]
        public decimal Score { get; set; } = 0.00M;
        public int TotalPoints { get; set; } = 0;
        public int EarnedPoints { get; set; } = 0;
        public DateTime StartedAt { get; set; } = DateTime.Now;
        public DateTime? SubmittedAt { get; set; }
        public int? TimeTaken { get; set; }
        public bool IsPassed { get; set; } = false;
    }
}