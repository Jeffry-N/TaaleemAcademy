using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TaaleemAcademy.API.Data;
using TaaleemAcademy.API.Models;
using TaaleemAcademy.API.DTOs;

namespace TaaleemAcademy.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // All endpoints require authentication
    public class QuizAttemptController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public QuizAttemptController(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        // Helper methods
        private int GetCurrentUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        private string? GetCurrentUserRole() => User.FindFirst(ClaimTypes.Role)?.Value;

        // GET: api/QuizAttempt - Admin/Instructor see all, Students see only their own
        [HttpGet]
        public async Task<ActionResult<IEnumerable<QuizAttemptDto>>> GetAllQuizAttempts()
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();

                List<QuizAttempt> quizAttempts;

                // Admin and Instructor can see all attempts
                if (currentUserRole == "Admin" || currentUserRole == "Instructor")
                {
                    quizAttempts = await _context.QuizAttempts.ToListAsync();
                }
                else
                {
                    // Students only see their own attempts
                    quizAttempts = await _context.QuizAttempts
                        .Where(qa => qa.UserId == currentUserId)
                        .ToListAsync();
                }

                var quizAttemptDtos = _mapper.Map<List<QuizAttemptDto>>(quizAttempts);
                return Ok(quizAttemptDtos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving quiz attempts", error = ex.Message });
            }
        }

        // GET: api/QuizAttempt/5 - Admin/Instructor can view any, Students only their own
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

                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();

                // Check permissions
                if (quizAttempt.UserId != currentUserId && currentUserRole != "Admin" && currentUserRole != "Instructor")
                {
                    return StatusCode(403, new { message = "You don't have permission to view this quiz attempt" });
                }

                var quizAttemptDto = _mapper.Map<QuizAttemptDto>(quizAttempt);
                return Ok(quizAttemptDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving quiz attempt", error = ex.Message });
            }
        }

        // POST: api/QuizAttempt - Students create their own attempts
        [HttpPost]
        public async Task<ActionResult<QuizAttemptDto>> CreateQuizAttempt(CreateQuizAttemptDto createQuizAttemptDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Validate quiz exists and retake rules
                var quiz = await _context.Quizzes.FindAsync(createQuizAttemptDto.QuizId);
                if (quiz == null)
                {
                    return NotFound(new { message = "Quiz not found" });
                }

                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();

                // Students can only create their own attempts
                if (currentUserRole == "Student" && createQuizAttemptDto.UserId != currentUserId)
                {
                    return StatusCode(403, new { message = "You can only create quiz attempts for yourself" });
                }

                // Enforce retake and attempt limits
                var existingAttempts = await _context.QuizAttempts
                    .CountAsync(a => a.QuizId == createQuizAttemptDto.QuizId && a.UserId == createQuizAttemptDto.UserId);

                if (!quiz.AllowRetake && existingAttempts >= 1)
                {
                    return StatusCode(403, new { message = "Retakes are not allowed for this quiz." });
                }

                if (quiz.MaxAttempts.HasValue && existingAttempts >= quiz.MaxAttempts.Value)
                {
                    return StatusCode(403, new { message = "You have reached the maximum number of attempts for this quiz." });
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

        // PUT: api/QuizAttempt/5 - Students can update their own, Admin/Instructor can update any
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

                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();

                // Students can only update their own attempts
                if (currentUserRole == "Student" && existingQuizAttempt.UserId != currentUserId)
                {
                    return StatusCode(403, new { message = "You can only update your own quiz attempts" });
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

        // DELETE: api/QuizAttempt/5 - Only Instructor or Admin can delete quiz attempts
        [HttpDelete("{id}")]
        [Authorize(Roles = "Instructor,Admin")]
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