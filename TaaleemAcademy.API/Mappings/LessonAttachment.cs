using AutoMapper;
using TaaleemAcademy.API.Models;
using TaaleemAcademy.API.DTOs;

namespace TaaleemAcademy.API.Mappings
{
    public class LessonAttachmentMappingProfile : Profile
    {
        public LessonAttachmentMappingProfile()
        {
            CreateMap<LessonAttachment, LessonAttachmentDto>();
            CreateMap<CreateLessonAttachmentDto, LessonAttachment>()
                .ForMember(dest => dest.UploadedAt, opt => opt.MapFrom(src => DateTime.Now))
                .ForMember(dest => dest.Id, opt => opt.Ignore());
            CreateMap<UpdateLessonAttachmentDto, LessonAttachment>()
                .ForMember(dest => dest.UploadedAt, opt => opt.Ignore());
        }
    }
}