/**
 * LoopStacks Runtime Core
 */

import { LoopStackDefinition, LoopDefinition, AggregationStrategy } from './types';
import { LoopStackValidator } from './schema-validator';

export interface Agent {
  id: string;
  capabilities: string[];
  execute(loopId: string, input: any): Promise<AgentResult>;
}

export interface AgentResult {
  agentId: string;
  confidence: number;
  result: any;
  executionTime: number;
}

export interface LoopExecutionContext {
  loopId: string;
  input: any;
  availableAgents: Agent[];
  timeout: number;
}

export interface LoopExecutionResult {
  loopId: string;
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
  agentResults: AgentResult[];
}

export class LoopStacksRuntime {
  private agents: Map<string, Agent> = new Map();
  private loopStack?: LoopStackDefinition;

  /**
   * Register an agent with the runtime
   */
  registerAgent(agent: Agent): void {
    this.agents.set(agent.id, agent);
  }

  /**
   * Unregister an agent from the runtime
   */
  unregisterAgent(agentId: string): void {
    this.agents.delete(agentId);
  }

  /**
   * Load a LoopStack definition
   */
  loadLoopStack(definition: LoopStackDefinition): void {
    const validation = LoopStackValidator.validate(definition);
    if (!validation.valid) {
      throw new Error(`Invalid LoopStack definition: ${validation.errors.join(', ')}`);
    }
    this.loopStack = definition;
  }

  /**
   * Execute a specific loop
   */
  async executeLoop(loopId: string, input: any): Promise<LoopExecutionResult> {
    if (!this.loopStack) {
      throw new Error('No LoopStack definition loaded');
    }

    const loopDef = this.loopStack.spec.loops.find(loop => loop.loopId === loopId);
    if (!loopDef) {
      throw new Error(`Loop ${loopId} not found in LoopStack definition`);
    }

    const startTime = Date.now();
    const availableAgents = this.getCapableAgents(loopDef.requiredCapabilities);

    if (availableAgents.length === 0) {
      return {
        loopId,
        success: false,
        error: `No agents available with required capabilities: ${loopDef.requiredCapabilities.join(', ')}`,
        executionTime: Date.now() - startTime,
        agentResults: []
      };
    }

    try {
      const agentResults = await this.executeAgents(loopDef, availableAgents, input);
      const aggregatedResult = this.aggregateResults(agentResults, loopDef.aggregation);

      return {
        loopId,
        success: true,
        result: aggregatedResult,
        executionTime: Date.now() - startTime,
        agentResults
      };
    } catch (error) {
      return {
        loopId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
        agentResults: []
      };
    }
  }

  /**
   * Get agents that have all required capabilities
   */
  private getCapableAgents(requiredCapabilities: string[]): Agent[] {
    return Array.from(this.agents.values()).filter(agent =>
      requiredCapabilities.every(capability =>
        agent.capabilities.includes(capability)
      )
    );
  }

  /**
   * Execute agents for a loop
   */
  private async executeAgents(
    loopDef: LoopDefinition,
    agents: Agent[],
    input: any
  ): Promise<AgentResult[]> {
    const maxAgents = loopDef.aggregation.maximumAgents || agents.length;
    const selectedAgents = agents.slice(0, maxAgents);

    const agentPromises = selectedAgents.map(agent =>
      this.executeAgentWithTimeout(agent, loopDef.loopId, input, loopDef.timeout)
    );

    const results = await Promise.allSettled(agentPromises);
    return results
      .filter((result): result is PromiseFulfilledResult<AgentResult> => result.status === 'fulfilled')
      .map(result => result.value);
  }

  /**
   * Execute a single agent with timeout
   */
  private async executeAgentWithTimeout(
    agent: Agent,
    loopId: string,
    input: any,
    timeout: number
  ): Promise<AgentResult> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Agent ${agent.id} timed out after ${timeout}ms`));
      }, timeout);

      agent.execute(loopId, input)
        .then(result => {
          clearTimeout(timer);
          resolve({
            ...result,
            executionTime: Date.now() - startTime
          });
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Aggregate results based on strategy
   */
  private aggregateResults(results: AgentResult[], strategy: AggregationStrategy): any {
    if (results.length === 0) {
      throw new Error('No results to aggregate');
    }

    const minAgents = strategy.minimumAgents || 1;
    if (results.length < minAgents) {
      throw new Error(`Insufficient results: got ${results.length}, minimum required ${minAgents}`);
    }

    switch (strategy.strategy) {
      case 'highest_confidence':
        return results.reduce((best, current) =>
          current.confidence > best.confidence ? current : best
        ).result;

      case 'collect_all':
        return results.map(r => r.result);

      case 'first_valid':
        return results[0].result;

      case 'weighted_average':
        if (results.every(r => typeof r.result === 'number')) {
          const totalWeight = results.reduce((sum, r) => sum + r.confidence, 0);
          return results.reduce((sum, r) => sum + (r.result * r.confidence), 0) / totalWeight;
        }
        throw new Error('Weighted average only works with numeric results');

      case 'consensus':
        const threshold = strategy.consensusThreshold || 0.5;
        const resultCounts = new Map<string, { count: number; confidence: number }>();

        results.forEach(r => {
          const key = JSON.stringify(r.result);
          const existing = resultCounts.get(key) || { count: 0, confidence: 0 };
          resultCounts.set(key, {
            count: existing.count + 1,
            confidence: existing.confidence + r.confidence
          });
        });

        const consensusResult = Array.from(resultCounts.entries())
          .find(([_, data]) => data.count / results.length >= threshold);

        if (consensusResult) {
          return JSON.parse(consensusResult[0]);
        }
        throw new Error(`No consensus reached with threshold ${threshold}`);

      case 'merge_objects':
        if (results.every(r => typeof r.result === 'object' && r.result !== null)) {
          return results.reduce((merged, r) => ({ ...merged, ...r.result }), {});
        }
        throw new Error('Merge objects only works with object results');

      default:
        throw new Error(`Unknown aggregation strategy: ${strategy.strategy}`);
    }
  }
}