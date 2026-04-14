using System.Diagnostics.Metrics;

public class CourierTracking
{
    public int Id { get; set; }

    public int CourierId { get; set; }
    public Courier Courier { get; set; }

    public double Latitude { get; set; }
    public double Longitude { get; set; }

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public int? OrderId { get; set; }
    public Order? Order { get; set; }
}