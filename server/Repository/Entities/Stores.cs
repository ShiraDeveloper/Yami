using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace Yami.Models
{
    public class Stores
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)] // Auto-increment ID
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }  // Owner of the store

        [ForeignKey("UserId")]
        public Users Owner { get; set; }  // Navigation property

        [Required]
        public string Name { get; set; }

        [Required]
        public string Address { get; set; }

        public string KosherTags { get; set; }  // e.g., "Kosher, Vegan"
        public string OpenHours { get; set; }   // e.g., "09:00-22:00"
        public bool IsOpen { get; set; } = true;
    }
}