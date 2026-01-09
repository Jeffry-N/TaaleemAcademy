using TaaleemAcademy.API.DTOs;
using TaaleemAcademy.API.Models;

namespace TaaleemAcademy.API.Services
{
    public interface IAuthService
    {
        Task<AuthResponseDto?> RegisterAsync(RegisterDto registerDto);
        Task<AuthResponseDto?> LoginAsync(LoginDto loginDto);
        Task<AuthResponseDto?> RefreshTokenAsync(string refreshToken);
        Task<bool> RevokeTokenAsync(string refreshToken);
        Task<bool> RequestPasswordResetAsync(string email);
        Task<bool> ResetPasswordAsync(string email, string token, string newPassword);
        string GenerateJwtToken(User user);
        string GenerateRefreshToken();
    }
}