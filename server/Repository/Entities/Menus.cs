using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repository.Entities
{
    public class Menus
    {
        [Key]
        public int Id { get; set; }

        [ForeignKey("Store")]
        public int StoreId { get; set; }

        [Required]
        public string ItemName { get; set; }

        public float Price { get; set; }
        public string Category { get; set; }
        public double Volume { get; set; }  // נפח של הפריט בארגז
        public Stores Store { get; set; }
    }
}
