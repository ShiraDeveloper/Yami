using System.ComponentModel.DataAnnotations;

public enum MenuCategory
{
    MainCourse = 1,   // מנות עיקריות
    Appetizer = 2,    // מנות פתיחה
    Salad = 3,        // סלטים
    Sandwich = 4,     // כריכים
    Pizza = 5,        // פיצות
    Pasta = 6,        // פסטות
    Burger = 7,       // המבורגרים
    Dessert = 8,      // קינוחים
    Drink = 9,        // שתיה
    Coffee = 10,      // קפה
    Alcohol = 11,     // אלכוהול
    KidsMeal = 12     // מנות ילדים
}
public class Menu
{
    public int Id { get; set; }

    public int StoreId { get; set; }
    public Store? Store { get; set; }

    [Required]
    public string ItemName { get; set; }

    public double Price { get; set; }

    public MenuCategory? Category { get; set; }

    public double Volume { get; set; }

   // public ICollection<OrderItem>? OrderItems { get; set; }
}