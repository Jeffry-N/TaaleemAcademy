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
    public class QuestionController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public QuestionController(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        // GET: api/Question - Authenticated users can view questions
        // TODO: Filter to show only questions from quizzes in courses the student is enrolled in
        [HttpGet]
        public async Task<ActionResult<IEnumerable<QuestionDto>>> GetAll()
        {
            return Ok(_mapper.Map<List<QuestionDto>>(await _context.Questions.ToListAsync()));
        }

        // GET: api/Question/5 - Authenticated users can view question
        // TODO: Check if user is enrolled in the course that contains this question's quiz
        [HttpGet("{id}")]
        public async Task<ActionResult<QuestionDto>> GetById(int id)
        {
            var item = await _context.Questions.FindAsync(id);
            if (item == null) return NotFound();
            return Ok(_mapper.Map<QuestionDto>(item));
        }

        // POST: api/Question - Only Instructor or Admin can create questions
        [HttpPost]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<ActionResult<QuestionDto>> Create(CreateQuestionDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var item = _mapper.Map<Question>(dto);
            _context.Questions.Add(item);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = item.Id }, _mapper.Map<QuestionDto>(item));
        }

        // PUT: api/Question/5 - Only Instructor or Admin can update questions
        [HttpPut("{id}")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> Update(int id, UpdateQuestionDto dto)
        {
            if (id != dto.Id) return BadRequest();
            var existing = await _context.Questions.FindAsync(id);
            if (existing == null) return NotFound();
            _mapper.Map(dto, existing);
            await _context.SaveChangesAsync();
            return Ok(_mapper.Map<QuestionDto>(existing));
        }

        // DELETE: api/Question/5 - Only Instructor or Admin can delete questions
        [HttpDelete("{id}")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await _context.Questions.FindAsync(id);
            if (item == null) return NotFound();
            _context.Questions.Remove(item);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Deleted", id });
        }
    }
}