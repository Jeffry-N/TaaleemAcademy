using System.ComponentModel.DataAnnotations;

namespace TaaleemAcademy.API.DTOs
{
    public class UpdateCategoryDto
    {
        [Required]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }

        [Required]
        [StringLength(100)]
        [RegularExpression(@"^[a-z0-9-]+$", ErrorMessage = "Slug must be lowercase with hyphens only")]
        public string Slug { get; set; } = string.Empty;
    }
}