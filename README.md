# Science Portal

A modern web application providing a user interface for the [CANFAR](https://www.canfar.net/) (Canadian Advanced Network for Astronomical Research) platform. Science Portal enables researchers to launch and manage computational sessions, access containerized applications for astronomical research, and monitor resources.

## Features

- **Session Management** - Launch, monitor, and manage computational sessions (VMs/containers)
- **Container Applications** - Access tools like CARTA, Jupyter notebooks, and other research applications
- **Resource Selection** - Configure memory, CPU cores, and GPU resources with interactive controls
- **Platform Monitoring** - Real-time metrics for platform load and resource usage
- **Storage Management** - View and manage user storage quota
- **Dual Authentication** - Supports both CANFAR and OIDC authentication modes
- **Responsive Design** - Mobile-friendly interface with light/dark theme support

## Tech Stack

- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript 5
- **UI:** Material-UI 7, Tailwind CSS 4
- **State Management:** Zustand, TanStack React Query
- **Authentication:** NextAuth 5 (CANFAR/OIDC modes)
- **Runtime:** Node.js 22+

## Getting Started

### Prerequisites

- Node.js 22.11 or later
- npm or yarn

### Installation

```bash
# Clone the repository
git clone git@github.com:opencadc/science-portal.git
cd science-portal

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env.local
```

### Environment Variables

Configure the following environment variables in `.env.local`:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_LOGIN_API` | Authentication API endpoint |
| `NEXT_PUBLIC_SKAHA_API` | Session/compute API endpoint |
| `NEXT_PUBLIC_API_TIMEOUT` | API request timeout (default: 30000ms) |
| `AUTH_SECRET` | NextAuth secret key |
| `NEXT_USE_CANFAR` | Toggle between CANFAR/OIDC auth mode |

### Development

```bash
# Start development server with Turbopack
npm run dev

# Run linting
npm run lint

# Format code
npm run format
```

The application will be available at `http://localhost:3000`.

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
src/
├── app/                  # Next.js App Router
│   ├── api/              # API routes (auth, sessions, storage)
│   ├── components/       # UI components (Material-UI based)
│   ├── science-portal/   # Main portal pages
│   ├── providers/        # React context providers
│   └── contexts/         # Shared state contexts
├── lib/                  # Shared libraries
│   ├── api/              # API client functions
│   ├── auth/             # Authentication helpers
│   ├── config/           # Configuration files
│   ├── hooks/            # Custom React hooks
│   ├── stores/           # Zustand state stores
│   └── utils/            # Utility functions
└── types/                # TypeScript definitions
```

## Deployment

### Docker

```bash
# Build and run with Docker Compose
docker-compose up --build
```

### Kubernetes

Helm charts are provided for Kubernetes deployment. See the [Helm documentation](./helm/README.md) for detailed instructions.

```bash
# Quick start with Helm
helm install science-portal ./helm/science-portal
```

For deployment mode details (CANFAR vs OIDC), refer to [DEPLOYMENT-MODES.md](./helm/DEPLOYMENT-MODES.md).

## Documentation

- [Development Guide](./DEVELOPMENT_GUIDE.md) - Local development setup and testing
- [Helm Deployment](./helm/README.md) - Kubernetes deployment with Helm
- [Kubernetes Guide](./helm/KUBERNETES-DEPLOYMENT-GUIDE.md) - Complete K8s deployment instructions

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is part of the [OpenCADC](https://github.com/opencadc) initiative.
