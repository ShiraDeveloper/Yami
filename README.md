# Yami

Yami is a modern food delivery platform that connects customers, stores, and couriers in a single streamlined experience. The platform supports real-time order tracking, courier assignment, delivery coordination, and a responsive storefront built for smooth browsing and checkout.

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/.NET-9-512BD4?style=for-the-badge&logo=dotnet" alt=".NET 9" />
  <img src="https://img.shields.io/badge/SignalR-Real-Time-00B0F0?style=for-the-badge" alt="SignalR" />
  <img src="https://img.shields.io/badge/SQL-Server-CC2927?style=for-the-badge&logo=microsoftsqlserver" alt="SQL Server" />
</p>

## Overview

Yami brings together a customer-facing ordering experience and a courier operations dashboard. It is designed to make food delivery faster and more transparent by giving users real-time access to delivery updates while allowing couriers to receive tasks and track status efficiently.

## Key Features

- Customer registration and authentication
- Store and menu browsing
- Cart and checkout flow
- Real-time order status updates with SignalR
- Courier dashboard and delivery task management
- Live location tracking for deliveries
- JWT-based secure API access
- Swagger API documentation for backend testing
- Responsive web interface for desktop and mobile-friendly usage

## Tech Stack

### Frontend
- React
- Vite
- React Router
- Google Maps integration for delivery tracking
- SignalR client support for live updates

### Backend
- ASP.NET Core
- Entity Framework Core
- SQL Server
- JWT authentication
- Swagger / OpenAPI
- SignalR for real-time communication

## Project Structure

```text
Yami/
├── client/                 # React frontend
│   ├── src/                # Application pages and components
│   ├── public/             # Static assets
│   ├── package.json        # Frontend dependencies and scripts
│   └── vite.config.ts      # Vite configuration
│
├── server/                 # Backend services and projects
│   ├── Yami/               # ASP.NET Core application
│   ├── DataContext/        # Database context
│   ├── Repository/         # Data access and repositories
│   ├── Service/            # Business logic services
│   └── Common/             # Shared utilities and hubs
│
├── README.md               # Project overview and setup guide
├── .gitignore              # Git ignore rules
└── Yami.sln                # Solution file
```

## Prerequisites

Before running the project, make sure you have:

- .NET 9 SDK
- Node.js 20+ and npm
- SQL Server instance or LocalDB
- A working browser for local development

## Configuration

The backend reads environment-specific settings from appsettings files and connection strings. Update the database connection and JWT settings in the backend configuration before running the app.

Typical configuration values include:

- Database connection string
- JWT issuer, audience, and signing key
- CORS origins for local frontend access

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/Yami.git
cd Yami
```

### 2. Restore backend dependencies

```bash
dotnet restore
```

### 3. Run the backend API

```bash
dotnet run --project server/Yami/Yami.csproj
```

The API will be available via Swagger in the local development environment, typically under the app's configured localhost URL followed by `/swagger`.

### 4. Install frontend dependencies

```bash
cd client
npm install
```

### 5. Start the frontend

```bash
npm run dev
```

The frontend should start on the default Vite development port, usually:

```text
http://localhost:5173
```

## Development Notes

- The API uses JWT authentication for protected endpoints.
- SignalR hubs are enabled for live tracking and delivery updates.
- CORS is configured for local frontend communication.
- The project is structured for separation of concerns across data, service, and presentation layers.

## Suggested Future Improvements

- Add admin dashboard for managing stores and menu items
- Improve analytics and restaurant performance reporting
- Expand courier optimization logic
- Add push notifications for order state changes
- Introduce automated tests for API and frontend flows

## Project Status

This project is currently in active development and is intended as a scalable delivery platform foundation for further enhancements.

## Contact

For questions or collaboration opportunities, feel free to reach out via the repository owner contact information or project discussion section.

---

Built with care for a modern, real-time delivery experience.
