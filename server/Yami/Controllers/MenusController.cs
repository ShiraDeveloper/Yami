using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Repository.Entities;
using Common.Dto;
using Service.Interfaces;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MenuController : ControllerBase
    {
        private readonly IMenuService _menuService;

        public MenuController(IMenuService menuService)
        {
            _menuService = menuService;
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<Menu>> CreateMenu([FromBody] MenuCreateDto dto)
        {
            var menu = new Menu
            {
                StoreId = dto.StoreId,
                ItemName = dto.ItemName,
                Price = dto.Price,
                Category = dto.Category,
                Volume = dto.Volume
            };

            var result = await _menuService.Add(menu);
            return CreatedAtAction(nameof(GetMenuById), new { id = result.Id }, result);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateMenu(int id, [FromBody] MenuUpdateDto dto)
        {
            var menu = new Menu
            {
                ItemName = dto.ItemName,
                Price = dto.Price,
                Category = dto.Category,
                Volume = dto.Volume
            };

            var updated = await _menuService.Update(id, menu);
            if (updated == null) return NotFound($"Menu with ID {id} not found.");
            return Ok(updated);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteMenu(int id)
        {
            var deleted = await _menuService.Delete(id);
            if (deleted == null) return NotFound();
            return NoContent();
        }

        [HttpGet]
        public async Task<ActionResult<List<Menu>>> GetMenus(
            [FromQuery] string? search = null,
            [FromQuery] MenuCategory? category = null)
        {
            var menus = await _menuService.SearchMenus(search, category);
            return Ok(menus);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Menu>> GetMenuById(int id)
        {
            var menu = await _menuService.GetById(id);
            if (menu == null) return NotFound();
            return Ok(menu);
        }
    }
}