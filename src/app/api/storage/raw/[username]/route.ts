/**
 * Storage Raw API Route
 *
 * GET /api/storage/raw/[username] - Get storage data for VOSpace
 * This endpoint fetches VOSpace XML and returns parsed JSON
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  withErrorHandling,
  errorResponse,
  fetchExternalApi,
  forwardAuthHeader,
} from '@/app/api/lib/api-utils';
import { serverApiConfig } from '@/app/api/lib/server-config';
import { HTTP_STATUS, API_TIMEOUTS } from '@/app/api/lib/http-constants';
import { parseVOSpaceXML } from '@/lib/storage/parseVOSpaceXML';

export const GET = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ username: string }> }) => {
    const { username } = await params;

    if (!username) {
      return errorResponse('Username is required', HTTP_STATUS.BAD_REQUEST);
    }

    const authHeaders = await forwardAuthHeader(request);
    const storageBaseUrl = serverApiConfig.storage.baseUrl;
    const storageUrl = `${storageBaseUrl}${username}`;

    const response = await fetchExternalApi(
      storageUrl,
      {
        method: 'GET',
        headers: {
          ...authHeaders,
          Accept: 'application/xml',
        },
      },
      API_TIMEOUTS.DEFAULT,
    );

    if (!response.ok) {
      console.error('[Storage API] Failed to fetch storage data:', {
        username,
        status: response.status,
        statusText: response.statusText,
      });
      const errorText = await response.text().catch(() => '');
      return errorResponse('Failed to fetch storage data', response.status, errorText);
    }

    const xmlText = await response.text();
    const storageData = parseVOSpaceXML(xmlText);

    // Return JSON response
    return NextResponse.json(storageData, {
      status: HTTP_STATUS.OK,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },
);
