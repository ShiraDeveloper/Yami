using System;
using System.Collections.Generic;
using System.Diagnostics.Metrics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repository.Entities
{
    public class Delivery
    {
        public int Id { get; set; }

        public int CourierId { get; set; }
        public Couriers Courier { get; set; }

        public DateTime CreatedAt { get; set; }
        public bool IsActive { get; set; }

        public ICollection<DeliveryOrder> DeliveryOrders { get; set; }
    }
}
