using Microsoft.EntityFrameworkCore;
using Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repository.Repositories
{
    public class DeliveryOfferRepository : IRepository<DeliveryOffer>
    {
        private readonly IContext ctx;
        public DeliveryOfferRepository(IContext context)
        {
            ctx = context;
        }
        public async Task<DeliveryOffer> Add(DeliveryOffer entity)
        {
            ctx.DeliveryOffer.Add(entity);
            await ctx.Save();
            return entity;
        }

        public async Task<DeliveryOffer> Delete(int id)
        {
            var d = await ctx.DeliveryOffer.FirstOrDefaultAsync(x => x.Id == id);
            if (d != null)
            {
                ctx.DeliveryOffer.Remove(d);
                await ctx.Save();
                return d;
            }
            return null;
        }

        public Task<List<DeliveryOffer>> GetAll()
        {
            return ctx.DeliveryOffer.ToListAsync();
        }

        public async Task<DeliveryOffer> GetById(int id)
        {
            return await ctx.DeliveryOffer.FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task<DeliveryOffer> Update(DeliveryOffer entity)
        {
            var existingDeliveryOffer = await ctx.DeliveryOffer.FirstOrDefaultAsync(x => x.Id == entity.Id);
            if (existingDeliveryOffer == null)
                return null;
            existingDeliveryOffer.Id=entity.Id;
            existingDeliveryOffer.Accepted=entity.Accepted;
            existingDeliveryOffer.OfferedAt= entity.OfferedAt;
            existingDeliveryOffer.Courier= entity.Courier;
            existingDeliveryOffer.CourierId = entity.CourierId;
            existingDeliveryOffer.DeliveryOrder = entity.DeliveryOrder;
            existingDeliveryOffer.DeliveryOrderId = entity.DeliveryOrderId;
            await ctx.Save();
            return existingDeliveryOffer;
        }

    }

}
