.PHONY: help deps build test dev deploy clean run-operator run-control-plane run-console dev-setup dev-mock dev-k8s dev-clean dev-dispose dev-reset dev-volumes dev-services dev-services-stop
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
	@echo "Installing Node.js dependencies for web console..."
	@cd web-console && npm install
	@echo "Dependencies installed successfully!"

build: build-operator build-control-plane build-web-console ## Build all components

build-operator: ## Build the Kubernetes operator
	@echo "Building operator..."
	@cd operator && CGO_ENABLED=0 GOOS=$(GOOS) GOARCH=$(GOARCH) go build \
		-ldflags "-X main.version=$(VERSION) -X main.buildDate=$(BUILD_DATE) -X main.commitSHA=$(COMMIT_SHA)" \
		-o bin/operator ./cmd/operator

build-control-plane: ## Build the control plane API server
	@echo "Building control plane..."
	@cd control-plane && npm run build

build-web-console: ## Build the web console
	@echo "Building web console..."
	@cd web-console && npm run build


docker-build: ## Build Docker images for all components
	@echo "Building Docker images..."
	@docker build -t $(OPERATOR_IMAGE) -f operator/Dockerfile operator/
	@docker build -t $(CONTROL_PLANE_IMAGE) -f control-plane/Dockerfile control-plane/

docker-push: docker-build ## Build and push Docker images
	@echo "Pushing Docker images..."
	@docker push $(OPERATOR_IMAGE)
	@docker push $(CONTROL_PLANE_IMAGE)

test: test-operator test-control-plane test-web-console ## Run all tests

test-operator: ## Run operator tests
	@echo "Running operator tests..."
	@cd operator && go test -v ./...

test-control-plane: ## Run control plane tests
	@echo "Running control plane tests..."
	@cd control-plane && npm test

test-web-console: ## Run web console tests
	@echo "Running web console tests..."
	@cd web-console && npm test

test-integration: ## Run integration tests
	@echo "Running integration tests..."
	@cd test && go test -v ./...

dev: dev-mock ## Start local development environment (alias for dev-mock)

dev-setup: ## Set up development environment (kind cluster + CRDs)
	@echo "Setting up development environment..."
	@./scripts/dev/dev-setup.sh

dev-k3d: ## Set up k3d cluster for local development
	@echo "Setting up k3d cluster..."
	@./scripts/dev/setup-k3d.sh

dev-services: ## Start development services (Redis, PostgreSQL, and k3d)
	@echo "Starting development services..."
	@cd deploy/dev && docker-compose up -d
	@echo "Development services started!"
	@echo "  - Redis: localhost:6379"
	@echo "  - PostgreSQL: localhost:5432 (db: loopstacks, user: loopstacks, pass: dev_password)"
	@echo "  - k3d cluster: loopstacks-dev (API: localhost:6443)"

dev-services-stop: ## Stop development services
	@echo "Stopping development services..."
	@cd deploy/dev && docker-compose down
	@echo "Development services stopped!"

dev-mock: ## Start development environment with mock mode (no Kubernetes required)
	@echo "Starting development environment in mock mode..."
	@echo "Cleaning up any existing processes..."
	@pkill -f "npm run dev" || true
	@pkill -f "tsx src/index.ts" || true
	@pkill -f "operator" || true
	@lsof -ti:8080 | xargs kill -9 2>/dev/null || true
	@lsof -ti:3000 | xargs kill -9 2>/dev/null || true
	@lsof -ti:5173 | xargs kill -9 2>/dev/null || true
	@echo "This will start:"
	@echo "  - Development services (Redis and PostgreSQL)"
	@echo "  - Control Plane API with mock data (port 8080)"
	@echo "  - Web Console (port 3000)"
	@echo ""
	@echo "Starting development services..."
	@$(MAKE) dev-services
	@echo "Waiting for Redis to be ready..."
	@sleep 5
	@docker exec loopstacks-redis-dev redis-cli ping || (echo "Redis not ready, restarting..." && $(MAKE) dev-services-stop && $(MAKE) dev-services && sleep 5)
	@echo "Setting up environment..."
	@cp control-plane/.env.example control-plane/.env 2>/dev/null || true
	@sed -i '' 's/MOCK_MODE=.*/MOCK_MODE=true/' control-plane/.env 2>/dev/null || echo "MOCK_MODE=true" >> control-plane/.env
	@echo "Starting services in background..."
	@$(MAKE) run-control-plane &
	@$(MAKE) run-console &
	@echo ""
	@echo "Development environment started in mock mode!"
	@echo "  - Redis: localhost:6379"
	@echo "  - PostgreSQL: localhost:5432"
	@echo "  - Control Plane API: http://localhost:8080"
	@echo "  - Web Console: http://localhost:3000"
	@echo "  - Health Check: http://localhost:8080/health"

