using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Common.Dto
{
    public class MenuCreateDto
    {
        [Required]
        public string ItemName { get; set; } = null!;
        [Required]
        public float Price { get; set; }
        public MenuCategory Category { get; set; }
        [Required]
        public double Volume { get; set; }
        public int StoreId { get; set; }
    }
}
