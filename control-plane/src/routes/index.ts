import { Router } from 'express';
import { agentRoutes } from './agents';
import { agentInstanceRoutes } from './agentInstances';
import { realmRoutes } from './realms';
import { loopStackRoutes } from './loopStacks';
import { executionRoutes } from './executions';

const router = Router();

// API version info
router.get('/', (req, res) => {
  res.json({
    name: 'LoopStacks Control Plane API',
    version: 'v1',
    description: 'RESTful API for managing AI agent orchestration',
    endpoints: {
      agents: '/agents',
      agentInstances: '/agent-instances',
      realms: '/realms',
      loopStacks: '/loopstacks',
      executions: '/executions',
    },
    documentation: 'https://docs.loopstacks.io/api/v1',
  });
});

// Mount route modules
router.use('/agents', agentRoutes);
router.use('/agent-instances', agentInstanceRoutes);
router.use('/realms', realmRoutes);
router.use('/loopstacks', loopStackRoutes);
router.use('/executions', executionRoutes);

export { router as apiRoutes };