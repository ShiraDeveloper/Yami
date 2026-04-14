using System.Diagnostics.Metrics;

public class Delivery
{
    public int Id { get; set; }

    public int CourierId { get; set; }
    public Courier? Courier { get; set; }

    public DateTime CreatedAt { get; set; }
    public bool IsActive { get; set; }

    public ICollection<DeliveryOrder> DeliveryOrders { get; set; } = new List<DeliveryOrder>();
}