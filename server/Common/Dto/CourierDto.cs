using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Common.Dto
{
    public class CourierDto
    {
        public int Id { get; set; }
        public UserDto User { get; set; } = null!;
        public bool IsAvailable { get; set; }
        public double MaxBoxVolume { get; set; }
        public double RemainingBoxVolume { get; set; }
        public double CurrentLatitude { get; set; }
        public double CurrentLongitude { get; set; }
    }
}
