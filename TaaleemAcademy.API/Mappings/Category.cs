using AutoMapper;
using TaaleemAcademy.API.Models;
using TaaleemAcademy.API.DTOs;

namespace TaaleemAcademy.API.Mappings
{
    public class CategoryMappingProfile : Profile
    {
        public CategoryMappingProfile()
        {
            // Category -> CategoryDto
            CreateMap<Category, CategoryDto>();

            // CreateCategoryDto -> Category
            CreateMap<CreateCategoryDto, Category>()
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.Now))
                .ForMember(dest => dest.Id, opt => opt.Ignore());

            // UpdateCategoryDto -> Category
            CreateMap<UpdateCategoryDto, Category>()
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore());
        }
    }
}