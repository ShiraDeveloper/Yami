using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Common.Dto
{
    public class StoreDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string Address { get; set; } = null!;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string? KosherTags { get; set; }
        public string? OpenHours { get; set; }
        public bool IsOpen { get; set; }
        public string? Phone { get; set; }
        public int OwnerId { get; set; }
        public double DistanceFromUser { get; set; } // Optional, יחושב לפי המשתמש
    }
}

