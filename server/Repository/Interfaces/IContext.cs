using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Yami.Models;

namespace Repository.Interfaces
{
    internal interface IContext
    {
        public DbSet<Couriers> Couriers { get; set; }
        public DbSet<Orders> Orders { get; set; }
        public DbSet<Stores> Stores { get; set; }
        public DbSet<Users> Users { get; set; }
    }
}
