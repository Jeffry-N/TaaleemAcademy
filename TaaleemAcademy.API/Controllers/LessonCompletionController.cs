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
    public class LessonCompletionController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public LessonCompletionController(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<LessonCompletionDto>>> GetAll()
        {
            var items = await _context.LessonCompletions.ToListAsync();
            return Ok(_mapper.Map<List<LessonCompletionDto>>(items));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<LessonCompletionDto>> GetById(int id)
        {
            var item = await _context.LessonCompletions.FindAsync(id);
            if (item == null) return NotFound();
            return Ok(_mapper.Map<LessonCompletionDto>(item));
        }

        [HttpPost]
        public async Task<ActionResult<LessonCompletionDto>> Create(CreateLessonCompletionDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            
            // Check if already completed
            var existing = await _context.LessonCompletions
                .FirstOrDefaultAsync(lc => lc.LessonId == dto.LessonId && lc.UserId == dto.UserId);
            if (existing != null) return Conflict(new { message = "Lesson already completed" });

            var item = _mapper.Map<LessonCompletion>(dto);
            _context.LessonCompletions.Add(item);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = item.Id }, _mapper.Map<LessonCompletionDto>(item));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateLessonCompletionDto dto)
        {
            if (id != dto.Id) return BadRequest();
            var existing = await _context.LessonCompletions.FindAsync(id);
            if (existing == null) return NotFound();
            _mapper.Map(dto, existing);
            await _context.SaveChangesAsync();
            return Ok(_mapper.Map<LessonCompletionDto>(existing));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await _context.LessonCompletions.FindAsync(id);
            if (item == null) return NotFound();
            _context.LessonCompletions.Remove(item);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Deleted", id });
        }
    }
}