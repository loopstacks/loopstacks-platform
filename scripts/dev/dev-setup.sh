#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
KIND_CLUSTER_NAME="loopstacks-dev"
NAMESPACE="loopstacks-system"

print_status() {
    echo -e "${BLUE}==> $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

install_dependency() {
    local dep=$1
    local install_cmd=$2

    print_status "Installing $dep..."
    if command -v brew &> /dev/null; then
        eval "$install_cmd"
        print_success "$dep installed successfully"
    else
        print_error "Homebrew is not installed. Please install $dep manually or install Homebrew first"
        exit 1
    fi
}

check_and_install_dependencies() {
    print_status "Checking and installing dependencies..."

    if ! command -v kind &> /dev/null; then
        print_warning "kind is not installed. Installing via Homebrew..."
        install_dependency "kind" "brew install kind"
    fi

    if ! command -v kubectl &> /dev/null; then
        print_warning "kubectl is not installed. Installing via Homebrew..."
        install_dependency "kubectl" "brew install kubectl"
    fi

    if ! command -v go &> /dev/null; then
        print_warning "Go is not installed. Installing via Homebrew..."
        install_dependency "Go" "brew install go"
    fi

    if ! command -v node &> /dev/null; then
        print_warning "Node.js is not installed. Installing via Homebrew..."
        install_dependency "Node.js" "brew install node"
    fi

    print_success "All dependencies are installed"
}

setup_kind_cluster() {
    print_status "Setting up kind cluster..."

    # Check if cluster already exists
    if kind get clusters | grep -q "^${KIND_CLUSTER_NAME}$"; then
        print_warning "Kind cluster '${KIND_CLUSTER_NAME}' already exists"
        read -p "Do you want to recreate it? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_status "Deleting existing cluster..."
            kind delete cluster --name "${KIND_CLUSTER_NAME}"
        else
            print_status "Using existing cluster"
            kubectl cluster-info --context "kind-${KIND_CLUSTER_NAME}"
            return 0
        fi
    fi

    print_status "Creating kind cluster..."
    kind create cluster --name "${KIND_CLUSTER_NAME}" --config deploy/dev/kind-cluster.yaml

    # Wait for cluster to be ready
    print_status "Waiting for cluster to be ready..."
    kubectl wait --for=condition=Ready nodes --all --timeout=300s --context "kind-${KIND_CLUSTER_NAME}"

    print_success "Kind cluster is ready"
}

setup_namespace() {
    print_status "Creating namespace..."
    kubectl apply -f deploy/dev/namespace.yaml --context "kind-${KIND_CLUSTER_NAME}"
    print_success "Namespace created"
}

install_crds() {
    print_status "Installing CRDs..."
    kubectl apply -f deploy/base/ --context "kind-${KIND_CLUSTER_NAME}"
    print_success "CRDs installed"
}

build_and_install_deps() {
    print_status "Installing dependencies..."
    make deps
    print_success "Dependencies installed"
}

usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --skip-cluster    Skip kind cluster setup"
    echo "  --skip-deps       Skip dependency installation"
    echo "  --help           Show this help message"
    echo ""
    echo "This script sets up a local development environment for LoopStacks Platform"
}

main() {
    local skip_cluster=false
    local skip_deps=false

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-cluster)
                skip_cluster=true
                shift
                ;;
            --skip-deps)
                skip_deps=true
                shift
                ;;
            --help)
                usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
    done

    print_status "Setting up LoopStacks development environment..."

    check_and_install_dependencies

    if [ "$skip_deps" = false ]; then
        build_and_install_deps
    fi

    if [ "$skip_cluster" = false ]; then
        setup_kind_cluster
        setup_namespace
        install_crds
    fi

    print_success "Development environment setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Start the operator: make run-operator"
    echo "2. Start the control plane: make run-control-plane"
    echo "3. Start the web console: make run-console"
    echo ""
    echo "Or start everything at once: make dev"
    echo ""
    echo "Cluster context: kind-${KIND_CLUSTER_NAME}"
    echo "Namespace: ${NAMESPACE}"
}

main "$@"