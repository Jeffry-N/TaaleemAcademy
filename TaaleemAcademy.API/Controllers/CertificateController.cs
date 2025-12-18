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
    public class CertificateController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public CertificateController(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CertificateDto>>> GetAllCertificates()
        {
            try
            {
                var certificates = await _context.Certificates.ToListAsync();
                var certificateDtos = _mapper.Map<List<CertificateDto>>(certificates);
                return Ok(certificateDtos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving certificates", error = ex.Message });
            }
        }

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

                var certificateDto = _mapper.Map<CertificateDto>(certificate);
                return Ok(certificateDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving certificate", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<CertificateDto>> CreateCertificate(CreateCertificateDto createCertificateDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
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

        [HttpPut("{id}")]
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

        [HttpDelete("{id}")]
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
    }
}