using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Common.Dto
{
    public class MenuDto
    {
        public int Id { get; set; }
        public string ItemName { get; set; } = null!;
        public float Price { get; set; }
        public string? Category { get; set; }
        public double Volume { get; set; }
    }
}
