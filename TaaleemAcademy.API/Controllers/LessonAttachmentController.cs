using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TaaleemAcademy.API.Data;
using TaaleemAcademy.API.Models;
using TaaleemAcademy.API.DTOs;

namespace TaaleemAcademy.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // All endpoints require authentication
    public class LessonAttachmentController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public LessonAttachmentController(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        // Helper method
        private string? GetCurrentUserRole() => User.FindFirst(ClaimTypes.Role)?.Value;

        // GET: api/LessonAttachment - Authenticated users can view attachments
        [HttpGet]
        public async Task<ActionResult<IEnumerable<LessonAttachmentDto>>> GetAll()
        {
            try
            {
                var items = await _context.LessonAttachments.ToListAsync();
                return Ok(_mapper.Map<List<LessonAttachmentDto>>(items));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving attachments", error = ex.Message });
            }
        }

        // GET: api/LessonAttachment/5 - Authenticated users can view attachment
        // TODO: Check if user is enrolled in the course that contains this lesson
        [HttpGet("{id}")]
        public async Task<ActionResult<LessonAttachmentDto>> GetById(int id)
        {
            try
            {
                var item = await _context.LessonAttachments.FindAsync(id);
                if (item == null) return NotFound(new { message = $"Attachment with ID {id} not found" });
                return Ok(_mapper.Map<LessonAttachmentDto>(item));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving attachment", error = ex.Message });
            }
        }

        // POST: api/LessonAttachment - Only Instructor or Admin can create attachments
        [HttpPost]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<ActionResult<LessonAttachmentDto>> Create(CreateLessonAttachmentDto dto)
        {
            try
            {
                if (!ModelState.IsValid) return BadRequest(ModelState);
                var item = _mapper.Map<LessonAttachment>(dto);
                _context.LessonAttachments.Add(item);
                await _context.SaveChangesAsync();
                return CreatedAtAction(nameof(GetById), new { id = item.Id }, _mapper.Map<LessonAttachmentDto>(item));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error creating attachment", error = ex.Message });
            }
        }

        // PUT: api/LessonAttachment/5 - Only Instructor or Admin can update
        [HttpPut("{id}")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> Update(int id, UpdateLessonAttachmentDto dto)
        {
            try
            {
                if (id != dto.Id) return BadRequest(new { message = "ID mismatch" });
                var existing = await _context.LessonAttachments.FindAsync(id);
                if (existing == null) return NotFound();
                _mapper.Map(dto, existing);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Updated successfully", item = _mapper.Map<LessonAttachmentDto>(existing) });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating", error = ex.Message });
            }
        }

        // DELETE: api/LessonAttachment/5 - Only Instructor or Admin can delete
        [HttpDelete("{id}")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var item = await _context.LessonAttachments.FindAsync(id);
                if (item == null) return NotFound();
                _context.LessonAttachments.Remove(item);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Deleted successfully", id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting", error = ex.Message });
            }
        }
    }
}