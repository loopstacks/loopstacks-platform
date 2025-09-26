import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler } from '@/middleware/errorHandler';
import { kubernetesService } from '@/services/kubernetes';
import { redisService } from '@/services/redis';
import { createModuleLogger } from '@/utils/logger';

const router = Router();
const logger = createModuleLogger('executions-api');

// POST /executions - Create and execute a new loop
router.post('/', asyncHandler(async (req, res) => {
  const { loopstack, input, realm, config } = req.body;
  const namespace = req.query.namespace as string || 'default';

  // Generate execution ID
  const executionId = uuidv4();

  logger.info(`Starting loop execution: ${executionId} for loopstack: ${loopstack}`);

  // Get the loopstack definition
  const loopStackDef = await kubernetesService.getLoopStack(loopstack, namespace);

  // Create execution record
  const executionData = {
    executionId,
    loopstack,
    input,
    realm: realm || 'default-realm',
    config: config || {},
    status: 'pending',
    phases: {
      intake: { status: 'pending' },
      bidding: { status: 'pending' },
      execution: { status: 'pending' },
      output: { status: 'pending' },
    },
    startTime: new Date().toISOString(),
  };

  // Store execution in Redis
  await redisService.createLoopExecution(executionId, executionData);

  // Start the loop execution process
  await startLoopExecution(executionId, loopStackDef, executionData);

  res.status(201).json({
    success: true,
    data: {
      executionId,
      status: 'pending',
      loopstack,
      message: 'Loop execution started',
    },
  });
}));

// GET /executions/:id - Get execution status
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  logger.info(`Getting execution status: ${id}`);
  const execution = await redisService.getLoopExecution(id);

  if (!execution) {
    return res.status(404).json({
      success: false,
      error: 'Execution not found',
    });
  }

  res.json({
    success: true,
    data: execution,
  });
}));

// GET /executions - List recent executions
router.get('/', asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const status = req.query.status as string;

  logger.info('Listing recent executions');

  // This is a simplified implementation
  // In a real system, you'd want to store executions in a database
  // and implement proper pagination and filtering

  res.json({
    success: true,
    data: [],
    metadata: {
      count: 0,
      limit,
      message: 'Execution listing not yet implemented - executions are stored in Redis with TTL',
    },
  });
}));

// POST /executions/:id/cancel - Cancel execution
router.post('/:id/cancel', asyncHandler(async (req, res) => {
  const { id } = req.params;

  logger.info(`Cancelling execution: ${id}`);

  const execution = await redisService.getLoopExecution(id);
  if (!execution) {
    return res.status(404).json({
      success: false,
      error: 'Execution not found',
    });
  }

  if (execution.status === 'completed' || execution.status === 'failed') {
    return res.status(400).json({
      success: false,
      error: 'Cannot cancel completed or failed execution',
    });
  }

  // Update execution status
  await redisService.updateLoopExecution(id, {
    status: 'cancelled',
    endTime: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: `Execution ${id} cancelled`,
  });
}));

