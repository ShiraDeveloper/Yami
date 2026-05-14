using System.ComponentModel.DataAnnotations;

public class CourierTrackingCreateDto
{
    [Required]
    public int CourierId { get; set; }

    [Required]
    public double Latitude { get; set; }

    [Required]
    public double Longitude { get; set; }

    public int? OrderId { get; set; }
}