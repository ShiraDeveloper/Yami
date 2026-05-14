using Repository.Entities;

public enum OrderStatus
{
    New,
    Approved,
    InProgress,
    Delivered,
    Canceled
}

public class Order
{
    public int Id { get; set; }

    public int CustomerId { get; set; }
    public User Customer { get; set; }

    public int StoreId { get; set; }
    public Store Store { get; set; }

    public int? CourierId { get; set; } 
    public Courier? Courier { get; set; }         

    public OrderStatus Status { get; set; } = OrderStatus.New;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpectedDeliveryTime { get; set; } // אופציונלי – לא חייב להיות בהתחלה
    public DateTime? DeliveredAt { get; set; }         // אופציונלי – לא נקבע עד מסירה

    public double DeliveryLatitude { get; set; }
    public double DeliveryLongitude { get; set; }
    public string Address { get; set; }
    public int PlannedSequence { get; set; }

    public double TotalVolume { get; set; }

    public ICollection<OrderItem>? OrderItems { get; set; } // אופציונלי – יכול להיות null עד שמוסיפים פריטים
    public ICollection<DeliveryOrder>? DeliveryOrders { get; set; }
}