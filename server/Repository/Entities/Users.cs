using System.ComponentModel.DataAnnotations;

public enum Role
{
    Customer = 0,
    Delivery = 1,
    Admin = 2
}

namespace Repository.Entities
{
    public class Users
    {
        public int Id { get; set; }  // Primary Key
        public Role Role { get; set; } // Customer, Delivery, Admin
        [Required] public string Name { get; set; }
        [Required] public string Email { get; set; }
        public string Phone { get; set; }
        [Required] public string Password { get; set; }

        public float Latitude { get; set; }
        public float Longitude { get; set; }
    }
}