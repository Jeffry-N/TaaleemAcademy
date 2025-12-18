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
    public class LessonAttachmentController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public LessonAttachmentController(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

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

        [HttpPost]
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

        [HttpPut("{id}")]
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

        [HttpDelete("{id}")]
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