using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repository.Entities
{
    public class DeliveryOrder
    {
        public int Id { get; set; }

        public int DeliveryId { get; set; }
        public Delivery Delivery { get; set; }

        public int OrderId { get; set; }
        public Orders Order { get; set; }
        public bool IsOffered { get; set; }
        public List<int> RefusedBy { get; set; } = new List<int>();
        public double DistanceFromPreviousStop { get; set; }

        // אלגוריתם מסלול
        public int DropOrderIndex { get; set; }

        // מעקב בפועל
        public DateTime? DeliveredTime { get; set; }

        public string Status { get; set; }
    }
}
