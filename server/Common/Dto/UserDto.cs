using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Repository.Entities;

namespace Common.Dto
{
        public class UserDto
        {
            public int Id { get; set; }
            public string Name { get; set; }
            public string Email { get; set; }
            public string Phone { get; set; }
            public Role Role { get; set; }  // Customer, Delivery, Admin
            public float Latitude { get; set; }
            public float Longitude { get; set; }
        }
}
