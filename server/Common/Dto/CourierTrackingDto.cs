using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Common.Dto
{
    public class CourierTrackingDto
    {
        public int Id { get; set; }
        public int CourierId { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public DateTime Timestamp { get; set; }
        public int? OrderId { get; set; }
    }
}
