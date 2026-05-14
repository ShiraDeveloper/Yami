using System.ComponentModel.DataAnnotations;

public class OrderItemCreateDto
{
    [Required]
    [Range(1, int.MaxValue)]
    public int MenuItemId { get; set; }

    [Required]
    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }
}