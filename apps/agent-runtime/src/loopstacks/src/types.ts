/**
 * Generated TypeScript types for LoopStacks MVP Schema
 * Based on schemas/mvp/loopstacks-mvp.json
 */

export interface LoopStackDefinition {
  metadata: {
    name: string;
    version: string;
    description?: string;
  };
  spec: {
    loops: LoopDefinition[];
  };
}

export interface LoopDefinition {
  /**
   * Loop identifier like IN, BID, DO, OUT
   */
  loopId: string;
  requiredCapabilities: string[];
  /**
   * Timeout in milliseconds
   */
  timeout: number;
  aggregation: AggregationStrategy;
}

export interface AggregationStrategy {
  strategy:
    | "highest_confidence"
    | "collect_all"
    | "consensus"
    | "weighted_average"
    | "first_valid"
    | "merge_objects";
  minimumAgents?: number;
  maximumAgents?: number;
  confidenceThreshold?: number;
  consensusThreshold?: number;
}

/**
 * Type guard to check if an object is a valid LoopStackDefinition
 */
export function isLoopStackDefinition(obj: any): obj is LoopStackDefinition {
  return (
    obj &&
    typeof obj === 'object' &&
    obj.metadata &&
    typeof obj.metadata.name === 'string' &&
    typeof obj.metadata.version === 'string' &&
    obj.spec &&
    Array.isArray(obj.spec.loops) &&
    obj.spec.loops.every(isLoopDefinition)
  );
}

/**
 * Type guard to check if an object is a valid LoopDefinition
 */
export function isLoopDefinition(obj: any): obj is LoopDefinition {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.loopId === 'string' &&
    Array.isArray(obj.requiredCapabilities) &&
    typeof obj.timeout === 'number' &&
    obj.aggregation &&
    typeof obj.aggregation.strategy === 'string'
  );
}