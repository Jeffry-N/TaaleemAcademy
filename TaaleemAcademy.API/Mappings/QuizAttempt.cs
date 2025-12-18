using AutoMapper;
using TaaleemAcademy.API.Models;
using TaaleemAcademy.API.DTOs;

namespace TaaleemAcademy.API.Mappings
{
    public class QuizAttemptMappingProfile : Profile
    {
        public QuizAttemptMappingProfile()
        {
            CreateMap<QuizAttempt, QuizAttemptDto>();
            
            CreateMap<CreateQuizAttemptDto, QuizAttempt>()
                .ForMember(dest => dest.StartedAt, opt => opt.MapFrom(src => DateTime.Now))
                .ForMember(dest => dest.Score, opt => opt.MapFrom(src => 0.00M))
                .ForMember(dest => dest.TotalPoints, opt => opt.MapFrom(src => 0))
                .ForMember(dest => dest.EarnedPoints, opt => opt.MapFrom(src => 0))
                .ForMember(dest => dest.IsPassed, opt => opt.MapFrom(src => false))
                .ForMember(dest => dest.Id, opt => opt.Ignore());

            CreateMap<UpdateQuizAttemptDto, QuizAttempt>()
                .ForMember(dest => dest.StartedAt, opt => opt.Ignore());
        }
    }
}