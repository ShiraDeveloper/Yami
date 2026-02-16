using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace Repository.Entities
{
    public class Stores
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }  // הבעלים של החנות

        [ForeignKey("UserId")]
        public Users Owner { get; set; }  // קשר ל־Users

        [Required]
        public string Name { get; set; }
        [Required]
        public string Address { get; set; }

        public string KosherTags { get; set; }
        public string OpenHours { get; set; }
        public bool IsOpen { get; set; } = true;
        public string Phone { get; set; }
    }
}