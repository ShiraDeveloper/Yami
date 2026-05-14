using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Common.Dto
{
    public class DeliveryOrderCreateDto
    {
        public int DeliveryId { get; set; }
        public int OrderId { get; set; }
        public int? StopIndex { get; set; }
    }

}
