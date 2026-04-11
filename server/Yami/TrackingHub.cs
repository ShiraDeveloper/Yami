using Microsoft.AspNetCore.SignalR;
using System;

public class TrackingHub : Hub
{
    public async Task JoinOrder(int orderId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"order-{orderId}");
    }

    public async Task LeaveOrder(int orderId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"order-{orderId}");
    }
}