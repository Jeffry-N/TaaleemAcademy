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
    public class AnswerController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        public AnswerController(ApplicationDbContext context, IMapper mapper) { _context = context; _mapper = mapper; }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<AnswerDto>>> GetAll() => Ok(_mapper.Map<List<AnswerDto>>(await _context.Answers.ToListAsync()));

        [HttpGet("{id}")]
        public async Task<ActionResult<AnswerDto>> GetById(int id)
        {
            var item = await _context.Answers.FindAsync(id);
            return item == null ? NotFound() : Ok(_mapper.Map<AnswerDto>(item));
        }

        [HttpPost]
        public async Task<ActionResult<AnswerDto>> Create(CreateAnswerDto dto)
        {
            var item = _mapper.Map<Answer>(dto);
            _context.Answers.Add(item);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = item.Id }, _mapper.Map<AnswerDto>(item));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateAnswerDto dto)
        {
            if (id != dto.Id) return BadRequest();
            var existing = await _context.Answers.FindAsync(id);
            if (existing == null) return NotFound();
            _mapper.Map(dto, existing);
            await _context.SaveChangesAsync();
            return Ok(_mapper.Map<AnswerDto>(existing));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await _context.Answers.FindAsync(id);
            if (item == null) return NotFound();
            _context.Answers.Remove(item);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Deleted", id });
        }
    }
}