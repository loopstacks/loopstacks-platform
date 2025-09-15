import { Router } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { kubernetesService } from '@/services/kubernetes';
import { createModuleLogger } from '@/utils/logger';

const router = Router();
const logger = createModuleLogger('loopstacks-api');

// GET /loopstacks - List all loopstacks
router.get('/', asyncHandler(async (req, res) => {
  const namespace = req.query.namespace as string || 'default';

  logger.info(`Listing loopstacks in namespace: ${namespace}`);
  const loopStacks = await kubernetesService.listLoopStacks(namespace);

  res.json({
    success: true,
    data: loopStacks,
    metadata: {
      count: loopStacks.length,
      namespace,
    },
  });
}));

// GET /loopstacks/:name - Get specific loopstack
router.get('/:name', asyncHandler(async (req, res) => {
  const { name } = req.params;
  const namespace = req.query.namespace as string || 'default';

  logger.info(`Getting loopstack: ${name} in namespace: ${namespace}`);
  const loopStack = await kubernetesService.getLoopStack(name, namespace);

  res.json({
    success: true,
    data: loopStack,
  });
}));

export { router as loopStackRoutes };