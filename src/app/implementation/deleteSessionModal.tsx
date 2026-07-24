'use client';

import React from 'react';
import { Button, Typography } from '@mui/material';
import { DeleteOutline as DeleteIcon } from '@mui/icons-material';
import { PortalModal } from '@/app/components/PortalModal/PortalModal';
import { DeleteSessionModalProps } from '@/app/types/DeleteSessionModalProps';

export const DeleteSessionModalImpl = React.forwardRef<HTMLDivElement, DeleteSessionModalProps>(
  ({ open, sessionName, sessionId, onClose, onConfirm, isDeleting = false }, ref) => {
    return (
      <PortalModal
        ref={ref}
        open={open}
        onClose={onClose}
        title="Delete Session"
        icon={<DeleteIcon />}
        isFetching={isDeleting}
        titleId="delete-session-dialog-title"
        actions={
          <>
            <Button variant="outlined" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => void onConfirm()}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </Button>
          </>
        }
      >
        <Typography id="delete-session-dialog-description" gutterBottom>
          Do you really want to delete this session? This process cannot be undone.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Session name {sessionName}, id {sessionId}
        </Typography>
      </PortalModal>
    );
  },
);

DeleteSessionModalImpl.displayName = 'DeleteSessionModalImpl';
