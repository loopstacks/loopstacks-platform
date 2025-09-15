# LoopStacks Platform - Development Guide

This guide helps you set up a local development environment for the LoopStacks Platform.

## Quick Start

### Option 1: Mock Mode (Recommended for UI Development)

The fastest way to get started with frontend development:

```bash
# Install dependencies
make deps

# Start development environment with mock data (no Kubernetes required)
make dev-mock
```

This will start:
- Control Plane API with mock data on port 8080
- Web Console on port 3000

### Option 2: Full Kubernetes Development

For full development including operator functionality:

```bash
# Install dependencies
make deps

# Set up local Kubernetes cluster with kind
make dev-setup

# Start development environment with Kubernetes
make dev-k8s
```

This will start:
- Local kind cluster with CRDs installed
- Operator running locally in dev mode
- Control Plane API connected to Kubernetes
- Web Console on port 3000

## Development Environment Options

| Command | Description | Requirements | Use Case |
|---------|-------------|--------------|----------|
| `make dev-mock` | Mock mode development | Node.js, Go | Frontend development, API testing |
| `make dev-k8s` | Full Kubernetes development | Kind, kubectl, Docker | Full stack development |
| `make dev-setup` | Setup kind cluster only | Kind, kubectl, Docker | Initial setup |
| `make dev-clean` | Clean up everything | - | Environment cleanup |

## Components Overview

### 1. Operator (`/operator`)
- Kubernetes operator written in Go
- Manages LoopStacks custom resources
- Runs locally in dev mode with `--dev-mode` flag

### 2. Control Plane (`/control-plane`)
- Node.js/Express API server
- Provides REST API for web console
- WebSocket support for real-time updates
- Can run in mock mode or connect to Kubernetes

### 3. Web Console (`/web-console`)
- React/Vite frontend application
- Connects to Control Plane API
- Modern UI for managing LoopStacks resources

## Environment Configuration

### Control Plane Environment Variables

Copy `.env.example` to `.env` in the control plane directory:

```bash
cp control-plane/.env.example control-plane/.env
```

Key variables:
- `MOCK_MODE=true`: Use mock data instead of Kubernetes
- `PORT=8080`: API server port
- `CORS_ORIGIN=http://localhost:3000`: Web console origin

### Mock Mode vs Kubernetes Mode

**Mock Mode** (`MOCK_MODE=true`):
- Uses in-memory mock data
- No Kubernetes cluster required
- Faster startup and development cycle
- Perfect for UI development and API testing

**Kubernetes Mode** (`MOCK_MODE=false`):
- Connects to real Kubernetes cluster
- Requires operator to be running
- Full functionality testing
- Required for operator development

## Development Workflow

### Frontend Development
1. `make dev-mock` - Start with mock data
2. Open http://localhost:3000
3. Make changes to web console
4. Hot reload automatically updates

### Backend Development
1. `make dev-mock` or `make dev-k8s` depending on needs
2. Make changes to control plane
3. Restart with `Ctrl+C` and re-run make command

### Operator Development
1. `make dev-setup` - Setup kind cluster
2. `make dev-k8s` - Start with Kubernetes
3. Make changes to operator
4. Restart operator process

## Available Commands

### Build Commands
```bash
make build                 # Build all components
make build-operator        # Build operator only
make build-control-plane   # Build control plane only
make build-web-console     # Build web console only
```

### Test Commands
```bash
make test                  # Run all tests
make test-operator         # Run operator tests
make test-control-plane    # Run control plane tests
make test-web-console      # Run web console tests
```

### Development Commands
```bash
make dev                   # Start development environment (mock mode)
make dev-mock              # Start with mock data
make dev-k8s               # Start with Kubernetes
make dev-setup             # Setup kind cluster
make dev-clean             # Clean up environment
```

### Individual Component Commands
```bash
make run-operator          # Run operator locally
make run-control-plane     # Run control plane locally
make run-console           # Run web console locally
```

## Accessing Services

| Service | URL | Description |
|---------|-----|-------------|
| Web Console | http://localhost:3000 | Main UI |
| Control Plane API | http://localhost:8080 | REST API |
| Health Check | http://localhost:8080/health | API health status |
| Operator Metrics | http://localhost:8081/metrics | Operator metrics (K8s mode only) |

## Troubleshooting

### Common Issues

**Port conflicts:**
```bash
# Clean up any running processes
make dev-clean

# Or manually kill processes
pkill -f "npm run dev"
pkill -f "tsx src/index.ts"
```

**Kind cluster issues:**
```bash
# Reset kind cluster
kind delete cluster --name loopstacks-dev
make dev-setup
```

**Dependencies issues:**
```bash
# Reinstall dependencies
make clean
make deps
```

### Logs and Debugging

**Control Plane logs:**
- Check terminal output where you ran `make dev-mock` or `make dev-k8s`
- Logs show HTTP requests, WebSocket connections, and errors

**Operator logs:**
- Check terminal output where you ran `make dev-k8s`
- Use `kubectl logs` for deployed operator logs

**Web Console logs:**
- Open browser developer tools
- Check console for frontend errors

## Development Tips

1. **Start with mock mode** for faster iteration on UI/UX
2. **Use Kubernetes mode** when testing operator integration
3. **Keep terminals open** to see real-time logs
4. **Use browser dev tools** for frontend debugging
5. **Check health endpoint** to verify API connectivity

## Contributing

1. Make changes in your branch
2. Test with both `make dev-mock` and `make dev-k8s`
3. Run tests with `make test`
4. Ensure linting passes with `make lint`
5. Submit pull request

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Console   │    │  Control Plane  │    │    Operator     │
│   (React/Vite)  │────│  (Node.js/API)  │────│   (Go/K8s)     │
│   Port: 3000    │    │   Port: 8080    │    │   Port: 8081    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              │ (Mock Mode)
                              ▼
                       ┌─────────────────┐
                       │   Mock Service  │
                       │  (In-Memory)    │
                       └─────────────────┘
```

For more detailed information, check individual component README files.