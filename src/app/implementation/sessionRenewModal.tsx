'use client';

import React from 'react';
import { Typography } from '@mui/material';
import { Update as ExtendIcon } from '@mui/icons-material';
import { PortalModal } from '@/app/components/PortalModal/PortalModal';
import { SessionRenewModalProps } from '@/app/types/SessionRenewModalProps';

export const SessionRenewModalImpl = React.forwardRef<HTMLDivElement, SessionRenewModalProps>(
  ({ open, sessionName, sessionId, onClose, isRenewing = false }, ref) => {
    return (
      <PortalModal
        ref={ref}
        open={open}
        onClose={onClose}
        title="Extend Session"
        icon={<ExtendIcon />}
        isFetching={isRenewing}
        titleId="extend-session-dialog-title"
      >
        <Typography id="extend-session-dialog-description" gutterBottom>
          Extending this session using the platform&apos;s configured session lifetime.
        </Typography>
        {sessionName && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Session: {sessionName}
            {sessionId && ` (${sessionId})`}
          </Typography>
        )}
      </PortalModal>
    );
  },
);

SessionRenewModalImpl.displayName = 'SessionRenewModalImpl';
