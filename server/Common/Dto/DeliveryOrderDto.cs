using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Common.Dto
{
    public class DeliveryOrderDto
    {
        public int Id { get; set; }
        public int DeliveryId { get; set; }
        public int OrderId { get; set; }
        public int StopIndex { get; set; }
        public double DistanceFromPreviousStop { get; set; }
        public DateTime? DeliveredTime { get; set; }
        public DeliveryOrderStatus Status { get; set; }
    }
}
