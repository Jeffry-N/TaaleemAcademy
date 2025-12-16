using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaaleemAcademy.API.Data;
using TaaleemAcademy.API.Models;
using TaaleemAcademy.API.DTOs;

namespace TaaleemAcademy.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoryController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public CategoryController(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CategoryDto>>> GetAllCategories()
        {
            try
            {
                var categories = await _context.Categories.ToListAsync();
                var categoryDtos = _mapper.Map<List<CategoryDto>>(categories);
                return Ok(categoryDtos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving categories", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<CategoryDto>> GetCategoryById(int id)
        {
            try
            {
                var category = await _context.Categories.FindAsync(id);

                if (category == null)
                {
                    return NotFound(new { message = $"Category with ID {id} not found" });
                }

                var categoryDto = _mapper.Map<CategoryDto>(category);
                return Ok(categoryDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving category", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<CategoryDto>> CreateCategory(CreateCategoryDto createCategoryDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Check if name or slug already exists
                var existingCategory = await _context.Categories
                    .FirstOrDefaultAsync(c => c.Name == createCategoryDto.Name || c.Slug == createCategoryDto.Slug);
                
                if (existingCategory != null)
                {
                    return Conflict(new { message = "Category name or slug already exists" });
                }

                var category = _mapper.Map<Category>(createCategoryDto);
                
                _context.Categories.Add(category);
                await _context.SaveChangesAsync();

                var categoryDto = _mapper.Map<CategoryDto>(category);
                return CreatedAtAction(nameof(GetCategoryById), new { id = category.Id }, categoryDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error creating category", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCategory(int id, UpdateCategoryDto updateCategoryDto)
        {
            try
            {
                if (id != updateCategoryDto.Id)
                {
                    return BadRequest(new { message = "ID mismatch" });
                }

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var existingCategory = await _context.Categories.FindAsync(id);
                if (existingCategory == null)
                {
                    return NotFound(new { message = $"Category with ID {id} not found" });
                }

                _mapper.Map(updateCategoryDto, existingCategory);

                _context.Entry(existingCategory).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                var categoryDto = _mapper.Map<CategoryDto>(existingCategory);
                return Ok(new { message = "Category updated successfully", category = categoryDto });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating category", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            try
            {
                var category = await _context.Categories.FindAsync(id);
                if (category == null)
                {
                    return NotFound(new { message = $"Category with ID {id} not found" });
                }

                _context.Categories.Remove(category);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Category deleted successfully", categoryId = id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting category", error = ex.Message });
            }
        }
    }
}