# Kubernetes Development Environment Setup

This guide explains how to set up a local Kubernetes cluster for LoopStacks development using k3d.

## Quick Start

### Option 1: Standalone k3d Setup (Recommended)
```bash
# Set up k3d cluster with full configuration
make dev-k3d
```

### Option 2: Docker Compose Integration
```bash
# Start all services including k3d cluster
make dev-services

# Then start LoopStacks platform
make dev-k8s
```

## What Gets Installed

### k3d Cluster Configuration
- **Cluster Name**: `loopstacks-dev`
- **API Server**: `https://localhost:6443`
- **Load Balancer HTTP**: `http://localhost:8081`
- **Load Balancer HTTPS**: `https://localhost:8443`
- **Worker Nodes**: 2 agents
- **Ingress**: NGINX Ingress Controller
- **Namespaces**: `loopstacks-system`, `loopstacks-dev`

### Services Integration
- **Redis**: `localhost:6379` (for agent coordination)
- **PostgreSQL**: `localhost:5432` (for platform data)
- **k3d Cluster**: `localhost:6443` (Kubernetes API)

## Development Workflows

### 1. Full Platform Development
```bash
# Start everything
make dev-k3d        # Set up k3d cluster
make dev-services   # Start Redis, PostgreSQL, k3d
make dev-k8s        # Start platform with Kubernetes

# Access services
# - Web Console: http://localhost:3000
# - Control Plane API: http://localhost:8080
# - Kubernetes API: https://localhost:6443
```

### 2. Mock Development (No Kubernetes)
```bash
# For UI-only development
make dev-mock
```

### 3. Operator Development
```bash
# Set up cluster
make dev-k3d

# Deploy CRDs
kubectl apply -f deploy/base/crds/

# Run operator locally
make run-operator
```

## Manual Cluster Management

### Cluster Operations
```bash
# List clusters
k3d cluster list

# Stop cluster (preserves data)
k3d cluster stop loopstacks-dev

# Start cluster
k3d cluster start loopstacks-dev

# Delete cluster (removes all data)
k3d cluster delete loopstacks-dev

# Get cluster info
kubectl cluster-info
kubectl get nodes
```

### Namespace Management
```bash
# View namespaces
kubectl get namespaces

# View resources in LoopStacks namespace
kubectl get all -n loopstacks-system
kubectl get all -n loopstacks-dev
```

### Debugging
```bash
# View cluster logs
docker logs loopstacks-k3d-setup

# Check cluster status
kubectl get pods -A

# View ingress status
kubectl get ingress -A
```

## Troubleshooting

### Cluster Won't Start
```bash
# Check Docker is running
docker info

# Check for port conflicts
lsof -i :6443
lsof -i :8081
lsof -i :8443

# Reset cluster
k3d cluster delete loopstacks-dev
make dev-k3d
```

### kubectl Not Working
```bash
# Verify kubeconfig
kubectl config current-context
kubectl config get-contexts

# Switch to k3d context
kubectl config use-context k3d-loopstacks-dev

# Reset kubeconfig
k3d kubeconfig merge loopstacks-dev --kubeconfig-switch-context
```

### Performance Issues
```bash
# Check resource usage
kubectl top nodes
kubectl top pods -A

# Increase Docker resources in Docker Desktop:
# - Memory: 8GB+
# - CPU: 4+ cores
# - Disk: 64GB+
```

## Production Considerations

### Differences from Production
- Single-node cluster (vs multi-node)
- Local storage (vs persistent volumes)
- No RBAC enforcement
- Development certificates
- Simplified networking

### Migration Path
1. Test locally with k3d
2. Deploy to staging with managed Kubernetes
3. Validate multi-cluster federation
4. Deploy to production

## Integration with Existing Tools

### IDE Integration
```bash
# VS Code Kubernetes extension
# Set kubeconfig path: ~/.kube/config

# Lens Kubernetes IDE
# Import cluster: k3d-loopstacks-dev
```

### CI/CD Integration
```bash
# GitHub Actions example
- name: Setup k3d
  run: |
    curl -s https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash
    ./scripts/dev/setup-k3d.sh

- name: Run tests
  run: make test-integration
```

## Resource Requirements

### Minimum System Requirements
- **RAM**: 8GB (4GB for Docker, 2GB for k3d, 2GB for OS)
- **CPU**: 4 cores
- **Disk**: 20GB free space
- **OS**: macOS 10.15+, Ubuntu 18.04+, Windows 10+

### Recommended System Requirements
- **RAM**: 16GB+
- **CPU**: 8+ cores
- **Disk**: 50GB+ SSD
- **Network**: Stable internet for image pulls

## Advanced Configuration

### Custom Cluster Settings
Edit `scripts/dev/setup-k3d.sh` to modify:
- Cluster name
- Port mappings
- Number of agents
- k3s arguments
- Additional features

### Volume Mounts
```yaml
# Custom docker-compose.yml volumes
volumes:
  - ./deploy/k8s:/k8s:ro
  - ./examples:/examples:ro
  - ~/.aws:/root/.aws:ro  # For cloud integration
```

### Network Configuration
```bash
# Expose additional ports
k3d cluster create loopstacks-dev \
  --port "9000:9000@loadbalancer" \  # Grafana
  --port "3001:3001@loadbalancer"    # Additional service
```

## Next Steps

1. **Deploy LoopStacks Platform**: `make dev-k8s`
2. **Create Your First Agent**: See `examples/` directory
3. **Access Web Console**: http://localhost:3000
4. **Read the Documentation**: `/docs` directory
5. **Join the Community**: GitHub Discussions

---

For more information, see:
- [Main README](README.md)
- [Development Guide](DEV.md)
- [Contributing Guidelines](CONTRIBUTING.md)