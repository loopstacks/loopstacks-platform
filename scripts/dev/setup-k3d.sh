#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CLUSTER_NAME="loopstacks-dev"
K3D_VERSION="v5.6.0"
API_PORT="6443"
LB_PORT_HTTP="8081"
LB_PORT_HTTPS="8443"
AGENTS=2

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_prerequisites() {
    print_header "Checking Prerequisites"

    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is required but not installed"
        exit 1
    fi
    print_success "Docker found: $(docker --version | cut -d' ' -f3 | cut -d',' -f1)"

    # Check if Docker is running
    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker Desktop"
        exit 1
    fi
    print_success "Docker daemon is running"
}

install_k3d() {
    print_header "Installing k3d"

    if command -v k3d &> /dev/null; then
        local current_version=$(k3d version | grep k3d | cut -d' ' -f3)
        print_success "k3d already installed: $current_version"
        return
    fi

    echo "Installing k3d $K3D_VERSION..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install k3d
        else
            curl -s https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash
        fi
    else
        # Linux
        curl -s https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash
    fi

    print_success "k3d installed successfully"
}

create_cluster() {
    print_header "Creating k3d Cluster"

    # Check if cluster already exists
    if k3d cluster list | grep -q "$CLUSTER_NAME"; then
        print_warning "Cluster '$CLUSTER_NAME' already exists"
        read -p "Delete and recreate? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            k3d cluster delete "$CLUSTER_NAME"
            print_success "Deleted existing cluster"
        else
            print_success "Using existing cluster"
            return
        fi
    fi

    echo "Creating cluster '$CLUSTER_NAME'..."
    k3d cluster create "$CLUSTER_NAME" \
        --api-port "$API_PORT" \
        --port "$LB_PORT_HTTP:80@loadbalancer" \
        --port "$LB_PORT_HTTPS:443@loadbalancer" \
        --agents "$AGENTS" \
        --k3s-arg "--disable=traefik@server:*" \
        --wait

    print_success "Cluster created successfully"
}

setup_kubeconfig() {
    print_header "Setting up kubeconfig"

    # Get kubeconfig
    k3d kubeconfig merge "$CLUSTER_NAME" --kubeconfig-switch-context

    # Verify connection
    if kubectl cluster-info &> /dev/null; then
        print_success "kubectl configured and connected"
        kubectl cluster-info
    else
        print_error "Failed to connect to cluster"
        exit 1
    fi
}

install_nginx_ingress() {
    print_header "Installing NGINX Ingress Controller"

    # Install NGINX Ingress
    kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml

    # Wait for it to be ready
    echo "Waiting for NGINX Ingress to be ready..."
    kubectl wait --namespace ingress-nginx \
        --for=condition=ready pod \
        --selector=app.kubernetes.io/component=controller \
        --timeout=300s

    print_success "NGINX Ingress Controller installed"
}

setup_loopstacks_namespace() {
    print_header "Setting up LoopStacks namespace"

    kubectl create namespace loopstacks-system --dry-run=client -o yaml | kubectl apply -f -
    kubectl create namespace loopstacks-dev --dry-run=client -o yaml | kubectl apply -f -

    print_success "LoopStacks namespaces created"
}

print_cluster_info() {
    print_header "Cluster Information"

    echo -e "${GREEN}🎉 k3d cluster setup complete!${NC}"
    echo ""
    echo "Cluster Details:"
    echo "  • Name: $CLUSTER_NAME"
    echo "  • API Server: https://localhost:$API_PORT"
    echo "  • Load Balancer HTTP: http://localhost:$LB_PORT_HTTP"
    echo "  • Load Balancer HTTPS: https://localhost:$LB_PORT_HTTPS"
    echo "  • Agents: $AGENTS"
    echo ""
    echo "Useful Commands:"
    echo "  • View cluster: k3d cluster list"
    echo "  • Stop cluster: k3d cluster stop $CLUSTER_NAME"
    echo "  • Start cluster: k3d cluster start $CLUSTER_NAME"
    echo "  • Delete cluster: k3d cluster delete $CLUSTER_NAME"
    echo "  • View nodes: kubectl get nodes"
    echo "  • View pods: kubectl get pods -A"
    echo ""
    echo "Next Steps:"
    echo "  1. Run 'make dev-k8s' to start the LoopStacks platform"
    echo "  2. Deploy CRDs: kubectl apply -f deploy/base/crds/"
    echo "  3. Access web console at http://localhost:3000"
}

main() {
    echo -e "${BLUE}"
    echo "┌─────────────────────────────────────────────────────────────┐"
    echo "│                 LoopStacks k3d Setup                       │"
    echo "│         Local Kubernetes Cluster for Development           │"
    echo "└─────────────────────────────────────────────────────────────┘"
    echo -e "${NC}"

    check_prerequisites
    install_k3d
    create_cluster
    setup_kubeconfig
    install_nginx_ingress
    setup_loopstacks_namespace
    print_cluster_info
}

# Handle script interruption
trap 'echo -e "\n${RED}Setup interrupted${NC}"; exit 1' INT

# Run main function
main "$@"