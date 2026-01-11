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
    public class LessonCompletionController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public LessonCompletionController(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        // Helper methods
        private int GetCurrentUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        private string? GetCurrentUserRole() => User.FindFirst(ClaimTypes.Role)?.Value;

        // GET: api/LessonCompletion - Admin/Instructor see all, Students see only their own
        [HttpGet]
        public async Task<ActionResult<IEnumerable<LessonCompletionDto>>> GetAll()
        {
            var currentUserId = GetCurrentUserId();
            var currentUserRole = GetCurrentUserRole();

            List<LessonCompletion> items;

            // Admin and Instructor can see all completions
            if (currentUserRole == "Admin" || currentUserRole == "Instructor")
            {
                items = await _context.LessonCompletions.ToListAsync();
            }
            else
            {
                // Students only see their own completions
                items = await _context.LessonCompletions
                    .Where(lc => lc.UserId == currentUserId)
                    .ToListAsync();
            }

            return Ok(_mapper.Map<List<LessonCompletionDto>>(items));
        }

        // GET: api/LessonCompletion/5 - Admin/Instructor can view any, Students only their own
        [HttpGet("{id}")]
        public async Task<ActionResult<LessonCompletionDto>> GetById(int id)
        {
            var item = await _context.LessonCompletions.FindAsync(id);
            if (item == null) return NotFound();

            var currentUserId = GetCurrentUserId();
            var currentUserRole = GetCurrentUserRole();

            // Check permissions
            if (item.UserId != currentUserId && currentUserRole != "Admin" && currentUserRole != "Instructor")
            {
                return StatusCode(403, new { message = "You don't have permission to view this completion" });
            }

            return Ok(_mapper.Map<LessonCompletionDto>(item));
        }

        // POST: api/LessonCompletion - Students mark their own lessons complete
        [HttpPost]
        public async Task<ActionResult<LessonCompletionDto>> Create(CreateLessonCompletionDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var currentUserId = GetCurrentUserId();
            var currentUserRole = GetCurrentUserRole();

            // Students can only mark their own lessons as complete
            if (currentUserRole == "Student" && dto.UserId != currentUserId)
            {
                return StatusCode(403, new { message = "You can only mark your own lessons as complete" });
            }

            // Check if already completed
            var existing = await _context.LessonCompletions
                .FirstOrDefaultAsync(lc => lc.LessonId == dto.LessonId && lc.UserId == dto.UserId);
            if (existing != null) return Conflict(new { message = "Lesson already completed" });

            var item = _mapper.Map<LessonCompletion>(dto);
            _context.LessonCompletions.Add(item);
            await _context.SaveChangesAsync();

            // AUTO-CERTIFICATE: Check if user has completed all lessons for this course
            var lesson = await _context.Lessons.FindAsync(dto.LessonId);
            if (lesson != null)
            {
                var courseId = lesson.CourseId;
                var totalLessons = await _context.Lessons.CountAsync(l => l.CourseId == courseId);
                var completedLessons = await _context.LessonCompletions
                    .Join(_context.Lessons,
                        lc => lc.LessonId,
                        l => l.Id,
                        (lc, l) => new { lc, l })
                    .Where(x => x.l.CourseId == courseId && x.lc.UserId == dto.UserId)
                    .CountAsync();

                // If all lessons completed, and all quizzes passed, auto-issue certificate
                if (completedLessons >= totalLessons && totalLessons > 0)
                {
                    // Require passing all course quizzes
                    var quizIds = await _context.Quizzes
                        .Where(q => q.CourseId == courseId)
                        .Select(q => q.Id)
                        .ToListAsync();

                    if (quizIds.Any())
                    {
                        var passedQuizCount = await _context.QuizAttempts
                            .Where(a => a.UserId == dto.UserId && a.IsPassed && quizIds.Contains(a.QuizId))
                            .Select(a => a.QuizId)
                            .Distinct()
                            .CountAsync();

                        if (passedQuizCount < quizIds.Count)
                        {
                            return CreatedAtAction(nameof(GetById), new { id = item.Id }, _mapper.Map<LessonCompletionDto>(item));
                        }
                    }

                    // Check if certificate doesn't already exist
                    var existingCert = await _context.Certificates
                        .FirstOrDefaultAsync(c => c.UserId == dto.UserId && c.CourseId == courseId);

                    if (existingCert == null)
                    {
                        // Generate unique certificate code
                        var certCode = $"CERT-{Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper()}";
                        
                        var certificate = new Certificate
                        {
                            UserId = dto.UserId,
                            CourseId = courseId,
                            CertificateCode = certCode,
                            IssuedBy = dto.UserId, // Self-issued on completion
                            GeneratedAt = DateTime.Now
                        };

                        _context.Certificates.Add(certificate);
                        await _context.SaveChangesAsync();

                        // Update enrollment to mark as completed
                        var enrollment = await _context.Enrollments
                            .FirstOrDefaultAsync(e => e.UserId == dto.UserId && e.CourseId == courseId);
                        if (enrollment != null)
                        {
                            enrollment.IsCompleted = true;
                            enrollment.CompletedAt = DateTime.Now;
                            await _context.SaveChangesAsync();
                        }
                    }
                }
            }

            return CreatedAtAction(nameof(GetById), new { id = item.Id }, _mapper.Map<LessonCompletionDto>(item));
        }

        // PUT: api/LessonCompletion/5 - Only Admin or Instructor can update completion records
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Instructor")]
        public async Task<IActionResult> Update(int id, UpdateLessonCompletionDto dto)
        {
            if (id != dto.Id) return BadRequest();
            var existing = await _context.LessonCompletions.FindAsync(id);
            if (existing == null) return NotFound();
            _mapper.Map(dto, existing);
            await _context.SaveChangesAsync();
            return Ok(_mapper.Map<LessonCompletionDto>(existing));
        }

        // DELETE: api/LessonCompletion/5 - Students can delete their own, Admin/Instructor can delete any
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await _context.LessonCompletions.FindAsync(id);
            if (item == null) return NotFound();

            var currentUserId = GetCurrentUserId();
            var currentUserRole = GetCurrentUserRole();

            // Students can only delete their own completions
            if (currentUserRole == "Student" && item.UserId != currentUserId)
            {
                return StatusCode(403, new { message = "You can only delete your own completion records" });
            }

            _context.LessonCompletions.Remove(item);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Deleted", id });
        }
    }
}