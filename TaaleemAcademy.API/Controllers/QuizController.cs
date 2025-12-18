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
    public class QuizController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public QuizController(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<QuizDto>>> GetAll()
        {
            var items = await _context.Quizzes.ToListAsync();
            return Ok(_mapper.Map<List<QuizDto>>(items));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<QuizDto>> GetById(int id)
        {
            var item = await _context.Quizzes.FindAsync(id);
            if (item == null) return NotFound();
            return Ok(_mapper.Map<QuizDto>(item));
        }

        [HttpPost]
        public async Task<ActionResult<QuizDto>> Create(CreateQuizDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var item = _mapper.Map<Quiz>(dto);
            _context.Quizzes.Add(item);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = item.Id }, _mapper.Map<QuizDto>(item));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateQuizDto dto)
        {
            if (id != dto.Id) return BadRequest();
            var existing = await _context.Quizzes.FindAsync(id);
            if (existing == null) return NotFound();
            _mapper.Map(dto, existing);
            await _context.SaveChangesAsync();
            return Ok(_mapper.Map<QuizDto>(existing));
        }

        [HttpDelete("{id}")]
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