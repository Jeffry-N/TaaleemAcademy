using AutoMapper;
using TaaleemAcademy.API.Models;
using TaaleemAcademy.API.DTOs;

namespace TaaleemAcademy.API.Mappings
{
    public class EnrollmentMappingProfile : Profile
    {
        public EnrollmentMappingProfile()
        {
            CreateMap<Enrollment, EnrollmentDto>();
            
            CreateMap<CreateEnrollmentDto, Enrollment>()
                .ForMember(dest => dest.EnrolledAt, opt => opt.MapFrom(src => DateTime.Now))
                .ForMember(dest => dest.CompletionPercentage, opt => opt.MapFrom(src => 0.00M))
                .ForMember(dest => dest.IsCompleted, opt => opt.MapFrom(src => false))
                .ForMember(dest => dest.Id, opt => opt.Ignore());

            CreateMap<UpdateEnrollmentDto, Enrollment>()
                .ForMember(dest => dest.EnrolledAt, opt => opt.Ignore());
        }
    }
}