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
    public class EnrollmentController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public EnrollmentController(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<EnrollmentDto>>> GetAllEnrollments()
        {
            try
            {
                var enrollments = await _context.Enrollments.ToListAsync();
                var enrollmentDtos = _mapper.Map<List<EnrollmentDto>>(enrollments);
                return Ok(enrollmentDtos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving enrollments", error = ex.Message });
            }
        }

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
                var enrollmentDto = _mapper.Map<EnrollmentDto>(enrollment);
                return Ok(enrollmentDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving enrollment", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<EnrollmentDto>> CreateEnrollment(CreateEnrollmentDto createEnrollmentDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
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

        [HttpPut("{id}")]
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