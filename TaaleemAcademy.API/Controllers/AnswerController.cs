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
    [Authorize] // Base: all endpoints require authentication
    public class AnswerController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        public AnswerController(ApplicationDbContext context, IMapper mapper) 
        { 
            _context = context; 
            _mapper = mapper; 
        }

        // GET: api/Answer - Only Admin or Instructor can view all answers
        [HttpGet]
        [Authorize(Roles = "Admin,Instructor")]
        public async Task<ActionResult<IEnumerable<AnswerDto>>> GetAll() 
            => Ok(_mapper.Map<List<AnswerDto>>(await _context.Answers.ToListAsync()));

        // GET: api/Answer/5 - Admin, Instructor, or the student who submitted it
        [HttpGet("{id}")]
        public async Task<ActionResult<AnswerDto>> GetById(int id)
        {
            var item = await _context.Answers.FindAsync(id);
            if (item == null) return NotFound();
            
            // TODO: Add logic to check if current user owns this answer
            // For now, any authenticated user can view
            return Ok(_mapper.Map<AnswerDto>(item));
        }

        // POST: api/Answer - Students can submit answers
        [HttpPost]
        public async Task<ActionResult<AnswerDto>> Create(CreateAnswerDto dto)
        {
            // TODO: Verify the student is enrolled in the course
            // TODO: Set the UserId from the JWT token
            
            var item = _mapper.Map<Answer>(dto);
            _context.Answers.Add(item);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = item.Id }, _mapper.Map<AnswerDto>(item));
        }

        // PUT: api/Answer/5 - Only Admin or Instructor can update answers
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Instructor")]
        public async Task<IActionResult> Update(int id, UpdateAnswerDto dto)
        {
            if (id != dto.Id) return BadRequest();
            var existing = await _context.Answers.FindAsync(id);
            if (existing == null) return NotFound();
            _mapper.Map(dto, existing);
            await _context.SaveChangesAsync();
            return Ok(_mapper.Map<AnswerDto>(existing));
        }

        // DELETE: api/Answer/5 - Only Admin
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
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