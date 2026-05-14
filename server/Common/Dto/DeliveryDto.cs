using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Common.Dto
{
    public class DeliveryDto
    {
        public int Id { get; set; }
        public int CourierId { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<DeliveryOrderDto> DeliveryOrders { get; set; }
    }
}
