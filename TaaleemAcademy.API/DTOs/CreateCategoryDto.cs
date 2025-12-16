using System.ComponentModel.DataAnnotations;

namespace TaaleemAcademy.API.DTOs
{
    public class CreateCategoryDto
    {
        [Required(ErrorMessage = "Category name is required")]
        [StringLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
        public string Name { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
        public string? Description { get; set; }

        [Required(ErrorMessage = "Slug is required")]
        [StringLength(100)]
        [RegularExpression(@"^[a-z0-9-]+$", ErrorMessage = "Slug must be lowercase with hyphens only")]
        public string Slug { get; set; } = string.Empty;
    }
}