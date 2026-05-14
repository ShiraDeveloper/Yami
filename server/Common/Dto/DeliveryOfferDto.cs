using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Common.Dto
{
    public class DeliveryOfferDto
    {
        public int Id { get; set; }
        public int DeliveryId { get; set; }
        public int OrderId { get; set; }
        public int? CourierId { get; set; } // מי קיבל את ההצעה
        public bool IsAccepted { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
