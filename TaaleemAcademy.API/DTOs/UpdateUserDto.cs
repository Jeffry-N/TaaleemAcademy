using System.ComponentModel.DataAnnotations;

namespace TaaleemAcademy.API.DTOs
{
    public class UpdateUserDto
    {
        [Required]
        public int Id { get; set; }

        [Required(ErrorMessage = "Full name is required")]
        [StringLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress]
        [StringLength(255)]
        public string Email { get; set; } = string.Empty;

        [StringLength(255, MinimumLength = 6)]
        public string? Password { get; set; }

        [Required]
        [RegularExpression("^(Student|Instructor|Admin|SuperAdmin)$")]
        public string Role { get; set; } = string.Empty;

        public bool IsActive { get; set; }
    }
}