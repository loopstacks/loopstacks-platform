# Loop Stacks Platform 

**Recursive AI Agent Orchestration for Kubernetes**

LoopStacks provides a Kubernetes-native platform for orchestrating AI agents through recursive, federated, and democratic coordination patterns. Instead of hierarchical supervision that breaks down at scale, LoopStacks enables agents to self-organize and coordinate through broadcast loops that can span the internet using a transparent, realm-based governance and routing model.

> **Status**: Early Development — Core MVP in progress

---

## What is LoopStacks?

LoopStacks solves the AI agent coordination problem with a simple pattern that enables **complex, dynamic orchestration across domains**, creating a new reality of AI agent integration:

1. **Loop Broadcast** – announce work that needs to be done  
2. **Agent Self-Selection** – agents choose whether they can help  
3. **Parallel Execution** – selected agents work together  
4. **Recursive Spawning** – complex work spawns new loops  

This eliminates supervisor bottlenecks and allows natural scaling to thousands of coordinated agents. Tasks can recurse dynamically, pause or interrupt as needed, and always leave room to bring a human into the loop.

---

## Core Concepts

- **Agent**  
  An agent is similar to a Kubernetes Custom Resource Definition (CRD). Agents are deployed into LoopStacks as packaged artifacts. Agent design patterns enforce best practices and prevent single-agent failure. Stateless agents, like intent parsers, scale horizontally, while other agents may be instantiated through application code or by a human operator.  

  Agent state is stored in a shared resource, enabling high availability and scalability. Agents and their interfaces are designed to be developer-friendly, minimal, and composable on open standards — making dynamic agent systems both possible and extensible.  

- **AgentInstance**  
  A running deployment of an Agent in a specific Realm.  

- **Realm**  
  A realm is a space of existence. Realms are recursive — they might represent an organization, a division, an individual, a family, or a school. Realms can contain other realms. Special **edge realms** act as authorities that govern sub-realms and decide how to connect with other edge realms across the internet. They rely on the same simple routing protocol used across domains, with clear policies and governance.  

- **LoopStack**  
  A LoopStack is a defined workflow of logic that contains a series of orchestration loop frames. Agents across realms (if governance allows) can participate in a loop based on its type. Any agent within a loop can apply a loop lock to ensure execution within a reasonable time and can also spawn new LoopStacks dynamically. This democratic, self-directed contribution model is what makes LoopStacks unique.  

