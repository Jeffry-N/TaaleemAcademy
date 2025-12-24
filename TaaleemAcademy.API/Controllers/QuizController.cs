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
    public class QuizController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public QuizController(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        // GET: api/Quiz - Authenticated users can view quizzes
        // TODO: Filter to show only quizzes from courses the student is enrolled in
        [HttpGet]
        public async Task<ActionResult<IEnumerable<QuizDto>>> GetAll()
        {
            var items = await _context.Quizzes.ToListAsync();
            return Ok(_mapper.Map<List<QuizDto>>(items));
        }

        // GET: api/Quiz/5 - Authenticated users can view quiz
        // TODO: Check if user is enrolled in the course that contains this quiz
        [HttpGet("{id}")]
        public async Task<ActionResult<QuizDto>> GetById(int id)
        {
            var item = await _context.Quizzes.FindAsync(id);
            if (item == null) return NotFound();
            return Ok(_mapper.Map<QuizDto>(item));
        }

        // POST: api/Quiz - Only Instructor or Admin can create quizzes
        [HttpPost]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<ActionResult<QuizDto>> Create(CreateQuizDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var item = _mapper.Map<Quiz>(dto);
            _context.Quizzes.Add(item);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = item.Id }, _mapper.Map<QuizDto>(item));
        }

        // PUT: api/Quiz/5 - Only Instructor or Admin can update quizzes
        [HttpPut("{id}")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> Update(int id, UpdateQuizDto dto)
        {
            if (id != dto.Id) return BadRequest();
            var existing = await _context.Quizzes.FindAsync(id);
            if (existing == null) return NotFound();
            _mapper.Map(dto, existing);
            await _context.SaveChangesAsync();
            return Ok(_mapper.Map<QuizDto>(existing));
        }

        // DELETE: api/Quiz/5 - Only Instructor or Admin can delete quizzes
        [HttpDelete("{id}")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await _context.Quizzes.FindAsync(id);
            if (item == null) return NotFound();
            _context.Quizzes.Remove(item);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Deleted", id });
        }
    }
}