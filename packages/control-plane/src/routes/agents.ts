import { Router } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { kubernetesService } from '@/services/kubernetes';
import { createModuleLogger } from '@/utils/logger';

const router = Router();
const logger = createModuleLogger('agents-api');

// GET /agents - List all agents
router.get('/', asyncHandler(async (req, res) => {
  const namespace = req.query.namespace as string || 'default';

  logger.info(`Listing agents in namespace: ${namespace}`);
  const agents = await kubernetesService.listAgents(namespace);

  res.json({
    success: true,
    data: agents,
    metadata: {
      count: agents.length,
      namespace,
    },
  });
}));

// GET /agents/:name - Get specific agent
router.get('/:name', asyncHandler(async (req, res) => {
  const { name } = req.params;
  const namespace = req.query.namespace as string || 'default';

  logger.info(`Getting agent: ${name} in namespace: ${namespace}`);
  const agent = await kubernetesService.getAgent(name, namespace);

  res.json({
    success: true,
    data: agent,
  });
}));

// POST /agents - Create new agent
router.post('/', asyncHandler(async (req, res) => {
  const namespace = req.query.namespace as string || 'default';
  const agentData = req.body;

  // Set basic metadata if not provided
  if (!agentData.metadata) {
    agentData.metadata = {};
  }
  if (!agentData.metadata.namespace) {
    agentData.metadata.namespace = namespace;
  }

  // Set API version and kind
  agentData.apiVersion = 'loopstacks.io/v1';
  agentData.kind = 'Agent';

  logger.info(`Creating agent: ${agentData.metadata.name} in namespace: ${namespace}`);
  const createdAgent = await kubernetesService.createAgent(agentData, namespace);

  res.status(201).json({
    success: true,
    data: createdAgent,
    message: `Agent ${agentData.metadata.name} created successfully`,
  });
}));

// PUT /agents/:name - Update agent
router.put('/:name', asyncHandler(async (req, res) => {
  const { name } = req.params;
  const namespace = req.query.namespace as string || 'default';
  const agentData = req.body;

  // Ensure metadata consistency
  if (!agentData.metadata) {
    agentData.metadata = {};
  }
  agentData.metadata.name = name;
  agentData.metadata.namespace = namespace;
  agentData.apiVersion = 'loopstacks.io/v1';
  agentData.kind = 'Agent';

  logger.info(`Updating agent: ${name} in namespace: ${namespace}`);
  const updatedAgent = await kubernetesService.updateAgent(name, agentData, namespace);

  res.json({
    success: true,
    data: updatedAgent,
    message: `Agent ${name} updated successfully`,
  });
}));

// DELETE /agents/:name - Delete agent
router.delete('/:name', asyncHandler(async (req, res) => {
  const { name } = req.params;
  const namespace = req.query.namespace as string || 'default';

  logger.info(`Deleting agent: ${name} in namespace: ${namespace}`);
  await kubernetesService.deleteAgent(name, namespace);

  res.json({
    success: true,
    message: `Agent ${name} deleted successfully`,
  });
}));

// GET /agents/:name/instances - Get agent instances for specific agent
router.get('/:name/instances', asyncHandler(async (req, res) => {
  const { name } = req.params;
  const namespace = req.query.namespace as string || 'default';

  logger.info(`Getting instances for agent: ${name} in namespace: ${namespace}`);
  const allInstances = await kubernetesService.listAgentInstances(namespace);

  // Filter instances for this specific agent
  const agentInstances = allInstances.filter(instance => instance.spec.agent === name);

  res.json({
    success: true,
    data: agentInstances,
    metadata: {
      count: agentInstances.length,
      agentName: name,
      namespace,
    },
  });
}));

// GET /agents/:name/capabilities - Get agent capabilities
router.get('/:name/capabilities', asyncHandler(async (req, res) => {
  const { name } = req.params;
  const namespace = req.query.namespace as string || 'default';

  logger.info(`Getting capabilities for agent: ${name} in namespace: ${namespace}`);
  const agent = await kubernetesService.getAgent(name, namespace);

  res.json({
    success: true,
    data: {
      agent: name,
      capabilities: agent.spec.capabilities || [],
      schema: agent.spec.schema || {},
      runtime: agent.spec.runtime || {},
    },
  });
}));

export { router as agentRoutes };