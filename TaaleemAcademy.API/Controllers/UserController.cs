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
    public class UserController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public UserController(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        // Helper methods
        private int GetCurrentUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        private string? GetCurrentUserRole() => User.FindFirst(ClaimTypes.Role)?.Value;

        // GET: api/User - Admin and Instructor can view all users
        [HttpGet]
        [Authorize(Roles = "Admin,Instructor")]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetAllUsers()
        {
            try
            {
                var users = await _context.Users.ToListAsync();
                var userDtos = _mapper.Map<List<UserDto>>(users);
                return Ok(userDtos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving users", error = ex.Message });
            }
        }

        // GET: api/User/by-email?email=... - Admin and Instructor can lookup users by email
        [HttpGet("by-email")]
        [Authorize(Roles = "Admin,Instructor")]
        public async Task<ActionResult<UserDto>> GetUserByEmail([FromQuery] string email)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(email))
                {
                    return BadRequest(new { message = "Email is required" });
                }

                var normalized = email.Trim().ToLower();
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalized);
                if (user == null)
                {
                    return NotFound(new { message = "User not found with that email" });
                }

                var userDto = _mapper.Map<UserDto>(user);
                return Ok(userDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving user by email", error = ex.Message });
            }
        }

        // GET: api/User/5 - Users can view their own profile OR Admin can view any
        [HttpGet("{id}")]
        public async Task<ActionResult<UserDto>> GetUserById(int id)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();

                // Check permissions
                if (currentUserId != id && currentUserRole != "Admin")
                {
                    return StatusCode(403, new { message = "You don't have permission to view this user" });
                }

                var user = await _context.Users.FindAsync(id);
                if (user == null)
                {
                    return NotFound(new { message = $"User with ID {id} not found" });
                }

                var userDto = _mapper.Map<UserDto>(user);
                return Ok(userDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving user", error = ex.Message });
            }
        }

        // PUT: api/User/5 - Users can update themselves OR Admin can update any
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, UpdateUserDto updateUserDto)
        {
            try
            {
                if (id != updateUserDto.Id)
                {
                    return BadRequest(new { message = "ID mismatch" });
                }

                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();

                if (currentUserId != id && currentUserRole != "Admin")
                {
                    return StatusCode(403, new { message = "You don't have permission to update this user" });
                }

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var existingUser = await _context.Users.FindAsync(id);
                if (existingUser == null)
                {
                    return NotFound(new { message = $"User with ID {id} not found" });
                }

                // Update only the allowed fields
                existingUser.FullName = updateUserDto.FullName;
                existingUser.Email = updateUserDto.Email;
                existingUser.Role = updateUserDto.Role;
                existingUser.IsActive = updateUserDto.IsActive;
                existingUser.UpdatedAt = DateTime.Now;

                // Only update password if provided
                if (!string.IsNullOrEmpty(updateUserDto.Password))
                {
                    existingUser.HashedPassword = BCrypt.Net.BCrypt.HashPassword(updateUserDto.Password);
                }

                _context.Entry(existingUser).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                var userDto = _mapper.Map<UserDto>(existingUser);
                return Ok(new { message = "User updated successfully", user = userDto });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating user", error = ex.Message });
            }
        }

        // DELETE: api/User/5 - Only Admin
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            try
            {
                var user = await _context.Users.FindAsync(id);
                if (user == null)
                {
                    return NotFound(new { message = $"User with ID {id} not found" });
                }

                _context.Users.Remove(user);
                await _context.SaveChangesAsync();

                return Ok(new { message = "User deleted successfully", userId = id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting user", error = ex.Message });
            }
        }
    }
}