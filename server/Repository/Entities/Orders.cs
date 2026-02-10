using System;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Diagnostics.Metrics;
using Repository.Entities;

namespace Repository.Entities
{
    public enum OrderStatus
    {
        New,          // הזמנה נוצרה
        Approved,     // חנות אישרה
        InProgress,   // שליח אסף
        Delivered,    // נמסר ללקוח
        Canceled      // בוטל
    }
    public class Orders
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }   
        public int CustomerId { get; set; }
        public int StoreId { get; set; }
        public int? CourierId { get; set; }
        public Users Customer { get; set; }
        public Stores Store { get; set; }
        public Couriers? Courier { get; set; }
        public OrderStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime ExpectedDeliveryTime { get; set; }
        public float DeliveryLatitude { get; set; }
        public float DeliveryLongitude { get; set; }
        public float CurrentLatitude { get; set; }
        public float CurrentLongitude { get; set; }
        public DateTime LastUpdated { get; set; }

        //public ICollection<OrderItem> OrderItems { get; set; }
    }
}


