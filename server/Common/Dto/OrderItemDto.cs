using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Common.Dto
{
    public class OrderItemDto
    {
        public int MenuId { get; set; } // תואם ל-Entity
        public int Quantity { get; set; }
    }
}
