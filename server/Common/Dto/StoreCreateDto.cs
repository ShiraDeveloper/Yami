using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Common.Dto
{
    public class StoreCreateDto
    {
        [Required]
        public string Name { get; set; } = null!;
        [Required]
        public string Address { get; set; } = null!;
        public string? KosherTags { get; set; }
        public string? OpenHours { get; set; }
        public string? Phone { get; set; }
    }
}
