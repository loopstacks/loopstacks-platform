import { Router } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { kubernetesService } from '@/services/kubernetes';
import { createModuleLogger } from '@/utils/logger';

const router = Router();
const logger = createModuleLogger('realms-api');

// GET /realms - List all realms
router.get('/', asyncHandler(async (req, res) => {
  const namespace = req.query.namespace as string || 'default';

  logger.info(`Listing realms in namespace: ${namespace}`);
  const realms = await kubernetesService.listRealms(namespace);

  res.json({
    success: true,
    data: realms,
    metadata: {
      count: realms.length,
      namespace,
    },
  });
}));

// GET /realms/:name - Get specific realm
router.get('/:name', asyncHandler(async (req, res) => {
  const { name } = req.params;
  const namespace = req.query.namespace as string || 'default';

  logger.info(`Getting realm: ${name} in namespace: ${namespace}`);
  const realm = await kubernetesService.getRealm(name, namespace);

  res.json({
    success: true,
    data: realm,
  });
}));

export { router as realmRoutes };