using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Common.Dto
{
    public class MenuUpdateDto
    {
        public string ItemName { get; set; }
        public double Price { get; set; }
        public MenuCategory Category { get; set; }
        public double Volume { get; set; }
    }
}
