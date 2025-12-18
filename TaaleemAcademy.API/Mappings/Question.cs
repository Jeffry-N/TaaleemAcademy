using AutoMapper;
using TaaleemAcademy.API.Models;
using TaaleemAcademy.API.DTOs;

namespace TaaleemAcademy.API.Mappings
{
    public class QuestionMappingProfile : Profile
    {
        public QuestionMappingProfile()
        {
            CreateMap<Question, QuestionDto>();
            CreateMap<CreateQuestionDto, Question>()
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.Now))
                .ForMember(dest => dest.Id, opt => opt.Ignore());
            CreateMap<UpdateQuestionDto, Question>()
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore());
        }
    }
}