using Repository.Entities;

public class DeliveryOffer
{
    public int Id { get; set; }

    // ההזמנה שעליה נשלחה ההצעה
    public int OrderId { get; set; }
    public Order Order { get; set; }

    // השליח שקיבל את ההצעה
    public int CourierId { get; set; }
    public Courier Courier { get; set; }

    // זמן שליחת ההצעה
    public DateTime OfferedAt { get; set; } = DateTime.UtcNow;

    // null = עדיין לא ענה
    // true = קיבל
    // false = דחה
    public bool? Accepted { get; set; }
}