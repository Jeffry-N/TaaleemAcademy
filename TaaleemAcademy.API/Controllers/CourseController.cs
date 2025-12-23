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
    public class CourseController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public CourseController(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        // GET: api/Course - Public (anyone can view published courses)
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<CourseDto>>> GetAllCourses()
        {
            try
            {
                var courses = await _context.Courses.ToListAsync();
                var courseDtos = _mapper.Map<List<CourseDto>>(courses);
                return Ok(courseDtos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving courses", error = ex.Message });
            }
        }

        // GET: api/Course/5 - Public
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<CourseDto>> GetCourseById(int id)
        {
            try
            {
                var course = await _context.Courses.FindAsync(id);
                if (course == null)
                {
                    return NotFound(new { message = $"Course with ID {id} not found" });
                }

                var courseDto = _mapper.Map<CourseDto>(course);
                return Ok(courseDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving course", error = ex.Message });
            }
        }

        // POST: api/Course - Instructor or Admin
        [HttpPost]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<ActionResult<CourseDto>> CreateCourse(CreateCourseDto createCourseDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var course = _mapper.Map<Course>(createCourseDto);
                _context.Courses.Add(course);
                await _context.SaveChangesAsync();

                var courseDto = _mapper.Map<CourseDto>(course);
                return CreatedAtAction(nameof(GetCourseById), new { id = course.Id }, courseDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error creating course", error = ex.Message });
            }
        }

        // PUT: api/Course/5 - Instructor or Admin
        [HttpPut("{id}")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> UpdateCourse(int id, UpdateCourseDto updateCourseDto)
        {
            try
            {
                if (id != updateCourseDto.Id)
                {
                    return BadRequest(new { message = "ID mismatch" });
                }

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var existingCourse = await _context.Courses.FindAsync(id);
                if (existingCourse == null)
                {
                    return NotFound(new { message = $"Course with ID {id} not found" });
                }

                _mapper.Map(updateCourseDto, existingCourse);
                _context.Entry(existingCourse).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                var courseDto = _mapper.Map<CourseDto>(existingCourse);
                return Ok(new { message = "Course updated successfully", course = courseDto });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating course", error = ex.Message });
            }
        }

        // DELETE: api/Course/5 - Only Admin
        [HttpDelete("{id}")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> DeleteCourse(int id)
        {
            try
            {
                var course = await _context.Courses.FindAsync(id);
                if (course == null)
                {
                    return NotFound(new { message = $"Course with ID {id} not found" });
                }

                _context.Courses.Remove(course);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Course deleted successfully", courseId = id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting course", error = ex.Message });
            }
        }
    }
}