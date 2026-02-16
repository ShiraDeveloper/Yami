using System;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Diagnostics.Metrics;
using Repository.Entities;

namespace Repository.Entities
{
    public enum OrderStatus
    {
        New,
        Approved,
        InProgress,
        Delivered,
        Canceled
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

        public OrderStatus Status { get; set; } = OrderStatus.New;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ExpectedDeliveryTime { get; set; }
        public DateTime? DeliveredAt { get; set; }

        public double DeliveryLatitude { get; set; }
        public double DeliveryLongitude { get; set; }

        public double? CurrentLatitude { get; set; }
        public double? CurrentLongitude { get; set; }
        public DateTime? LastLocationUpdate { get; set; }
        public double TotalVolume { get; set; }  // נפח כולל של ההזמנה
    }
}


