/**
 * Schema validation utilities for LoopStacks
 */

import { LoopStackDefinition, LoopDefinition, isLoopStackDefinition, isLoopDefinition } from './types';

export class LoopStackValidator {
  /**
   * Validate a LoopStack definition against the schema
   */
  static validate(definition: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!isLoopStackDefinition(definition)) {
      errors.push('Invalid LoopStack definition structure');
      return { valid: false, errors };
    }

    // Validate metadata
    if (!definition.metadata.name.match(/^[a-z0-9-]+$/)) {
      errors.push('Metadata name must match pattern ^[a-z0-9-]+$');
    }

    if (!definition.metadata.version.match(/^v\d+\.\d+\.\d+$/)) {
      errors.push('Metadata version must match pattern ^v\\d+\\.\\d+\\.\\d+$');
    }

    // Validate loops
    if (definition.spec.loops.length === 0) {
      errors.push('At least one loop is required');
    }

    definition.spec.loops.forEach((loop, index) => {
      const loopErrors = this.validateLoop(loop);
      loopErrors.forEach(error => {
        errors.push(`Loop ${index}: ${error}`);
      });
    });

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate a single loop definition
   */
  private static validateLoop(loop: LoopDefinition): string[] {
    const errors: string[] = [];

    if (!loop.loopId.match(/^[A-Z_]+$/)) {
      errors.push('loopId must match pattern ^[A-Z_]+$');
    }

    if (loop.requiredCapabilities.length === 0) {
      errors.push('At least one required capability must be specified');
    }

    if (loop.timeout < 100) {
      errors.push('Timeout must be at least 100 milliseconds');
    }

    // Validate aggregation strategy
    const validStrategies = [
      'highest_confidence',
      'collect_all',
      'consensus',
      'weighted_average',
      'first_valid',
      'merge_objects'
    ];

    if (!validStrategies.includes(loop.aggregation.strategy)) {
      errors.push(`Invalid aggregation strategy: ${loop.aggregation.strategy}`);
    }

    if (loop.aggregation.minimumAgents && loop.aggregation.minimumAgents < 1) {
      errors.push('minimumAgents must be at least 1');
    }

    if (loop.aggregation.maximumAgents && loop.aggregation.maximumAgents < 1) {
      errors.push('maximumAgents must be at least 1');
    }

    if (loop.aggregation.confidenceThreshold !== undefined) {
      if (loop.aggregation.confidenceThreshold < 0 || loop.aggregation.confidenceThreshold > 1) {
        errors.push('confidenceThreshold must be between 0 and 1');
      }
    }

    if (loop.aggregation.consensusThreshold !== undefined) {
      if (loop.aggregation.consensusThreshold < 0 || loop.aggregation.consensusThreshold > 1) {
        errors.push('consensusThreshold must be between 0 and 1');
      }
    }

    return errors;
  }
}