- **Loop**  
  A loop is an execution instance within a LoopStack. It has a unique namespace and consists of multiple iterations based on its schema. Agents participate in the loop’s lifecycle by broadcasting their capabilities and responding to broadcasts. Like a software call stack, recursion naturally emerges — when an agent spawns not a subroutine but a sub-LoopStack.  


  ## Architecture

  ```
  ┌─────────────────────────────────────────────────────────────┐
  │                    LoopStacks Platform                      │
  ├─────────────────────────────────────────────────────────────┤
  │ Control Plane (TypeScript)          │ Agent Operator (Go)   │
  │ ├── REST API (/loopstacks/v1)       │ ├── Agent CRDs        │
  │ ├── PostgreSQL backend              │ ├── Realm CRDs        │
  │ ├── WebSocket events                │ ├── LoopStack CRDs    │
  │ └── Web Console                     │ └── K8s Controllers   │
  ├─────────────────────────────────────────────────────────────┤
  │                     Kubernetes                              │
  │ ├── AgentInstance Deployments                               │
  │ ├── Redis (agent coordination)                              │
  │ └── Auto-provisioned storage                                │
  └─────────────────────────────────────────────────────────────┘
  ```

  ## Quick Start

  > **Prerequisites**: Kubernetes cluster, kubectl, Docker

  ### 1. Deploy LoopStacks Platform

  ```bash
  # Clone the repository
  git clone https://github.com/loopstacks/loopstacks-platform
  cd loopstacks-platform

  # Deploy platform components
  make deploy
  ```

  ### 2. Create Your First Agent

  ```yaml
  # examples/sentiment-agent.yaml
  apiVersion: loopstacks.io/v1
  kind: Agent
  metadata:
    name: sentiment-analyzer
  spec:
    runtime:
      image: loopstacks/universal-runtime:latest
      language: typescript
    capabilities:
      - sentiment-analysis
    schema:
      input:
        type: object
        properties:
          text: {type: string}
      output:
        type: object
        properties:
          sentiment: {enum: [positive, negative, neutral]}
          confidence: {type: number}
  ```

  ### 3. Deploy Agent Instance

  ```bash
  # Deploy the agent
  kubectl apply -f examples/sentiment-agent.yaml

  # Create an instance in your realm
  kubectl apply -f - <<EOF
  apiVersion: loopstacks.io/v1
  kind: AgentInstance
  metadata:
    name: my-sentiment-analyzer
  spec:
    agent: sentiment-analyzer
    realm: default-realm
    replicas: 1
  EOF
  ```

  ### 4. Run a Simple Loop

  ```bash
  # Execute a sentiment analysis loop
  curl -X POST http://localhost:8080/loopstacks/v1/executions \
    -H "Content-Type: application/json" \
    -d '{
      "loopstack": "sentiment-analysis",
      "input": {"text": "I love this new AI orchestration platform!"}
    }'
  ```

  ## Repository Structure

  ```
  loopstacks-platform/
  ├── operator/           # Kubernetes operator (Go)
  ├── control-plane/      # API server and web console (TypeScript)
  ├── agent-runtime/      # Universal agent container runtime
  ├── examples/           # Sample agents and workflows
  ├── deploy/            # Kubernetes deployment manifests
  ├── docs/              # Documentation
  ├── hack/              # Development and build scripts
  └── test/              # Integration tests
  ```

  ## Development

  ### Prerequisites

  - Go 1.21+
  - Node.js 18+
  - Docker
  - Kubernetes cluster (local or remote)
  - kubectl configured

  ### Development Setup

  The platform now supports two development modes for different use cases:

  #### Option 1: Mock Mode (Recommended for UI Development)
  No Kubernetes required - uses mock data service with sample agents, loopstacks, and realms. Perfect for UI/frontend development with faster startup and iteration.

  ```bash
  # Quick start for immediate UI development
  make deps && make dev-mock
  ```

  #### Option 2: Full Kubernetes Mode (For Operator Development)
  Uses local kind cluster with real operator deployment for full integration testing.

  ```bash
  # Full operator testing setup
  make deps && make dev-setup && make dev-k8s
  ```

  #### Enhanced Development Features

  1. **Web Console Integration**: Added web-console to main build system with dependencies installation, test, lint, and clean targets

  2. **Development Infrastructure**:
    - `scripts/dev/dev-setup.sh` - Automated kind cluster setup
    - `deploy/dev/` - Development K8s configurations
    - Mock service with comprehensive sample data
    - Environment configuration with `.env.example`

  3. **New Makefile Targets**:
    ```bash
    make dev-setup    # Setup kind cluster
    make dev-mock     # Start mock mode development
    make dev-k8s      # Start with Kubernetes
    make dev-clean    # Clean up everything
    make build        # Build all components including web-console
    make test         # Run all tests
    ```

  ### Running Components Locally

  ```bash
  # Start the operator (requires kubeconfig)
  make run-operator

  # Start the control plane API
  make run-control-plane

  # Start the web console
  make run-console
  ```

  ## Examples

  The `examples/` directory contains:

  - **Basic Agents**: Sentiment analysis, intent classification, response generation
  - **LoopStacks**: Customer service workflow, content moderation pipeline
  - **Multi-Agent Coordination**: Collaborative document analysis, consensus building
  - **Cross-Realm Communication**: Federated AI workflows

  ## Current Limitations

  This is early-stage software. Current limitations include:

  - Single Kubernetes cluster only (multi-cluster coming soon)
  - Limited agent runtime languages (TypeScript, Python planned)
  - Basic web console (advanced features in development)
  - No persistent agent state (stateless agents only)
  - Alpha API (breaking changes possible)

  ## Roadmap

  **Near Term (Next 3 months)**
  - [ ] Python agent runtime support
  - [ ] Enhanced web console with real-time monitoring
  - [ ] Agent marketplace integration
  - [ ] Cross-realm federation (local clusters)
  - [ ] Performance optimization

  **Medium Term (3-6 months)**
  - [ ] Multi-cluster federation
  - [ ] Internet-scale realm bridging
  - [ ] Advanced security and RBAC
  - [ ] Enterprise governance features
  - [ ] Agent state management

  **Long Term (6+ months)**
  - [ ] Global agent marketplace
  - [ ] Serverless agent execution
  - [ ] Advanced analytics and insights
  - [ ] Multi-cloud deployment
  - [ ] Standards certification program

  ## Contributing

  We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

  ### Ways to Contribute

  - **Code**: Submit PRs for bug fixes or new features
  - **Documentation**: Improve docs, add examples, write tutorials
  - **Testing**: Add test cases, report bugs, test on different environments
  - **Community**: Help other users, answer questions, share use cases

  ## Community

  - **Website**: [loopstacks.io](https://loopstacks.io)
  - **Documentation**: [docs.loopstacks.io](https://docs.loopstacks.io)
  - **Discussions**: [GitHub Discussions](https://github.com/loopstacks/loopstacks-platform/discussions)
  - **Issues**: [GitHub Issues](https://github.com/loopstacks/loopstacks-platform/issues)

  ## License

  Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.

  ## Security

  To report security vulnerabilities, please email security@loopstacks.io. Do not open GitHub issues for security-related concerns.

  ---

  **LoopStacks** is developed by [Krebsnet](https://krebsnet.com) and the open source community.

  Built with ❤️ for the future of AI agent coordination.