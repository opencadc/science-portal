'use client';

import React from 'react';
import { Button, Typography, Box } from '@mui/material';
import { ErrorOutline as ErrorIcon, RocketLaunch as RequestIcon } from '@mui/icons-material';
import { PortalModal } from '@/app/components/PortalModal/PortalModal';
import { SessionRequestModalProps } from '../types/SessionRequestModalProps';
import { formatMaxSessionsMessage } from '@/lib/sessions/sessionQuota';

/**
 * Parse and format error messages for better user experience
 */
const parseErrorMessage = (error: string | undefined): string => {
  if (!error) return 'An unknown error occurred';

  let errorText = error;

  try {
    const errorObj = JSON.parse(error);
    if (errorObj.message) {
      errorText = errorObj.message;
    } else if (errorObj.details) {
      errorText = errorObj.details;
    } else if (errorObj.error) {
      errorText = errorObj.error;
    }
  } catch {
    // Not JSON, continue with string parsing
  }

  const maxSessionsMatch = errorText.match(/reached the maximum of (\d+) active sessions/i);
  if (maxSessionsMatch) {
    return formatMaxSessionsMessage(Number(maxSessionsMatch[1]));
  }

  if (errorText.match(/insufficient|not enough|unavailable/i)) {
    return 'Insufficient resources available. Please try again later or request fewer resources.';
  }

  if (errorText.match(/quota.*exceeded/i)) {
    return 'Resource quota exceeded. Please delete unused sessions or contact support.';
  }

  return errorText.trim();
};

export const SessionRequestModalImpl: React.FC<SessionRequestModalProps> = ({
  open,
  sessionName,
  sessionType,
  status,
  errorMessage,
  onClose,
  onRetry,
}) => {
  const parsedError = parseErrorMessage(errorMessage);
  const isBusy = status === 'requesting' || status === 'provisioning';
  const isError = status === 'error';

  const statusMessage = isError
    ? 'Failed to create session'
    : status === 'provisioning'
      ? 'Provisioning resources...'
      : 'Requesting session...';

  const statusDescription = isError
    ? 'An error occurred while creating your session. See details below.'
    : status === 'provisioning'
      ? 'Allocating compute resources and preparing your environment'
      : `Submitting request for ${sessionType} session "${sessionName}"`;

  return (
    <PortalModal
      open={open}
      onClose={onClose}
      title="Request New Session"
      icon={<RequestIcon />}
      isFetching={isBusy}
      error={isError ? parsedError : undefined}
      actions={
        isError ? (
          <>
            <Button variant="outlined" onClick={onClose}>
              Close
            </Button>
            {onRetry && (
              <Button variant="contained" onClick={onRetry} autoFocus>
                Retry
              </Button>
            )}
          </>
        ) : undefined
      }
    >
      <Box display="flex" flexDirection="column" alignItems="center" textAlign="center" py={2}>
        {isError && <ErrorIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />}
        <Typography variant="h6" gutterBottom>
          {statusMessage}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {statusDescription}
        </Typography>
      </Box>
    </PortalModal>
  );
};