dev-k8s: ## Start development environment with Kubernetes operator
	@echo "Starting development environment with Kubernetes..."
	@echo "Cleaning up any existing processes..."
	@pkill -f "npm run dev" || true
	@pkill -f "tsx src/index.ts" || true
	@pkill -f "operator" || true
	@lsof -ti:8080 | xargs kill -9 2>/dev/null || true
	@lsof -ti:3000 | xargs kill -9 2>/dev/null || true
	@lsof -ti:5173 | xargs kill -9 2>/dev/null || true
	@lsof -ti:9081 | xargs kill -9 2>/dev/null || true
	@echo "This will start:"
	@echo "  - Development services (Redis and PostgreSQL)"
	@echo "  - Operator (port 9081)"
	@echo "  - Control Plane API (port 8080)"
	@echo "  - Web Console (port 3000)"
	@echo ""
	@echo "Starting development services..."
	@$(MAKE) dev-services
	@echo "Waiting for Redis to be ready..."
	@sleep 5
	@docker exec loopstacks-redis-dev redis-cli ping || (echo "Redis not ready, restarting..." && $(MAKE) dev-services-stop && $(MAKE) dev-services && sleep 5)
	@echo "Setting up environment..."
	@cp control-plane/.env.example control-plane/.env 2>/dev/null || true
	@sed -i '' 's/MOCK_MODE=.*/MOCK_MODE=false/' control-plane/.env 2>/dev/null || echo "MOCK_MODE=false" >> control-plane/.env
	@echo "Starting services in background..."
	@$(MAKE) run-operator &
	@$(MAKE) run-control-plane &
	@$(MAKE) run-console &
	@echo ""
	@echo "Development environment started!"
	@echo "  - Redis: localhost:6379"
	@echo "  - PostgreSQL: localhost:5432"
	@echo "  - Operator: port 9081"
	@echo "  - Control Plane API: http://localhost:8080"
	@echo "  - Web Console: http://localhost:3000"
	@echo "  - Health Check: http://localhost:8080/health"

dev-clean: ## Clean up development environment (preserves volumes)
	@echo "Cleaning up development environment..."
	@pkill -f "npm run dev" || true
	@pkill -f "tsx src/index.ts" || true
	@pkill -f "operator" || true
	@$(MAKE) dev-services-stop || true
	@k3d cluster delete loopstacks-dev || true
	@echo "Development environment cleaned up! (volumes preserved)"

dev-dispose: ## Completely remove development environment including all data
	@echo "⚠️  WARNING: This will permanently delete ALL development data!"
	@echo "This includes Redis sessions, PostgreSQL databases, and k3d cluster state."
	@read -p "Are you sure? [y/N] " -n 1 -r && echo && [[ $$REPLY =~ ^[Yy]$$ ]] || (echo "Cancelled." && exit 1)
	@echo "Stopping all services and removing data..."
	@pkill -f "npm run dev" || true
	@pkill -f "tsx src/index.ts" || true
	@pkill -f "operator" || true
	@cd deploy/dev && docker-compose down -v || true
	@k3d cluster delete loopstacks-dev || true
	@docker volume rm dev_redis_data dev_postgres_data k3d-loopstacks-dev-images || true
	@docker container prune -f
	@echo "Development environment completely removed!"

dev-reset: ## Reset development environment (clean + fresh start)
	@echo "Resetting development environment..."
	@$(MAKE) dev-dispose
	@echo "Starting fresh development environment..."
	@$(MAKE) dev-services
	@echo "Development environment reset complete!"

dev-volumes: ## Show development volumes and their sizes
	@echo "Development Environment Volumes:"
	@echo "================================="
	@docker volume ls --filter name=dev_ --filter name=k3d-loopstacks
	@echo ""
	@echo "Volume Details:"
	@echo "---------------"
	@docker system df -v | grep -E "(dev_|k3d-loopstacks)" || echo "No matching volumes found"

run-operator: ## Run the operator locally
	@echo "Starting operator locally..."
	@cd operator && go run ./cmd/operator --kubeconfig=$(KUBECONFIG) --dev-mode

run-control-plane: ## Run the control plane API locally
	@echo "Starting control plane API locally..."
	@cd control-plane && npm run dev

run-console: ## Run the web console locally
	@echo "Starting web console locally..."
	@cd web-console && npm run dev

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
	@rm -rf web-console/dist/
	@rm -rf web-console/node_modules/.cache/
	@docker system prune -f

fmt: ## Format code
	@echo "Formatting code..."
	@cd operator && go fmt ./...
	@cd control-plane && npm run format
	@cd web-console && npm run lint

lint: ## Lint code
	@echo "Linting code..."
	@cd operator && golangci-lint run
	@cd control-plane && npm run lint
	@cd web-console && npm run lint

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