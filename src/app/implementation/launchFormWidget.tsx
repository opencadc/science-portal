'use client';

import React, { useCallback } from 'react';
import { Paper, Typography, IconButton, Box, LinearProgress, Link, Alert } from '@mui/material';
import { Refresh as RefreshIcon, HelpOutline as HelpOutlineIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { LaunchFormWidgetProps } from '@/app/types/LaunchFormWidgetProps';
import { SessionLaunchForm } from '@/app/components/SessionLaunchForm/SessionLaunchForm';
import { SessionRequestModal } from '@/app/components/SessionRequestModal/SessionRequestModal';
import { SessionFormData } from '@/app/types/SessionLaunchFormProps';
import { useLaunchRequest, useSessionUiActions } from '@/lib/stores';

export function LaunchFormWidgetImpl({
  isLoading = false,
  onRefresh,
  title = 'Launch New Session',
  showProgressIndicator = false,
  progressPercentage = 0,
  helpUrl,
  signInAlertMessage,
  imagesByType = {},
  repositoryHosts = [],
  activeSessions = [],
  launchSessionFn,
  onLaunch,
  ...sessionLaunchFormProps
}: LaunchFormWidgetProps) {
  const theme = useTheme();
  const launchRequest = useLaunchRequest();
  const { setLaunchRequest } = useSessionUiActions();

  const handleLaunch = useCallback(
    async (formData: SessionFormData) => {
      setLaunchRequest({ status: 'requesting', sessionData: formData });

      try {
        const imageToUse = formData.image
          ? `${formData.repositoryHost}/${formData.image}`
          : formData.containerImage;

        const launchParams = {
          sessionType: formData.type,
          sessionName: formData.sessionName,
          containerImage: imageToUse,
          ...(formData.resourceType === 'fixed' && {
            cores: formData.cores,
            ram: formData.memory,
            ...(formData.gpus && formData.gpus > 0 && { gpus: formData.gpus }),
          }),
          ...(formData.repositoryAuthUsername &&
            formData.repositoryAuthSecret && {
              registryUsername: formData.repositoryAuthUsername,
              registrySecret: formData.repositoryAuthSecret,
            }),
        };

        if (launchSessionFn) {
          await launchSessionFn(launchParams);
        } else {
          const { launchSession } = await import('@/lib/api/skaha');
          await launchSession(launchParams);
        }

        if (onLaunch) {
          await onLaunch(formData);
        }

        setLaunchRequest(null);
      } catch (error) {
        setLaunchRequest({
          status: 'error',
          sessionData: formData,
          error: error instanceof Error ? error.message : 'An unknown error occurred',
        });
      }
    },
    [launchSessionFn, onLaunch, setLaunchRequest],
  );

  const handleModalClose = useCallback(() => {
    setLaunchRequest(null);
  }, [setLaunchRequest]);

  const handleRetry = useCallback(() => {
    if (launchRequest?.sessionData) {
      void handleLaunch(launchRequest.sessionData);
    }
  }, [launchRequest?.sessionData, handleLaunch]);

  return (
    <Paper
      elevation={0}
      variant="outlined"
      sx={{
        position: 'relative',
        padding: theme.spacing(2),
        overflow: 'hidden',
        borderRadius: theme.shape.borderRadius,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        [theme.breakpoints.down('sm')]: {
          padding: theme.spacing(1.5),
          borderRadius: 2,
        },
      }}
      component="div"
    >
      {signInAlertMessage ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          {signInAlertMessage}
        </Alert>
      ) : null}

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing(1),
          [theme.breakpoints.down('sm')]: {
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 1,
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <Typography
            variant="h6"
            component="h2"
            sx={{
              [theme.breakpoints.down('sm')]: {
                fontSize: theme.typography.body1.fontSize,
                fontWeight: theme.typography.fontWeightBold,
              },
            }}
          >
            {title}
          </Typography>
          {helpUrl && (
            <Link
              href={helpUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              <HelpOutlineIcon sx={{ fontSize: theme.spacing(2.5) }} />
            </Link>
          )}
        </Box>
        {onRefresh && (
          <IconButton
            aria-label="refresh"
            onClick={onRefresh}
            disabled={isLoading}
            size="small"
            sx={{
              [theme.breakpoints.down('sm')]: {
                alignSelf: 'flex-end',
                mt: -1,
              },
            }}
          >
            <RefreshIcon />
          </IconButton>
        )}
      </Box>

      <LinearProgress
        color={isLoading ? 'primary' : 'success'}
        variant={isLoading ? 'indeterminate' : 'determinate'}
        value={isLoading ? undefined : showProgressIndicator ? progressPercentage : 100}
        sx={{
          width: '100%',
          height: 4,
          marginBottom: theme.spacing(2),
          borderRadius: 2,
          '& .MuiLinearProgress-bar': {
            borderRadius: 2,
          },
        }}
      />

      <Box sx={{ marginBottom: theme.spacing(2) }}>
        <SessionLaunchForm
          {...sessionLaunchFormProps}
          imagesByType={imagesByType}
          onLaunch={handleLaunch}
          isLoading={isLoading}
          repositoryHosts={repositoryHosts}
          activeSessions={activeSessions}
        />
      </Box>

      <SessionRequestModal
        open={launchRequest !== null}
        sessionName={launchRequest?.sessionData.sessionName || ''}
        sessionType={launchRequest?.sessionData.type || ''}
        status={launchRequest?.status ?? 'requesting'}
        errorMessage={launchRequest?.error}
        onClose={handleModalClose}
        onRetry={handleRetry}
      />
    </Paper>
  );
}
