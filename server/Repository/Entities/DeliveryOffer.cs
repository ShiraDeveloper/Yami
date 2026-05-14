using System.Diagnostics.Metrics;

public class DeliveryOffer
{
    public int Id { get; set; }

    public int DeliveryOrderId { get; set; }
    public DeliveryOrder DeliveryOrder { get; set; }

    public int CourierId { get; set; }
    public Courier Courier { get; set; }

    public DateTime OfferedAt { get; set; } = DateTime.UtcNow;

    public bool? Accepted { get; set; }  // null = לא ענה עדיין, true = קיבל, false = דחה
}