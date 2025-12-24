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
    public class StudentAnswerController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public StudentAnswerController(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        // GET: api/StudentAnswer - Admin/Instructor only
        [HttpGet]
        [Authorize(Roles = "Admin,Instructor")]
        public async Task<ActionResult<IEnumerable<StudentAnswerDto>>> GetAllStudentAnswers()
        {
            try
            {
                var studentAnswers = await _context.StudentAnswers.ToListAsync();
                var studentAnswerDtos = _mapper.Map<List<StudentAnswerDto>>(studentAnswers);
                return Ok(studentAnswerDtos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving student answers", error = ex.Message });
            }
        }

        // GET: api/StudentAnswer/5 - Authenticated users
        [HttpGet("{id}")]
        public async Task<ActionResult<StudentAnswerDto>> GetStudentAnswerById(int id)
        {
            try
            {
                var studentAnswer = await _context.StudentAnswers.FindAsync(id);

                if (studentAnswer == null)
                {
                    return NotFound(new { message = $"Student answer with ID {id} not found" });
                }

                var studentAnswerDto = _mapper.Map<StudentAnswerDto>(studentAnswer);
                return Ok(studentAnswerDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving student answer", error = ex.Message });
            }
        }

        // POST: api/StudentAnswer - Authenticated users
        [HttpPost]
        public async Task<ActionResult<StudentAnswerDto>> CreateStudentAnswer(CreateStudentAnswerDto createStudentAnswerDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var studentAnswer = _mapper.Map<StudentAnswer>(createStudentAnswerDto);
                
                _context.StudentAnswers.Add(studentAnswer);
                await _context.SaveChangesAsync();

                var studentAnswerDto = _mapper.Map<StudentAnswerDto>(studentAnswer);
                return CreatedAtAction(nameof(GetStudentAnswerById), new { id = studentAnswer.Id }, studentAnswerDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error creating student answer", error = ex.Message });
            }
        }

        // PUT: api/StudentAnswer/5 - Authenticated users
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateStudentAnswer(int id, UpdateStudentAnswerDto updateStudentAnswerDto)
        {
            try
            {
                if (id != updateStudentAnswerDto.Id)
                {
                    return BadRequest(new { message = "ID mismatch" });
                }

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var existingStudentAnswer = await _context.StudentAnswers.FindAsync(id);
                if (existingStudentAnswer == null)
                {
                    return NotFound(new { message = $"Student answer with ID {id} not found" });
                }

                _mapper.Map(updateStudentAnswerDto, existingStudentAnswer);
                _context.Entry(existingStudentAnswer).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                var studentAnswerDto = _mapper.Map<StudentAnswerDto>(existingStudentAnswer);
                return Ok(new { message = "Student answer updated successfully", studentAnswer = studentAnswerDto });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating student answer", error = ex.Message });
            }
        }

        // DELETE: api/StudentAnswer/5 - Admin only
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteStudentAnswer(int id)
        {
            try
            {
                var studentAnswer = await _context.StudentAnswers.FindAsync(id);
                if (studentAnswer == null)
                {
                    return NotFound(new { message = $"Student answer with ID {id} not found" });
                }

                _context.StudentAnswers.Remove(studentAnswer);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Student answer deleted successfully", studentAnswerId = id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting student answer", error = ex.Message });
            }
        }
    }
}