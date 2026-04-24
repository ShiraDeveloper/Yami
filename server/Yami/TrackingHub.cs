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
    public async Task UpdateCourierLocation(int orderId, double lat, double lng)
    {
        await Clients.Group($"order-{orderId}")
            .SendAsync("ReceiveCourierLocation", lat, lng);
    }
}