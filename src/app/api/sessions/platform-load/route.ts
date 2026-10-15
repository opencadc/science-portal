/**
 * Platform Load API Route
 *
 * Handles retrieving platform load/context information.
 * GET - Get platform load statistics
 */

import { NextRequest } from 'next/server';
import {
  withErrorHandling,
  validateMethod,
  methodNotAllowed,
  errorResponse,
  successResponse,
  fetchExternalApi,
  forwardAuthHeader,
} from '@/app/api/lib/api-utils';
import { serverApiConfig } from '@/app/api/lib/server-config';
import { API_TIMEOUTS } from '@/app/api/lib/http-constants';
import { createLogger } from '@/app/api/lib/logger';
import type { SkahaStatsResponse } from '@/lib/api/skaha';
import { platformLoadFromStats } from '@/lib/api/platform-load';
import { getPublicRuntimeConfigFromEnv } from '@/lib/config/public-runtime-config';

/**
 * GET /api/sessions/platform-load
 * Get platform load statistics
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { basePath } = getPublicRuntimeConfigFromEnv();
  const sessionsAPIEndpoint = `${basePath}/api/sessions`;
  const logger = createLogger(`${sessionsAPIEndpoint}/platform-load`, 'GET');
  logger.logRequest(request);

  if (!validateMethod(request, ['GET'])) {
    return methodNotAllowed(['GET']);
  }

  const authHeaders = await forwardAuthHeader(request);

  const response = await fetchExternalApi(
    `${serverApiConfig.skaha.baseUrl}/v1/session?view=stats`,
    {
      method: 'GET',
      headers: {
        ...authHeaders,
        Accept: 'application/json',
      },
    },
    API_TIMEOUTS.DEFAULT,
  );

  if (!response.ok) {
    logger.logError(response.status, `Failed to fetch platform load: ${response.statusText}`);
    return errorResponse('Failed to fetch platform load', response.status);
  }

  const data: SkahaStatsResponse = await response.json();
  const platformLoad = platformLoadFromStats(data);

  const gpuSummary = data.gpu
    ? `, GPU: ${data.gpu.requestedGPU}/${data.gpu.gpuAvailable}`
    : ', GPU: not reported';
  logger.info(
    `Platform stats - CPU: ${data.cores.requestedCPUCores}/${data.cores.cpuCoresAvailable}, RAM: ${data.ram.requestedRAM}/${data.ram.ramAvailable}${gpuSummary}`,
  );
  logger.logSuccess(200, platformLoad);
  return successResponse(platformLoad);
});
