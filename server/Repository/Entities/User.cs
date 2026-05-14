using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;
using System.Diagnostics.Metrics;

public enum Role
{
    Customer = 0,
    Delivery = 1,
    Admin = 2
}

namespace Repository.Entities
{
    public class User
    {
        public int Id { get; set; } 
        [Required] public string Name { get; set; }
        [Required] public string Email { get; set; }
        public string? Phone { get; set; }
        [Required] public string Password { get; set; }
        public Role Role { get; set; } = Role.Customer;

        public float Latitude { get; set; } 
        public float Longitude { get; set; }

        public Courier? CourierProfile { get; set; } 
        public ICollection<Order>? Orders { get; set; }
        public ICollection<Store>? Stores { get; set; } 
    }
}