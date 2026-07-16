/**
 * Sessions API Routes
 *
 * Handles listing all sessions and launching new sessions.
 * GET - List all active sessions
 * POST - Launch a new session
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
  getRequestBody,
} from '@/app/api/lib/api-utils';
import { serverApiConfig } from '@/app/api/lib/server-config';
import { createLogger } from '@/app/api/lib/logger';
import type { SkahaSessionResponse, SessionLaunchParams } from '@/lib/api/skaha';
import { HTTP_STATUS } from '@/app/api/lib/http-constants';
import { getPublicRuntimeConfigFromEnv } from '@/lib/config/public-runtime-config';

/**
 * GET /api/sessions
 * List all active sessions for the current user
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { basePath } = getPublicRuntimeConfigFromEnv();
  const sessionsAPIEndpoint = `${basePath}/api/sessions`;
  const logger = createLogger(sessionsAPIEndpoint, 'GET');
  logger.logRequest(request);

  if (!validateMethod(request, ['GET'])) {
    return methodNotAllowed(['GET']);
  }

  const authHeaders = await forwardAuthHeader(request);
  console.log('📨 Session GET route - authHeaders received:', authHeaders);

  const finalHeaders = {
    ...authHeaders,
    Accept: 'application/json',
  };
  console.log('📨 Session GET route - final headers:', finalHeaders);

  const sessionType = request.nextUrl.searchParams.get('type');
  const isHeadlessList = sessionType === 'headless';
  const statusFilter = request.nextUrl.searchParams.get('status');

  // Interactive: `view=interactive` excludes headless batch jobs (Skaha
  // SESSION_VIEW_INTERACTIVE). Headless: `type=headless` on the typed list
  // path — keep Failed/Succeeded/Completed for the batch-jobs widget.
  // Optional `status` narrows to one Skaha status (Pending, Running, …).
  let skahaUrl: string;
  if (isHeadlessList) {
    skahaUrl = `${serverApiConfig.skaha.baseUrl}/v1/session?type=headless`;
    if (statusFilter) {
      skahaUrl += `&status=${encodeURIComponent(statusFilter)}`;
    }
  } else {
    skahaUrl = `${serverApiConfig.skaha.baseUrl}/v1/session?view=interactive`;
  }

  const response = await fetchExternalApi(
    skahaUrl,
    {
      method: 'GET',
      headers: finalHeaders,
    },
    serverApiConfig.skaha.timeout,
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    logger.logError(
      response.status,
      `Failed to fetch sessions: ${response.statusText}`,
      errorText,
    );
    return errorResponse('Failed to fetch sessions', response.status, errorText);
  }

  const all: SkahaSessionResponse[] = await response.json();

  if (isHeadlessList) {
    logger.info(
      `Retrieved ${all.length} headless session(s)${statusFilter ? ` status=${statusFilter}` : ''}`,
    );
    logger.logSuccess(HTTP_STATUS.OK, {
      count: all.length,
      type: 'headless',
      ...(statusFilter ? { status: statusFilter } : {}),
    });
    return successResponse(all);
  }

  // Skaha marks a session `Failed` once its lifetime elapses (an expired
  // session). These linger in the list for some time after they stop being
  // useful; drop them so the active-sessions widget only shows sessions
  // the user can actually interact with.
  const sessions = all.filter((s) => s.status !== 'Failed');
  logger.info(
    `Retrieved ${all.length} interactive session(s), ${sessions.length} after dropping expired`,
  );
  logger.logSuccess(HTTP_STATUS.OK, { count: sessions.length });
  return successResponse(sessions);
});

/**
 * POST /api/sessions
 * Launch a new session
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const { basePath } = getPublicRuntimeConfigFromEnv();
  const sessionsAPIEndpoint = `${basePath}/api/sessions`;
  const logger = createLogger(sessionsAPIEndpoint, 'POST');

  if (!validateMethod(request, ['POST'])) {
    return methodNotAllowed(['POST']);
  }

  const body = await getRequestBody<SessionLaunchParams>(request);
  logger.logRequest(request, body);

  // Validate required fields
  if (!body.sessionType || !body.sessionName || !body.containerImage) {
    logger.logError(
      HTTP_STATUS.BAD_REQUEST,
      'Missing required fields: sessionType, sessionName, containerImage',
    );
    return errorResponse(
      'Missing required fields: sessionType, sessionName, containerImage',
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  // Build form data for SKAHA API
  const formData = new URLSearchParams();
  formData.append('name', body.sessionName);
  formData.append('image', body.containerImage);

  // Add type if provided (for non-headless sessions)
  if (body.sessionType && body.sessionType !== 'headless' && body.sessionType !== 'desktop-app') {
    formData.append('type', body.sessionType);
  }

  // Add cores if provided
  if (body.cores) {
    formData.append('cores', body.cores.toString());
  }

  // Add ram if provided
  if (body.ram) {
    formData.append('ram', body.ram.toString());
  }

  // Add gpus if provided and > 0 (API doesn't accept 0)
  if (body.gpus && body.gpus > 0) {
    formData.append('gpus', body.gpus.toString());
  }

  // Add cmd if provided (for headless sessions)
  if (body.cmd) {
    formData.append('cmd', body.cmd);
  }

  // Add env variables if provided (for headless sessions)
  if (body.env) {
    Object.entries(body.env).forEach(([key, value]) => {
      formData.append('env', `${key}=${value}`);
    });
  }

  const authHeaders = await forwardAuthHeader(request);

  // Build headers for the request
  const headers: HeadersInit = {
    ...authHeaders,
    'Content-Type': 'application/x-www-form-urlencoded',
    Accept: 'application/json',
  };

  // Add registry authentication header if credentials are provided (for Advanced tab)
  if (body.registryUsername && body.registrySecret) {
    const registryAuth = Buffer.from(`${body.registryUsername}:${body.registrySecret}`).toString(
      'base64',
    );
    (headers as Record<string, string>)['x-skaha-registry-auth'] = registryAuth;
    logger.info(`Including registry auth for user: ${body.registryUsername}`);
  }

  logger.info(`Launching session: ${body.sessionName} with image: ${body.containerImage}`);

  const response = await fetchExternalApi(
    `${serverApiConfig.skaha.baseUrl}/v1/session`,
    {
      method: 'POST',
      headers,
      body: formData.toString(),
    },
    serverApiConfig.skaha.timeout,
  );

  if (!response.ok) {
    const errorText = await response.text();
    logger.logError(response.status, `Failed to launch session: ${response.statusText}`, errorText);

    // Parse and format error message for better user experience
    let userMessage = 'Failed to launch session';
    if (errorText) {
      // Remove extra newlines and whitespace
      const cleanedError = errorText.trim().replace(/\n+/g, ' ');

      // Check for specific error patterns
      if (cleanedError.includes('No authentication provided for unknown or private image')) {
        userMessage =
          'This image requires authentication. Please provide registry username and password in the Advanced tab.';
      } else if (cleanedError.includes('authentication') || cleanedError.includes('unauthorized')) {
        userMessage = 'Authentication failed. Please check your registry credentials.';
      } else {
        // Use the error text if it's not too long
        userMessage =
          cleanedError.length > 200
            ? 'Failed to launch session. Please check your configuration.'
            : cleanedError;
      }
    }

    return errorResponse(userMessage, response.status, errorText);
  }

  // SKAHA returns the session ID in the response body as text
  const sessionId = await response.text();
  logger.info(`Successfully launched session: ${body.sessionName}, ID: ${sessionId}`);
  logger.logSuccess(HTTP_STATUS.CREATED, { sessionId, sessionName: body.sessionName });

  // Return the session ID and basic info
  return successResponse(
    {
      id: sessionId,
      name: body.sessionName,
      type: body.sessionType,
      image: body.containerImage,
    },
    HTTP_STATUS.CREATED,
  );
});
