using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Common.Dto
{
    public class OrderDto
    {
        public int Id { get; set; }
        public int StoreId { get; set; }
        public string Status { get; set; }
        public string Type { get; set; }
        public double DeliveryLatitude { get; set; }
        public double DeliveryLongitude { get; set; }
        public string Address { get; set; }
        public List<OrderItemDto> OrderItems { get; set; }

    }
}
