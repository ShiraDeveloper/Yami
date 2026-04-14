using Repository.Entities;

public enum DeliveryOrderStatus
{
    Pending,
    PickedUp,
    Delivered
}

public class DeliveryOrder
{
    public int Id { get; set; }

    public int DeliveryId { get; set; }
    public Delivery Delivery { get; set; }

    public int OrderId { get; set; }
    public Order Order { get; set; }

    public int StopIndex { get; set; }  // מיקום העצירה במסלול

    public double DistanceFromPreviousStop { get; set; } // מרחק מהעצירה הקודמת

    public DateTime? DeliveredTime { get; set; }  // אופציונלי: ייתכן שההזמנה עדיין לא נמסרה

    public DeliveryOrderStatus Status { get; set; } = DeliveryOrderStatus.Pending; // ברירת מחדל
    public ICollection<DeliveryOffer>? DeliveryOffers { get; set; }
}