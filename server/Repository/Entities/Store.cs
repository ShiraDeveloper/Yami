using Repository.Entities;
using System.ComponentModel.DataAnnotations;

public class Store
{
    public int Id { get; set; }

    public int OwnerId { get; set; }
    public User Owner { get; set; }

    [Required]
    public string Name { get; set; }

    [Required]
    public string Address { get; set; }

    public double? Latitude { get; set; }       
    public double? Longitude { get; set; }    

    public string? KosherTags { get; set; }  
    public string? OpenHours { get; set; }    
    public bool IsOpen { get; set; } = true;    

    public string? Phone { get; set; }        

    public ICollection<Menu>? Menus { get; set; } 
    public ICollection<Order>? Orders { get; set; }  
}