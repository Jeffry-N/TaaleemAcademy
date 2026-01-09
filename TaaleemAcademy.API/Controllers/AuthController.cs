using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaaleemAcademy.API.DTOs;
using TaaleemAcademy.API.Services;

namespace TaaleemAcademy.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        // POST: api/Auth/register
        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<ActionResult<AuthResponseDto>> Register(RegisterDto registerDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var result = await _authService.RegisterAsync(registerDto);

                if (result == null)
                {
                    return Conflict(new { message = "Email already exists" });
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error during registration", error = ex.Message });
            }
        }

        // POST: api/Auth/login
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<ActionResult<AuthResponseDto>> Login(LoginDto loginDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var result = await _authService.LoginAsync(loginDto);

                if (result == null)
                {
                    return Unauthorized(new { message = "Invalid email or password" });
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error during login", error = ex.Message });
            }
        }

        // POST: api/Auth/refresh
        [HttpPost("refresh")]
        [AllowAnonymous]
        public async Task<ActionResult<AuthResponseDto>> RefreshToken(RefreshTokenDto refreshTokenDto)
        {
            try
            {
                var result = await _authService.RefreshTokenAsync(refreshTokenDto.RefreshToken);

                if (result == null)
                {
                    return Unauthorized(new { message = "Invalid or expired refresh token" });
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error refreshing token", error = ex.Message });
            }
        }

        // POST: api/Auth/revoke
        [HttpPost("revoke")]
        [Authorize]
        public async Task<IActionResult> RevokeToken(RefreshTokenDto refreshTokenDto)
        {
            try
            {
                var result = await _authService.RevokeTokenAsync(refreshTokenDto.RefreshToken);

                if (!result)
                {
                    return NotFound(new { message = "Token not found" });
                }

                return Ok(new { message = "Token revoked successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error revoking token", error = ex.Message });
            }
        }

        // POST: api/Auth/forgot-password
        [HttpPost("forgot-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto forgotPasswordDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var result = await _authService.RequestPasswordResetAsync(forgotPasswordDto.Email);

                if (!result)
                {
                    return NotFound(new { message = "User not found" });
                }

                return Ok(new { message = "Password reset link has been sent to your email" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error processing request", error = ex.Message });
            }
        }

        // POST: api/Auth/reset-password
        [HttpPost("reset-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto resetPasswordDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var result = await _authService.ResetPasswordAsync(resetPasswordDto.Email, resetPasswordDto.Token, resetPasswordDto.NewPassword);

                if (!result)
                {
                    return BadRequest(new { message = "Invalid or expired reset token" });
                }

                return Ok(new { message = "Password reset successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error resetting password", error = ex.Message });
            }
        }
    }
}