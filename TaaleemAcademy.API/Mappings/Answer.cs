using AutoMapper;
using TaaleemAcademy.API.Models;
using TaaleemAcademy.API.DTOs;

namespace TaaleemAcademy.API.Mappings
{
    public class AnswerMappingProfile : Profile
    {
        public AnswerMappingProfile()
        {
            CreateMap<Answer, AnswerDto>();
            CreateMap<CreateAnswerDto, Answer>().ForMember(dest => dest.Id, opt => opt.Ignore());
            CreateMap<UpdateAnswerDto, Answer>();
        }
    }
}