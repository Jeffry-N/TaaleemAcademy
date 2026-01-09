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
    public class EnrollmentController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public EnrollmentController(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        // Helper methods
        private int GetCurrentUserId()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(idClaim, out var id) ? id : 0;
        }

        private string? GetCurrentUserRole()
        {
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            return string.IsNullOrWhiteSpace(role) ? null : role.Trim();
        }

        private bool IsAdminOrInstructor()
        {
            var role = GetCurrentUserRole();
            return role != null && (role.Equals("Admin", StringComparison.OrdinalIgnoreCase) || role.Equals("Instructor", StringComparison.OrdinalIgnoreCase));
        }

        // GET: api/Enrollment - Admin/Instructor see all, Students see only their own
        [HttpGet]
        public async Task<ActionResult<IEnumerable<EnrollmentDto>>> GetAllEnrollments()
        {
            try
            {
                var currentUserId = GetCurrentUserId();

                List<Enrollment> enrollments;

                // Admin and Instructor can see all enrollments
                if (IsAdminOrInstructor())
                {
                    enrollments = await _context.Enrollments.ToListAsync();
                }
                else
                {
                    // Students only see their own enrollments
                    enrollments = await _context.Enrollments
                        .Where(e => e.UserId == currentUserId)
                        .ToListAsync();
                }

                var enrollmentDtos = _mapper.Map<List<EnrollmentDto>>(enrollments);
                return Ok(enrollmentDtos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving enrollments", error = ex.Message });
            }
        }

        // GET: api/Enrollment/5 - Admin/Instructor can view any, Students only their own
        [HttpGet("{id}")]
        public async Task<ActionResult<EnrollmentDto>> GetEnrollmentById(int id)
        {
            try
            {
                var enrollment = await _context.Enrollments.FindAsync(id);
                if (enrollment == null)
                {
                    return NotFound(new { message = $"Enrollment with ID {id} not found" });
                }

                // Check permissions
                var currentUserId = GetCurrentUserId();

                if (enrollment.UserId != currentUserId && !IsAdminOrInstructor())
                {
                    return StatusCode(403, new { message = "You don't have permission to view this enrollment" });
                }

                var enrollmentDto = _mapper.Map<EnrollmentDto>(enrollment);
                return Ok(enrollmentDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving enrollment", error = ex.Message });
            }
        }

        // POST: api/Enrollment - Students can enroll themselves, Admin can enroll anyone
        [HttpPost]
        public async Task<ActionResult<EnrollmentDto>> CreateEnrollment(CreateEnrollmentDto createEnrollmentDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();

                // Students can only enroll themselves
                if (currentUserRole != null && currentUserRole.Equals("Student", StringComparison.OrdinalIgnoreCase) && createEnrollmentDto.UserId != currentUserId)
                {
                    return StatusCode(403, new { message = "You can only enroll yourself" });
                }

                // Check if already enrolled
                var existing = await _context.Enrollments
                    .FirstOrDefaultAsync(e => e.UserId == createEnrollmentDto.UserId && e.CourseId == createEnrollmentDto.CourseId);
                
                if (existing != null)
                {
                    return Conflict(new { message = "User already enrolled in this course" });
                }

                var enrollment = _mapper.Map<Enrollment>(createEnrollmentDto);
                _context.Enrollments.Add(enrollment);
                await _context.SaveChangesAsync();

                var enrollmentDto = _mapper.Map<EnrollmentDto>(enrollment);
                return CreatedAtAction(nameof(GetEnrollmentById), new { id = enrollment.Id }, enrollmentDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error creating enrollment", error = ex.Message });
            }
        }

        // PUT: api/Enrollment/5 - Only Admin or Instructor can update enrollments
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Instructor")]
        public async Task<IActionResult> UpdateEnrollment(int id, UpdateEnrollmentDto updateEnrollmentDto)
        {
            try
            {
                if (id != updateEnrollmentDto.Id)
                {
                    return BadRequest(new { message = "ID mismatch" });
                }

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var existingEnrollment = await _context.Enrollments.FindAsync(id);
                if (existingEnrollment == null)
                {
                    return NotFound(new { message = $"Enrollment with ID {id} not found" });
                }

                _mapper.Map(updateEnrollmentDto, existingEnrollment);
                _context.Entry(existingEnrollment).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                var enrollmentDto = _mapper.Map<EnrollmentDto>(existingEnrollment);
                return Ok(new { message = "Enrollment updated successfully", enrollment = enrollmentDto });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating enrollment", error = ex.Message });
            }
        }

        // DELETE: api/Enrollment/5 - Students can unenroll themselves, Admin/Instructor can delete any
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEnrollment(int id)
        {
            try
            {
                var enrollment = await _context.Enrollments.FindAsync(id);
                if (enrollment == null)
                {
                    return NotFound(new { message = $"Enrollment with ID {id} not found" });
                }

                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();

                // Students can only delete their own enrollments
                // Admin and Instructor can delete any enrollment
                if (currentUserRole == "Student" && enrollment.UserId != currentUserId)
                {
                    return StatusCode(403, new { message = "You can only unenroll yourself" });
                }

                _context.Enrollments.Remove(enrollment);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Enrollment deleted successfully", enrollmentId = id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting enrollment", error = ex.Message });
            }
        }
    }
}