using AutoMapper;
using TaaleemAcademy.API.Models;
using TaaleemAcademy.API.DTOs;

namespace TaaleemAcademy.API.Mappings
{
    public class StudentAnswerMappingProfile : Profile
    {
        public StudentAnswerMappingProfile()
        {
            CreateMap<StudentAnswer, StudentAnswerDto>();
            
            CreateMap<CreateStudentAnswerDto, StudentAnswer>()
                .ForMember(dest => dest.Id, opt => opt.Ignore());

            CreateMap<UpdateStudentAnswerDto, StudentAnswer>();
        }
    }
}