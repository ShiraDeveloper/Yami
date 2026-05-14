using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Service.Interfaces
{
    public interface ICourierMatchingService
    {
        Task<int?> FindBestCourier(double orderLat, double orderLng);
    }
}
