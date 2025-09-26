# @loopstacks/runtime

TypeScript runtime and SDK for LoopStacks agent orchestration platform.

## Installation

```bash
npm install @loopstacks/runtime
```

## Usage

```typescript
import { LoopStacksRuntime, LoopStackDefinition, Agent } from '@loopstacks/runtime';

// Create runtime instance
const runtime = new LoopStacksRuntime();

// Register agents
const myAgent: Agent = {
  id: 'my-agent',
  capabilities: ['text-processing', 'analysis'],
  async execute(loopId: string, input: any) {
    // Agent implementation
    return {
      agentId: 'my-agent',
      confidence: 0.9,
      result: { processed: input },
      executionTime: 100
    };
  }
};

runtime.registerAgent(myAgent);

// Load LoopStack definition
const loopStack: LoopStackDefinition = {
  metadata: {
    name: "example-stack",
    version: "v1.0.0",
    description: "Example LoopStack"
  },
  spec: {
    loops: [{
      loopId: "PROCESS",
      requiredCapabilities: ["text-processing"],
      timeout: 5000,
      aggregation: {
        strategy: "highest_confidence"
      }
    }]
  }
};

runtime.loadLoopStack(loopStack);

// Execute loop
const result = await runtime.executeLoop('PROCESS', { text: 'Hello World' });
console.log(result);
```

## API Reference

### LoopStacksRuntime

Main runtime class for executing LoopStacks.

#### Methods

- `registerAgent(agent: Agent)` - Register an agent
- `unregisterAgent(agentId: string)` - Unregister an agent
- `loadLoopStack(definition: LoopStackDefinition)` - Load a LoopStack definition
- `executeLoop(loopId: string, input: any)` - Execute a specific loop

### Types

- `LoopStackDefinition` - Complete LoopStack definition
- `LoopDefinition` - Individual loop configuration
- `Agent` - Agent interface
- `AgentResult` - Result from agent execution
- `AggregationStrategy` - Strategy for combining agent results

## License

MIT