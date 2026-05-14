using Common.Dto;
using System.ComponentModel.DataAnnotations;

public class OrderCreateDto
{
    [Required]
    [Range(1, int.MaxValue)]
    public int StoreId { get; set; }

    [Required]
    public double DeliveryLatitude { get; set; }

    [Required]
    public double DeliveryLongitude { get; set; }
    public string Address { get; set; }

    [Required]
    [MinLength(1)]
    public List<OrderItemCreateDto> OrderItems { get; set; } = new();
}