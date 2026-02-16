using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repository.Entities
{
    public class CourierTracking
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int CourierId { get; set; }
        public Couriers Courier { get; set; }

        [Required]
        public double Latitude { get; set; }

        [Required]
        public double Longitude { get; set; }

        [Required]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        // אופציונלי: מזהה הזמנה אם זה חלק ממסלול מסוים
        public int? OrderId { get; set; }
        public Orders? Order { get; set; }
    }
}
