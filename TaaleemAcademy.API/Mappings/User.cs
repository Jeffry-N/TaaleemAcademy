using AutoMapper;
using TaaleemAcademy.API.Models;
using TaaleemAcademy.API.DTOs;

namespace TaaleemAcademy.API.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // User -> UserDto (Entity to Response)
            CreateMap<User, UserDto>();

            // CreateUserDto -> User (Request to Entity)
            CreateMap<CreateUserDto, User>()
                .ForMember(dest => dest.HashedPassword, opt => opt.MapFrom(src => src.Password))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.Now))
                .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.Id, opt => opt.Ignore());

            // UpdateUserDto -> User (Request to Entity)
            CreateMap<UpdateUserDto, User>()
                .ForMember(dest => dest.HashedPassword, opt => opt.Ignore()) // Don't update password via regular update
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => DateTime.Now))
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore());
        }
    }
}