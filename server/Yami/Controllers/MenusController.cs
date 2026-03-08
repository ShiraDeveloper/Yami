using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Repository.Entities;
using Repository.Interfaces;
using Common.Dto;
using Repository.Repositories;
namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MenuController : ControllerBase
    {
        private readonly IRepository<Menu> _menuRepository;
        private readonly IRepository<Store> _storeRepository;

        public MenuController(IRepository<Menu> menuRepository, IRepository<Store> storeRepository)
        {
            _menuRepository = menuRepository;
            _storeRepository = storeRepository;
        }

        // ==========================
        // CRUD – רק מנהלים
        // ==========================
        [HttpPost]
        [Authorize(Roles = "Admin")] // רק מנהל יכול להוסיף מוצר
        public async Task<ActionResult<Menu>> CreateMenu([FromBody] MenuCreateDto dto)
        {
            // בדיקה אם החנות קיימת
            var store = await _storeRepository.GetById(dto.StoreId);
            if (store == null)
                return BadRequest($"Store with ID {dto.StoreId} does not exist.");

            var menu = new Menu
            {
                StoreId = dto.StoreId,
                ItemName = dto.ItemName,
                Price = dto.Price,
                Category = dto.Category,
                Volume = dto.Volume
            };

            await _menuRepository.Add(menu);

            // מחזיר 201 Created עם ה‑ID של המוצר החדש
            return CreatedAtAction(nameof(GetMenuById), new { id = menu.Id }, menu);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")] // רק מנהל יכול לקרוא לפעולה זו
        public async Task<IActionResult> UpdateMenu(int id, [FromBody] MenuUpdateDto menuDto)
        {
            // שליפת המוצר מה‑DB לפי ID
            var menu = await _menuRepository.GetById(id);
            if (menu == null)
                return NotFound($"Menu with ID {id} not found.");

            // עדכון השדות הרצויים
            menu.ItemName = menuDto.ItemName;
            menu.Price = menuDto.Price;
            menu.Category = menuDto.Category;
            menu.Volume = menuDto.Volume;

            await _menuRepository.Update(menu); // שמירה במסד
            return Ok(menu);
        }
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteMenu(int id)
        {
            var deleted = await _menuRepository.Delete(id);
            if (deleted == null) return NotFound();
            return NoContent();
        }

        // ==========================
        // קריאה / חיפוש
        // ==========================

        [HttpGet]
        public async Task<ActionResult<List<Menu>>> GetMenus(
            [FromQuery] string? search = null,
            [FromQuery] MenuCategory? category = null)
        {
            var menus = await _menuRepository.GetAll();

            if (!string.IsNullOrEmpty(search))
                menus = menus.Where(m => m.ItemName.Contains(search, StringComparison.OrdinalIgnoreCase)).ToList();

            if (category.HasValue)
                menus = menus.Where(m => m.Category == category).ToList();

            return Ok(menus);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Menu>> GetMenuById(int id)
        {
            var menu = await _menuRepository.GetById(id);
            if (menu == null) return NotFound();
            return Ok(menu);
        }
    }
}