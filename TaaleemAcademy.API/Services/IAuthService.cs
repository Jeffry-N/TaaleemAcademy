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
        string GenerateJwtToken(User user);
        string GenerateRefreshToken();
    }
}