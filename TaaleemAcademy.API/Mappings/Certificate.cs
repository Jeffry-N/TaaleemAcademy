using AutoMapper;
using TaaleemAcademy.API.Models;
using TaaleemAcademy.API.DTOs;

namespace TaaleemAcademy.API.Mappings
{
    public class CertificateMappingProfile : Profile
    {
        public CertificateMappingProfile()
        {
            CreateMap<Certificate, CertificateDto>();
            
            CreateMap<CreateCertificateDto, Certificate>()
                .ForMember(dest => dest.GeneratedAt, opt => opt.MapFrom(src => DateTime.Now))
                .ForMember(dest => dest.Id, opt => opt.Ignore());

            CreateMap<UpdateCertificateDto, Certificate>()
                .ForMember(dest => dest.GeneratedAt, opt => opt.Ignore());
        }
    }
}