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
    public class QuizAttemptController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public QuizAttemptController(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<QuizAttemptDto>>> GetAllQuizAttempts()
        {
            try
            {
                var quizAttempts = await _context.QuizAttempts.ToListAsync();
                var quizAttemptDtos = _mapper.Map<List<QuizAttemptDto>>(quizAttempts);
                return Ok(quizAttemptDtos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving quiz attempts", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<QuizAttemptDto>> GetQuizAttemptById(int id)
        {
            try
            {
                var quizAttempt = await _context.QuizAttempts.FindAsync(id);

                if (quizAttempt == null)
                {
                    return NotFound(new { message = $"Quiz attempt with ID {id} not found" });
                }

                var quizAttemptDto = _mapper.Map<QuizAttemptDto>(quizAttempt);
                return Ok(quizAttemptDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving quiz attempt", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<QuizAttemptDto>> CreateQuizAttempt(CreateQuizAttemptDto createQuizAttemptDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var quizAttempt = _mapper.Map<QuizAttempt>(createQuizAttemptDto);
                
                _context.QuizAttempts.Add(quizAttempt);
                await _context.SaveChangesAsync();

                var quizAttemptDto = _mapper.Map<QuizAttemptDto>(quizAttempt);
                return CreatedAtAction(nameof(GetQuizAttemptById), new { id = quizAttempt.Id }, quizAttemptDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error creating quiz attempt", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateQuizAttempt(int id, UpdateQuizAttemptDto updateQuizAttemptDto)
        {
            try
            {
                if (id != updateQuizAttemptDto.Id)
                {
                    return BadRequest(new { message = "ID mismatch" });
                }

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var existingQuizAttempt = await _context.QuizAttempts.FindAsync(id);
                if (existingQuizAttempt == null)
                {
                    return NotFound(new { message = $"Quiz attempt with ID {id} not found" });
                }

                _mapper.Map(updateQuizAttemptDto, existingQuizAttempt);
                _context.Entry(existingQuizAttempt).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                var quizAttemptDto = _mapper.Map<QuizAttemptDto>(existingQuizAttempt);
                return Ok(new { message = "Quiz attempt updated successfully", quizAttempt = quizAttemptDto });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating quiz attempt", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteQuizAttempt(int id)
        {
            try
            {
                var quizAttempt = await _context.QuizAttempts.FindAsync(id);
                if (quizAttempt == null)
                {
                    return NotFound(new { message = $"Quiz attempt with ID {id} not found" });
                }

                _context.QuizAttempts.Remove(quizAttempt);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Quiz attempt deleted successfully", quizAttemptId = id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting quiz attempt", error = ex.Message });
            }
        }
    }
}