using Microsoft.EntityFrameworkCore;
using Repository.Entities;
using Repository.Interfaces;

namespace Repository.Repositories
{
    // הוספת ICourierRepository כאן היא קריטית
    public class CouriersRepository : ICourierRepository, IRepository<Courier>
    {
        private readonly IContext ctx;

        public CouriersRepository(IContext context)
        {
            ctx = context;
        }

        public async Task<Courier> Add(Courier entity)
        {
            ctx.Couriers.Add(entity);
            await ctx.Save();
            return entity;
        }

        public async Task<Courier> Delete(int id)
        {
            var c = await ctx.Couriers.FirstOrDefaultAsync(x => x.Id == id);
            if (c == null) return null;

            ctx.Couriers.Remove(c);
            await ctx.Save();
            return c;
        }

        //GetAll מעודכן עם Include לנתונים קריטיים
        public async Task<IEnumerable<Courier>> GetAll()
        {
            return await ctx.Couriers
                .Include(c => c.User)
                .Include(c => c.Orders)
                .ToListAsync();
        }

        public async Task<Courier> GetById(int id)
        {
            return await ctx.Couriers
                .Include(c => c.User)
                .Include(c => c.Orders)
                .FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task<List<Courier>> GetAvailableCouriers()
        {
            return await ctx.Couriers
                .Where(c => c.IsAvailable)
                .Include(c => c.User)
                .ToListAsync();
        }

        public async Task<Courier> Update(Courier entity)
        {
            var existing = await ctx.Couriers.FirstOrDefaultAsync(x => x.Id == entity.Id);
            if (existing == null) return null;

            existing.IsAvailable = entity.IsAvailable;
            existing.MaxBoxVolume = entity.MaxBoxVolume;
            existing.RemainingBoxVolume = entity.RemainingBoxVolume;
            existing.TotalDeliveries = entity.TotalDeliveries;

            await ctx.Save();
            return existing;
        }

        async Task<List<Courier>> IRepository<Courier>.GetAll()
        {
            return await ctx.Couriers
                .Include(c => c.User)
                .Include(c => c.Orders)
                .ToListAsync();
        }
    }
}