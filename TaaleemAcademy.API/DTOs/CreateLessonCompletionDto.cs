using System.ComponentModel.DataAnnotations;

namespace TaaleemAcademy.API.DTOs
{
    public class CreateLessonCompletionDto
    {
        [Required]
        public int LessonId { get; set; }

        [Required]
        public int UserId { get; set; }
    }
}