using Microsoft.AspNetCore.SignalR;
using System.Text.RegularExpressions;

namespace Common.Hubs
{
    public class TrackingHub : Hub
    {
        public async Task JoinOrderGroup(string orderId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, orderId);
        }

        public async Task LeaveOrderGroup(string orderId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, orderId);
        }
    }
}

