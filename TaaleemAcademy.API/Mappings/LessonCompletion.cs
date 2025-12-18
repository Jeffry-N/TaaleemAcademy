using AutoMapper;
using TaaleemAcademy.API.Models;
using TaaleemAcademy.API.DTOs;

namespace TaaleemAcademy.API.Mappings
{
    public class LessonCompletionMappingProfile : Profile
    {
        public LessonCompletionMappingProfile()
        {
            CreateMap<LessonCompletion, LessonCompletionDto>();
            CreateMap<CreateLessonCompletionDto, LessonCompletion>()
                .ForMember(dest => dest.CompletedAt, opt => opt.MapFrom(src => DateTime.Now))
                .ForMember(dest => dest.Id, opt => opt.Ignore());
            CreateMap<UpdateLessonCompletionDto, LessonCompletion>();
        }
    }
}