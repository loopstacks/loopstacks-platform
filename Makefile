.PHONY: help deps build test dev deploy clean run-operator run-control-plane run-console
.DEFAULT_GOAL := help

# Project metadata
PROJECT_NAME := loopstacks-platform
VERSION := $(shell git describe --tags --dirty --always 2>/dev/null || echo "dev")
BUILD_DATE := $(shell date -u +"%Y-%m-%dT%H:%M:%SZ")
COMMIT_SHA := $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")

# Go settings
GO_VERSION := 1.21
GOOS := $(shell go env GOOS 2>/dev/null || echo "linux")
GOARCH := $(shell go env GOARCH 2>/dev/null || echo "amd64")

# Docker settings
DOCKER_REGISTRY ?= loopstacks
OPERATOR_IMAGE := $(DOCKER_REGISTRY)/operator:$(VERSION)
CONTROL_PLANE_IMAGE := $(DOCKER_REGISTRY)/control-plane:$(VERSION)
AGENT_RUNTIME_IMAGE := $(DOCKER_REGISTRY)/universal-runtime:$(VERSION)

# Kubernetes settings
NAMESPACE ?= loopstacks-system
KUBECONFIG ?= ~/.kube/config

help: ## Show this help message
	@echo "LoopStacks Platform - AI Agent Orchestration for Kubernetes"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

deps: ## Install development dependencies
	@echo "Installing development dependencies..."
	@echo "Checking Go installation..."
	@which go >/dev/null || (echo "Go not found. Please install Go $(GO_VERSION)+" && exit 1)
	@echo "Checking Node.js installation..."
	@which node >/dev/null || (echo "Node.js not found. Please install Node.js 18+" && exit 1)
	@echo "Checking Docker installation..."
	@which docker >/dev/null || (echo "Docker not found. Please install Docker" && exit 1)
	@echo "Checking kubectl installation..."
	@which kubectl >/dev/null || (echo "kubectl not found. Please install kubectl" && exit 1)
	@echo "Installing Go dependencies for operator..."
	@cd operator && go mod tidy
	@echo "Installing Node.js dependencies for control plane..."
	@cd control-plane && npm install
	@echo "Dependencies installed successfully!"

build: build-operator build-control-plane ## Build all components

build-operator: ## Build the Kubernetes operator
	@echo "Building operator..."
	@cd operator && CGO_ENABLED=0 GOOS=$(GOOS) GOARCH=$(GOARCH) go build \
		-ldflags "-X main.version=$(VERSION) -X main.buildDate=$(BUILD_DATE) -X main.commitSHA=$(COMMIT_SHA)" \
		-o bin/operator ./cmd/operator

build-control-plane: ## Build the control plane API server
	@echo "Building control plane..."
	@cd control-plane && npm run build


docker-build: ## Build Docker images for all components
	@echo "Building Docker images..."
	@docker build -t $(OPERATOR_IMAGE) -f operator/Dockerfile operator/
	@docker build -t $(CONTROL_PLANE_IMAGE) -f control-plane/Dockerfile control-plane/

docker-push: docker-build ## Build and push Docker images
	@echo "Pushing Docker images..."
	@docker push $(OPERATOR_IMAGE)
	@docker push $(CONTROL_PLANE_IMAGE)

test: test-operator test-control-plane ## Run all tests

test-operator: ## Run operator tests
	@echo "Running operator tests..."
	@cd operator && go test -v ./...

test-control-plane: ## Run control plane tests
	@echo "Running control plane tests..."
	@cd control-plane && npm test

test-integration: ## Run integration tests
	@echo "Running integration tests..."
	@cd test && go test -v ./...

dev: ## Start local development environment
	@echo "Starting development environment..."
	@echo "This will start:"
	@echo "  - Operator (port 8081)"
	@echo "  - Control Plane API (port 8080)"
	@echo "  - Web Console (port 3000)"
	@echo ""
	@echo "Starting in background processes..."
	@$(MAKE) run-operator &
	@$(MAKE) run-control-plane &
	@$(MAKE) run-console &
	@echo "Development environment started! Check ports 8080, 8081, and 3000"

run-operator: ## Run the operator locally
	@echo "Starting operator locally..."
	@cd operator && go run ./cmd/operator --kubeconfig=$(KUBECONFIG) --dev-mode

run-control-plane: ## Run the control plane API locally
	@echo "Starting control plane API locally..."
	@cd control-plane && npm run dev

run-console: ## Run the web console locally
	@echo "Starting web console locally..."
	@cd control-plane/console && npm run dev

deploy: docker-build ## Deploy to Kubernetes cluster
	@echo "Deploying LoopStacks platform to Kubernetes..."
	@kubectl create namespace $(NAMESPACE) --dry-run=client -o yaml | kubectl apply -f -
	@kubectl apply -f deploy/base/ -n $(NAMESPACE)
	@echo "Deployment complete!"

deploy-dev: ## Deploy development version to Kubernetes
	@echo "Deploying development version..."
	@kubectl create namespace $(NAMESPACE) --dry-run=client -o yaml | kubectl apply -f -
	@kubectl apply -f deploy/dev/ -n $(NAMESPACE)

undeploy: ## Remove LoopStacks from Kubernetes cluster
	@echo "Removing LoopStacks platform from Kubernetes..."
	@kubectl delete -f deploy/base/ -n $(NAMESPACE) --ignore-not-found=true
	@kubectl delete namespace $(NAMESPACE) --ignore-not-found=true

logs: ## View logs from deployed components
	@echo "Streaming logs from LoopStacks components..."
	@kubectl logs -f -l app.kubernetes.io/name=loopstacks -n $(NAMESPACE) --all-containers=true

clean: ## Clean build artifacts
	@echo "Cleaning build artifacts..."
	@rm -rf operator/bin/
	@rm -rf control-plane/dist/
	@rm -rf control-plane/node_modules/.cache/
	@docker system prune -f

fmt: ## Format code
	@echo "Formatting code..."
	@cd operator && go fmt ./...
	@cd control-plane && npm run format

lint: ## Lint code
	@echo "Linting code..."
	@cd operator && golangci-lint run
	@cd control-plane && npm run lint

generate: ## Generate code (CRDs, clients, etc.)
	@echo "Generating code..."
	@cd operator && go generate ./...

examples: ## Deploy example agents and workflows
	@echo "Deploying example agents and workflows..."
	@kubectl apply -f examples/ -n $(NAMESPACE)

version: ## Show version information
	@echo "LoopStacks Platform"
	@echo "Version: $(VERSION)"
	@echo "Build Date: $(BUILD_DATE)"
	@echo "Commit SHA: $(COMMIT_SHA)"
	@echo "Go Version: $(shell go version 2>/dev/null || echo 'Not installed')"
	@echo "Node Version: $(shell node --version 2>/dev/null || echo 'Not installed')"
	@echo "Docker Version: $(shell docker --version 2>/dev/null || echo 'Not installed')"
	@echo "kubectl Version: $(shell kubectl version --client --short 2>/dev/null || echo 'Not installed')"