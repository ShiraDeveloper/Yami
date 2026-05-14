using Repository.Entities;

public class Courier
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public User? User { get; set; }

    public bool IsAvailable { get; set; }

    public double MaxBoxVolume { get; set; }
    public double RemainingBoxVolume { get; set; }

    public int TotalDeliveries { get; set; }

    public ICollection<Order>? Orders { get; set; }
    public ICollection<Delivery>? Deliveries { get; set; }
    public ICollection<DeliveryOffer>? DeliveryOffers { get; set; }
}