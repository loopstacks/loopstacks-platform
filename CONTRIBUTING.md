# Contributing to LoopStacks

Thank you for your interest in contributing to LoopStacks! We welcome contributions from the community and are excited to work with you.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Community](#community)

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct. Please report unacceptable behavior to [conduct@loopstacks.io](mailto:conduct@loopstacks.io).

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- Go 1.21+
- Node.js 18+
- Docker
- Kubernetes cluster (local or remote)
- kubectl configured
- Git

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/loopstacks-platform.git
   cd loopstacks-platform
   ```
3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/loopstacks/loopstacks-platform.git
   ```

## Development Setup

1. **Install dependencies:**
   ```bash
   make deps
   ```

2. **Start development environment:**
   ```bash
   make dev
   ```

3. **Run tests:**
   ```bash
   make test
   ```

### Project Structure

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

## Contributing Guidelines

### Types of Contributions

We welcome several types of contributions:

1. **Bug Reports** - Help us identify and fix issues
2. **Feature Requests** - Suggest new capabilities
3. **Code Contributions** - Fix bugs or implement features
4. **Documentation** - Improve our docs and examples
5. **Testing** - Add test cases or test on different environments

### Coding Standards

#### Go Code (Operator)

- Follow standard Go formatting (`gofmt`)
- Use meaningful variable and function names
- Add comments for public functions and complex logic
- Include unit tests for new functionality
- Follow Kubernetes controller patterns

#### TypeScript Code (Control Plane)

- Use TypeScript strict mode
- Follow ESLint configuration
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Include unit tests for new functionality

#### General Guidelines

- Keep commits small and focused
- Write clear commit messages
- Update documentation for user-facing changes
- Add or update tests for new features

### Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

Examples:
```
feat(operator): add agent validation webhook
fix(control-plane): resolve WebSocket connection issues
docs: update getting started guide
```

## Pull Request Process

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes:**
   - Write code following our coding standards
   - Add or update tests
   - Update documentation if needed

3. **Test your changes:**
   ```bash
   make test
   make lint
   ```

4. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat: description of your change"
   ```

5. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request:**
   - Go to GitHub and create a PR from your branch
   - Fill out the PR template completely
   - Link any related issues
   - Request review from maintainers

### PR Requirements

- [ ] All tests pass
- [ ] Code follows project coding standards
- [ ] Documentation is updated (if needed)
- [ ] PR description clearly explains the change
- [ ] Related issues are linked
- [ ] Breaking changes are documented

## Issue Reporting

### Bug Reports

When reporting bugs, please include:

- **Summary:** Brief description of the issue
- **Environment:** OS, Go version, Node.js version, Kubernetes version
- **Steps to reproduce:** Detailed steps to reproduce the issue
- **Expected behavior:** What should happen
- **Actual behavior:** What actually happens
- **Logs/Screenshots:** Any relevant logs or screenshots

### Feature Requests

When requesting features, please include:

- **Summary:** Brief description of the feature
- **Motivation:** Why this feature would be valuable
- **Detailed description:** How the feature should work
- **Examples:** Usage examples or mockups
- **Alternatives:** Alternative solutions you've considered

## Development Workflow

### Setting up for Development

1. **Start required services:**
   ```bash
   # Start a local Kubernetes cluster (minikube, kind, etc.)
   minikube start

   # Start Redis (for development)
   docker run -d --name redis -p 6379:6379 redis:alpine
   ```

2. **Deploy CRDs:**
   ```bash
   kubectl apply -f deploy/base/
   ```

3. **Run operator locally:**
   ```bash
   make run-operator
   ```

4. **Run control plane locally:**
   ```bash
   make run-control-plane
   ```

### Testing

- **Unit tests:** `make test`
- **Integration tests:** `make test-integration`
- **Linting:** `make lint`
- **Format code:** `make fmt`

### Building

- **Build all components:** `make build`
- **Build Docker images:** `make docker-build`
- **Build and push:** `make docker-push`

## Community

### Getting Help

- **GitHub Discussions:** Ask questions and share ideas
- **Issues:** Report bugs and request features
- **Documentation:** Check our docs at [docs.loopstacks.io](https://docs.loopstacks.io)

### Communication Channels

- **GitHub Issues:** Bug reports and feature requests
- **GitHub Discussions:** General questions and community discussions
- **Email:** [community@loopstacks.io](mailto:community@loopstacks.io)

## Recognition

Contributors who make significant contributions will be:

- Added to the CONTRIBUTORS file
- Mentioned in release notes
- Invited to join the maintainer team (for ongoing contributors)

## License

By contributing to LoopStacks, you agree that your contributions will be licensed under the Apache License 2.0.

---

Thank you for contributing to LoopStacks! 🚀