// Helper function to start loop execution
async function startLoopExecution(executionId: string, loopStackDef: any, executionData: any): Promise<void> {
  try {
    logger.info(`Starting loop execution process for: ${executionId}`);

    // Phase 1: Intake - Validate input
    await redisService.updateLoopExecution(executionId, {
      'phases.intake.status': 'in_progress',
      'phases.intake.startTime': new Date().toISOString(),
    });

    // Basic input validation (in a real implementation, this would use the schema)
    if (!executionData.input) {
      throw new Error('Input is required');
    }

    await redisService.updateLoopExecution(executionId, {
      'phases.intake.status': 'completed',
      'phases.intake.endTime': new Date().toISOString(),
    });

    // Phase 2: Bidding - Announce loop and collect bids
    await redisService.updateLoopExecution(executionId, {
      'phases.bidding.status': 'in_progress',
      'phases.bidding.startTime': new Date().toISOString(),
    });

    // Announce the loop to agents
    await redisService.announceLoop(executionId, {
      loopstack: executionData.loopstack,
      capabilities: loopStackDef.spec.capabilities,
      input: executionData.input,
      realm: executionData.realm,
    });

    // Wait for bids (simplified - in reality, this would be event-driven)
    await new Promise(resolve => setTimeout(resolve, 5000));

    const bids = await redisService.getBids(executionId);
    logger.info(`Received ${bids.length} bids for execution ${executionId}`);

    // Select agents based on bidding strategy
    const selectedAgents = selectAgents(bids, loopStackDef.spec.phases?.bidding || {});
    await redisService.selectAgents(executionId, selectedAgents.map(bid => bid.agentId));

    await redisService.updateLoopExecution(executionId, {
      'phases.bidding.status': 'completed',
      'phases.bidding.endTime': new Date().toISOString(),
      'phases.bidding.selectedAgents': selectedAgents,
    });

    // Phase 3: Execution - Run selected agents
    await redisService.updateLoopExecution(executionId, {
      'phases.execution.status': 'in_progress',
      'phases.execution.startTime': new Date().toISOString(),
    });

    // In a real implementation, this would coordinate with the selected agents
    // For now, we'll simulate completion
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Check for results
    const results = await redisService.getResults(executionId);
    logger.info(`Received ${results.length} results for execution ${executionId}`);

    await redisService.updateLoopExecution(executionId, {
      'phases.execution.status': 'completed',
      'phases.execution.endTime': new Date().toISOString(),
      'phases.execution.results': results,
    });

    // Phase 4: Output - Aggregate results
    await redisService.updateLoopExecution(executionId, {
      'phases.output.status': 'in_progress',
      'phases.output.startTime': new Date().toISOString(),
    });

    // Aggregate results based on strategy
    const aggregatedOutput = aggregateResults(results, loopStackDef.spec.phases?.output || {});

    await redisService.updateLoopExecution(executionId, {
      'phases.output.status': 'completed',
      'phases.output.endTime': new Date().toISOString(),
      'phases.output.result': aggregatedOutput,
      status: 'completed',
      endTime: new Date().toISOString(),
    });

    logger.info(`Loop execution ${executionId} completed successfully`);

  } catch (error) {
    logger.error(`Loop execution ${executionId} failed:`, error);

    await redisService.updateLoopExecution(executionId, {
      status: 'failed',
      error: error.message,
      endTime: new Date().toISOString(),
    });
  }
}

// Helper function to select agents from bids
function selectAgents(bids: any[], biddingConfig: any): any[] {
  const strategy = biddingConfig.selectionStrategy || 'best';
  const maxBids = biddingConfig.maxBids || 10;

  switch (strategy) {
    case 'first':
      return bids.slice(0, Math.min(maxBids, bids.length));
    case 'random':
      return bids.sort(() => Math.random() - 0.5).slice(0, Math.min(maxBids, bids.length));
    case 'all':
      return bids.slice(0, maxBids);
    case 'best':
    default:
      // Sort by confidence score if available, otherwise by timestamp
      return bids
        .sort((a, b) => (b.confidence || 0) - (a.confidence || 0) || a.timestamp - b.timestamp)
        .slice(0, Math.min(maxBids, bids.length));
  }
}

// Helper function to aggregate results
function aggregateResults(results: any[], outputConfig: any): any {
  const strategy = outputConfig.aggregationStrategy || 'merge';

  switch (strategy) {
    case 'select':
      // Return the best result
      return results.length > 0 ? results[0].result : null;
    case 'consensus':
      // Simple consensus - return most common result
      // In a real implementation, this would be more sophisticated
      return results.length > 0 ? results[0].result : null;
    case 'merge':
    default:
      // Merge all results
      if (results.length === 0) return null;
      if (results.length === 1) return results[0].result;

      // Simple merge strategy
      return {
        results: results.map(r => r.result),
        aggregate: {
          count: results.length,
          timestamp: new Date().toISOString(),
        },
      };
  }
}

export { router as executionRoutes };