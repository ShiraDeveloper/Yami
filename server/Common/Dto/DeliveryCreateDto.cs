using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Common.Dto
{
    public class DeliveryCreateDto
    {
        public int CourierId { get; set; }
        public bool? IsActive { get; set; } = true; // אופציונלי, ברירת מחדל true
    }
}
