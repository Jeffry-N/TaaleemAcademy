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
    public class QuestionController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public QuestionController(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<QuestionDto>>> GetAll()
        {
            return Ok(_mapper.Map<List<QuestionDto>>(await _context.Questions.ToListAsync()));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<QuestionDto>> GetById(int id)
        {
            var item = await _context.Questions.FindAsync(id);
            if (item == null) return NotFound();
            return Ok(_mapper.Map<QuestionDto>(item));
        }

        [HttpPost]
        public async Task<ActionResult<QuestionDto>> Create(CreateQuestionDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var item = _mapper.Map<Question>(dto);
            _context.Questions.Add(item);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = item.Id }, _mapper.Map<QuestionDto>(item));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateQuestionDto dto)
        {
            if (id != dto.Id) return BadRequest();
            var existing = await _context.Questions.FindAsync(id);
            if (existing == null) return NotFound();
            _mapper.Map(dto, existing);
            await _context.SaveChangesAsync();
            return Ok(_mapper.Map<QuestionDto>(existing));
        }

        [HttpDelete("{id}")]
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