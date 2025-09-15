import { Router } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { kubernetesService } from '@/services/kubernetes';
import { createModuleLogger } from '@/utils/logger';

const router = Router();
const logger = createModuleLogger('agentinstances-api');

// GET /agent-instances - List all agent instances
router.get('/', asyncHandler(async (req, res) => {
  const namespace = req.query.namespace as string || 'default';

  logger.info(`Listing agent instances in namespace: ${namespace}`);
  const agentInstances = await kubernetesService.listAgentInstances(namespace);

  res.json({
    success: true,
    data: agentInstances,
    metadata: {
      count: agentInstances.length,
      namespace,
    },
  });
}));

// GET /agent-instances/:name - Get specific agent instance
router.get('/:name', asyncHandler(async (req, res) => {
  const { name } = req.params;
  const namespace = req.query.namespace as string || 'default';

  logger.info(`Getting agent instance: ${name} in namespace: ${namespace}`);
  const agentInstance = await kubernetesService.getAgentInstance(name, namespace);

  res.json({
    success: true,
    data: agentInstance,
  });
}));

// POST /agent-instances - Create new agent instance
router.post('/', asyncHandler(async (req, res) => {
  const namespace = req.query.namespace as string || 'default';
  const agentInstanceData = req.body;

  // Set basic metadata if not provided
  if (!agentInstanceData.metadata) {
    agentInstanceData.metadata = {};
  }
  if (!agentInstanceData.metadata.namespace) {
    agentInstanceData.metadata.namespace = namespace;
  }

  // Set API version and kind
  agentInstanceData.apiVersion = 'loopstacks.io/v1';
  agentInstanceData.kind = 'AgentInstance';

  logger.info(`Creating agent instance: ${agentInstanceData.metadata.name} in namespace: ${namespace}`);
  const createdAgentInstance = await kubernetesService.createAgentInstance(agentInstanceData, namespace);

  res.status(201).json({
    success: true,
    data: createdAgentInstance,
    message: `Agent instance ${agentInstanceData.metadata.name} created successfully`,
  });
}));

// DELETE /agent-instances/:name - Delete agent instance
router.delete('/:name', asyncHandler(async (req, res) => {
  const { name } = req.params;
  const namespace = req.query.namespace as string || 'default';

  logger.info(`Deleting agent instance: ${name} in namespace: ${namespace}`);
  await kubernetesService.deleteAgentInstance(name, namespace);

  res.json({
    success: true,
    message: `Agent instance ${name} deleted successfully`,
  });
}));

export { router as agentInstanceRoutes };