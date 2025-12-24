using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaaleemAcademy.API.Data;
using TaaleemAcademy.API.Models;
using TaaleemAcademy.API.DTOs;

namespace TaaleemAcademy.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // All endpoints require authentication
    public class LessonController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public LessonController(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        // GET: api/Lesson - Authenticated users can view lessons
        // TODO: Filter to show only lessons from courses the student is enrolled in
        [HttpGet]
        public async Task<ActionResult<IEnumerable<LessonDto>>> GetAllLessons()
        {
            try
            {
                var lessons = await _context.Lessons.ToListAsync();
                return Ok(_mapper.Map<List<LessonDto>>(lessons));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving lessons", error = ex.Message });
            }
        }

        // GET: api/Lesson/5 - Authenticated users can view lesson
        // TODO: Check if user is enrolled in the course that contains this lesson
        [HttpGet("{id}")]
        public async Task<ActionResult<LessonDto>> GetLessonById(int id)
        {
            try
            {
                var lesson = await _context.Lessons.FindAsync(id);
                if (lesson == null) return NotFound(new { message = $"Lesson with ID {id} not found" });
                return Ok(_mapper.Map<LessonDto>(lesson));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving lesson", error = ex.Message });
            }
        }

        // POST: api/Lesson - Only Instructor or Admin can create lessons
        [HttpPost]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<ActionResult<LessonDto>> CreateLesson(CreateLessonDto createLessonDto)
        {
            try
            {
                if (!ModelState.IsValid) return BadRequest(ModelState);
                var lesson = _mapper.Map<Lesson>(createLessonDto);
                _context.Lessons.Add(lesson);
                await _context.SaveChangesAsync();
                return CreatedAtAction(nameof(GetLessonById), new { id = lesson.Id }, _mapper.Map<LessonDto>(lesson));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error creating lesson", error = ex.Message });
            }
        }

        // PUT: api/Lesson/5 - Only Instructor or Admin can update lessons
        [HttpPut("{id}")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> UpdateLesson(int id, UpdateLessonDto updateLessonDto)
        {
            try
            {
                if (id != updateLessonDto.Id) return BadRequest(new { message = "ID mismatch" });
                if (!ModelState.IsValid) return BadRequest(ModelState);
                var existing = await _context.Lessons.FindAsync(id);
                if (existing == null) return NotFound(new { message = $"Lesson with ID {id} not found" });
                _mapper.Map(updateLessonDto, existing);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Lesson updated successfully", lesson = _mapper.Map<LessonDto>(existing) });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating lesson", error = ex.Message });
            }
        }

        // DELETE: api/Lesson/5 - Only Instructor or Admin can delete lessons
        [HttpDelete("{id}")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> DeleteLesson(int id)
        {
            try
            {
                var lesson = await _context.Lessons.FindAsync(id);
                if (lesson == null) return NotFound(new { message = $"Lesson with ID {id} not found" });
                _context.Lessons.Remove(lesson);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Lesson deleted successfully", lessonId = id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting lesson", error = ex.Message });
            }
        }
    }
}