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
    public class CourseController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public CourseController(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        // Helper method to get current user ID and role
        private int GetCurrentUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        private string? GetCurrentUserRole() => User.FindFirst(ClaimTypes.Role)?.Value;

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

                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();

                var course = _mapper.Map<Course>(createCourseDto);

                // If Instructor is creating, auto-assign to themselves
                if (currentUserRole == "Instructor")
                {
                    course.CreatedBy = currentUserId;
                }
                else if (currentUserRole == "Admin")
                {
                    int instructorId = 0;

                    // Check if InstructorEmail is provided
                    if (!string.IsNullOrEmpty(createCourseDto.InstructorEmail))
                    {
                        var instructor = await _context.Users.FirstOrDefaultAsync(u => u.Email == createCourseDto.InstructorEmail && u.Role == "Instructor");
                        if (instructor == null)
                        {
                            return BadRequest(new { message = $"No Instructor found with email '{createCourseDto.InstructorEmail}'" });
                        }
                        instructorId = instructor.Id;
                    }
                    // Otherwise check if CreatedBy ID is provided
                    else if (createCourseDto.CreatedBy > 0)
                    {
                        var instructor = await _context.Users.FirstOrDefaultAsync(u => u.Id == createCourseDto.CreatedBy && u.Role == "Instructor");
                        if (instructor == null)
                        {
                            return BadRequest(new { message = $"User with ID {createCourseDto.CreatedBy} is not a valid Instructor" });
                        }
                        instructorId = createCourseDto.CreatedBy;
                    }
                    else
                    {
                        return BadRequest(new { message = "Admin must specify either InstructorEmail or CreatedBy (Instructor ID)" });
                    }

                    course.CreatedBy = instructorId;
                }

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

        // PUT: api/Course/5 - Instructor (only their own) or Admin
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

                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();

                // STRICT permission check: Instructors can ONLY edit their own courses
                if (currentUserRole == "Instructor")
                {
                    if (existingCourse.CreatedBy != currentUserId)
                    {
                        return StatusCode(403, new { message = "You can only edit courses you created. This course was created by another instructor." });
                    }
                    
                    // Instructors cannot change the instructor assignment
                    if (updateCourseDto.CreatedBy != existingCourse.CreatedBy)
                    {
                        return StatusCode(403, new { message = "You cannot change the course instructor assignment" });
                    }
                }
                else if (currentUserRole == "Admin")
                {
                    // Admins can edit any course, but if changing instructor, validate it's a real instructor
                    if (updateCourseDto.CreatedBy != existingCourse.CreatedBy)
                    {
                        var newInstructor = await _context.Users.FirstOrDefaultAsync(u => u.Id == updateCourseDto.CreatedBy && u.Role == "Instructor");
                        if (newInstructor == null)
                        {
                            return BadRequest(new { message = $"User with ID {updateCourseDto.CreatedBy} is not a valid Instructor" });
                        }
                    }
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

        // DELETE: api/Course/5 - Admin can unpublish any; Instructor can unpublish own
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
                var currentUserRole = GetCurrentUserRole();
                var currentUserId = GetCurrentUserId();

                if (currentUserRole == "Instructor" && course.CreatedBy != currentUserId)
                {
                    return StatusCode(403, new { message = "You can only unpublish courses you created" });
                }

                // Soft delete behavior: mark as unpublished instead of removing
                if (course.IsPublished)
                {
                    course.IsPublished = false;
                    course.UpdatedAt = DateTime.Now;
                    _context.Entry(course).State = EntityState.Modified;
                    await _context.SaveChangesAsync();
                }

                var courseDto = _mapper.Map<CourseDto>(course);
                return Ok(new { message = "Course unpublished successfully", course = courseDto });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting course", error = ex.Message });
            }
        }

        // POST: api/Course/{id}/publish - Admin can publish any; Instructor can publish own
        [HttpPost("{id}/publish")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> PublishCourse(int id)
        {
            try
            {
                var course = await _context.Courses.FindAsync(id);
                if (course == null)
                {
                    return NotFound(new { message = $"Course with ID {id} not found" });
                }

                var currentUserRole = GetCurrentUserRole();
                var currentUserId = GetCurrentUserId();

                if (currentUserRole == "Instructor" && course.CreatedBy != currentUserId)
                {
                    return StatusCode(403, new { message = "You can only publish courses you created" });
                }

                if (!course.IsPublished)
                {
                    course.IsPublished = true;
                    course.UpdatedAt = DateTime.Now;
                    _context.Entry(course).State = EntityState.Modified;
                    await _context.SaveChangesAsync();
                }

                var courseDto = _mapper.Map<CourseDto>(course);
                return Ok(new { message = "Course published successfully", course = courseDto });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error publishing course", error = ex.Message });
            }
        }
    }
}