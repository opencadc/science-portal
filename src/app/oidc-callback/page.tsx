'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * OIDC Callback Page
 *
 * Legacy passive redirect. With NextAuth, the real OAuth callback is handled
 * at `/api/auth/callback/oidc` (route handler) — that's the redirect URI to
 * register with the IdP. This page only ever runs if an older deployment
 * still has `/oidc-callback` registered, in which case NextAuth's exchange
 * was never triggered and the session won't exist. We just bounce the user
 * home and let SessionProvider re-evaluate.
 */
export default function OIDCCallbackPage() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;
    router.push('/');
  }, [status, router]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2,
      }}
    >
      <CircularProgress size={60} />
      <Typography variant="h6" sx={{ mt: 2 }}>
        Completing authentication...
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Please wait while we set up your session.
      </Typography>
    </Box>
  );
}
