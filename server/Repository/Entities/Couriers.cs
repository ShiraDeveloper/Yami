using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;


namespace Repository.Entities
{
    public class Couriers
    {
        public int UserId { get; set; }
        public int CurrentLocation { get; set; }
        public bool Availability { get; set; }
        public int TotalDeliveries { get; set; }
        public int SalaryStatus { get; set; }
        public int LastUpdate { get; set; }
    }
}

