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
    public class CertificateController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public CertificateController(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        // Helper methods
        private int GetCurrentUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        private string? GetCurrentUserRole() => User.FindFirst(ClaimTypes.Role)?.Value;

        // GET: api/Certificate - Admin/Instructor see all, Students see only their own
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CertificateDto>>> GetAllCertificates()
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();

                List<Certificate> certificates;

                // Admin and Instructor can see all certificates
                if (currentUserRole == "Admin" || currentUserRole == "Instructor")
                {
                    certificates = await _context.Certificates.ToListAsync();
                }
                else
                {
                    // Students only see their own certificates
                    certificates = await _context.Certificates
                        .Where(c => c.UserId == currentUserId)
                        .ToListAsync();
                }

                var certificateDtos = _mapper.Map<List<CertificateDto>>(certificates);
                return Ok(certificateDtos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving certificates", error = ex.Message });
            }
        }

        // GET: api/Certificate/5 - Admin/Instructor can view any, Students only their own
        [HttpGet("{id}")]
        public async Task<ActionResult<CertificateDto>> GetCertificateById(int id)
        {
            try
            {
                var certificate = await _context.Certificates.FindAsync(id);

                if (certificate == null)
                {
                    return NotFound(new { message = $"Certificate with ID {id} not found" });
                }

                // Check permissions
                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();

                if (certificate.UserId != currentUserId && currentUserRole != "Admin" && currentUserRole != "Instructor")
                {
                    return StatusCode(403, new { message = "You don't have permission to view this certificate" });
                }

                var certificateDto = _mapper.Map<CertificateDto>(certificate);
                return Ok(certificateDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving certificate", error = ex.Message });
            }
        }

        // POST: api/Certificate - Admin/Instructor can issue to anyone. Students can issue to themselves if course is 100% completed.
        [HttpPost]
        public async Task<ActionResult<CertificateDto>> CreateCertificate(CreateCertificateDto createCertificateDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();

                // Allow Students to issue only for themselves after full completion
                if (currentUserRole == "Student")
                {
                    if (createCertificateDto.UserId != currentUserId)
                    {
                        return StatusCode(403, new { message = "You can only issue certificates for yourself" });
                    }

                    // Check course completion: all lessons for the course are completed by the student
                    var totalLessons = await _context.Lessons.CountAsync(l => l.CourseId == createCertificateDto.CourseId);
                    if (totalLessons > 0)
                    {
                        var completedLessons = await _context.LessonCompletions
                            .Join(_context.Lessons,
                                lc => lc.LessonId,
                                l => l.Id,
                                (lc, l) => new { lc, l })
                            .Where(x => x.l.CourseId == createCertificateDto.CourseId && x.lc.UserId == currentUserId)
                            .CountAsync();

                        if (completedLessons < totalLessons)
                        {
                            return StatusCode(403, new { message = "Course not fully completed. Finish all lessons to generate a certificate." });
                        }
                    }

                    // Check quizzes: all course quizzes must be passed
                    var quizIds = await _context.Quizzes
                        .Where(q => q.CourseId == createCertificateDto.CourseId)
                        .Select(q => q.Id)
                        .ToListAsync();

                    if (quizIds.Any())
                    {
                        var passedQuizCount = await _context.QuizAttempts
                            .Where(a => a.UserId == currentUserId && a.IsPassed && quizIds.Contains(a.QuizId))
                            .Select(a => a.QuizId)
                            .Distinct()
                            .CountAsync();

                        if (passedQuizCount < quizIds.Count)
                        {
                            return StatusCode(403, new { message = "You must pass all quizzes for this course before generating a certificate." });
                        }

                        // Check overall score: average of all quiz attempts must be >= 50
                        var quizAttempts = await _context.QuizAttempts
                            .Where(a => a.UserId == currentUserId && quizIds.Contains(a.QuizId))
                            .ToListAsync();

                        if (quizAttempts.Any())
                        {
                            var averageScore = quizAttempts.Average(a => a.Score);
                            if (averageScore < 50)
                            {
                                return StatusCode(403, new { message = $"Your overall quiz score is {Math.Round(averageScore, 1)}%. You need a minimum of 50% overall to generate a certificate." });
                            }
                        }
                    }

                    // Force issuer to the current user
                    createCertificateDto.IssuedBy = currentUserId;
                }
                else
                {
                    // Admin/Instructor: issue on behalf; issuer is the current user
                    createCertificateDto.IssuedBy = currentUserId;
                }

                // Check if certificate already exists for this user and course
                var existingCertificate = await _context.Certificates
                    .FirstOrDefaultAsync(c => c.UserId == createCertificateDto.UserId && c.CourseId == createCertificateDto.CourseId);
                
                if (existingCertificate != null)
                {
                    return Conflict(new { message = "Certificate already exists for this user and course" });
                }

                // Check if certificate code is unique
                var duplicateCode = await _context.Certificates
                    .FirstOrDefaultAsync(c => c.CertificateCode == createCertificateDto.CertificateCode);
                
                if (duplicateCode != null)
                {
                    return Conflict(new { message = "Certificate code already exists" });
                }

                var certificate = _mapper.Map<Certificate>(createCertificateDto);
                
                _context.Certificates.Add(certificate);
                await _context.SaveChangesAsync();

                var certificateDto = _mapper.Map<CertificateDto>(certificate);
                return CreatedAtAction(nameof(GetCertificateById), new { id = certificate.Id }, certificateDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error creating certificate", error = ex.Message });
            }
        }

        // PUT: api/Certificate/5 - Only Admin or Instructor can update
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Instructor")]
        public async Task<IActionResult> UpdateCertificate(int id, UpdateCertificateDto updateCertificateDto)
        {
            try
            {
                if (id != updateCertificateDto.Id)
                {
                    return BadRequest(new { message = "ID mismatch" });
                }

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var existingCertificate = await _context.Certificates.FindAsync(id);
                if (existingCertificate == null)
                {
                    return NotFound(new { message = $"Certificate with ID {id} not found" });
                }

                _mapper.Map(updateCertificateDto, existingCertificate);
                _context.Entry(existingCertificate).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                var certificateDto = _mapper.Map<CertificateDto>(existingCertificate);
                return Ok(new { message = "Certificate updated successfully", certificate = certificateDto });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating certificate", error = ex.Message });
            }
        }

        // DELETE: api/Certificate/5 - Only Admin
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCertificate(int id)
        {
            try
            {
                var certificate = await _context.Certificates.FindAsync(id);
                if (certificate == null)
                {
                    return NotFound(new { message = $"Certificate with ID {id} not found" });
                }

                _context.Certificates.Remove(certificate);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Certificate deleted successfully", certificateId = id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting certificate", error = ex.Message });
            }
        }

        // GET: api/Certificate/5/download - Download certificate as PDF
        [HttpGet("{id}/download")]
        public async Task<IActionResult> DownloadCertificatePdf(int id)
        {
            try
            {
                var certificate = await _context.Certificates.FindAsync(id);
                if (certificate == null)
                {
                    return NotFound(new { message = $"Certificate with ID {id} not found" });
                }

                // Check permissions
                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();

                if (certificate.UserId != currentUserId && currentUserRole != "Admin" && currentUserRole != "Instructor")
                {
                    return StatusCode(403, new { message = "You don't have permission to download this certificate" });
                }

                // Get user and course details
                var user = await _context.Users.FindAsync(certificate.UserId);
                var course = await _context.Courses.FindAsync(certificate.CourseId);

                if (user == null || course == null)
                {
                    return NotFound(new { message = "User or course not found" });
                }

                // Generate simple HTML-based certificate (can be converted to PDF by frontend)
                var html = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <title>Certificate - {certificate.CertificateCode}</title>
    <style>
        @page {{ size: A4 landscape; margin: 0; }}
        body {{ 
            margin: 0; 
            padding: 50px; 
            font-family: 'Georgia', serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }}
        .certificate {{
            background: white;
            padding: 80px;
            max-width: 900px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            border: 15px solid #1e40af;
            text-align: center;
        }}
        .header {{ font-size: 42px; color: #1e40af; font-weight: bold; margin-bottom: 40px; letter-spacing: 3px; }}
        .subtitle {{ font-size: 18px; color: #6b7280; margin: 20px 0; }}
        .name {{ font-size: 48px; color: #111827; font-weight: bold; margin: 30px 0; font-style: italic; }}
        .course {{ font-size: 32px; color: #1e40af; font-weight: bold; margin: 30px 0; }}
        .details {{ font-size: 14px; color: #9ca3af; margin-top: 50px; }}
        .signatures {{ display: flex; justify-content: space-around; margin-top: 60px; }}
        .signature {{ text-align: center; }}
        .signature-line {{ border-top: 2px solid #d1d5db; width: 200px; margin: 0 auto 10px; }}
        .signature-text {{ font-size: 12px; color: #6b7280; }}
    </style>
</head>
<body>
    <div class='certificate'>
        <div class='header'>CERTIFICATE OF COMPLETION</div>
        <div class='subtitle'>This is to certify that</div>
        <div class='name'>{user.FullName}</div>
        <div class='subtitle'>has successfully completed</div>
        <div class='course'>{course.Title}</div>
        <div class='details'>
            Certificate ID: {certificate.CertificateCode}<br>
            Issued on: {certificate.GeneratedAt:MMMM dd, yyyy}
        </div>
        <div class='signatures'>
            <div class='signature'>
                <div class='signature-line'></div>
                <div class='signature-text'>Authorized Signature</div>
            </div>
            <div class='signature'>
                <div class='signature-line'></div>
                <div class='signature-text'>Taaleem Academy</div>
            </div>
        </div>
    </div>
</body>
</html>";

                return Content(html, "text/html");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error generating certificate", error = ex.Message });
            }
        }
    }
}