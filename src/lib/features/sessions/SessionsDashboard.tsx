'use client';

import { useMemo, useCallback } from 'react';
import { ActiveSessionsWidget } from '@/app/components/ActiveSessionsWidget/ActiveSessionsWidget';
import { UserStorageWidget } from '@/app/components/UserStorageWidget/UserStorageWidget';
import { LaunchFormWidget } from '@/app/components/LaunchFormWidget/LaunchFormWidget';
import { PlatformLoad } from '@/app/components/PlatformLoad/PlatformLoad';
import { Footer } from '@/app/components/Footer/Footer';
import { Box } from '@/app/components/Box/Box';
import { Container, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { SessionCardProps } from '@/app/types/SessionCardProps';
import { useAuthStatus } from '@/lib/hooks/useAuth';
import { usePublicRuntimeConfig } from '@/lib/providers/PublicRuntimeConfigProvider';
import {
  useSessions,
  useDeleteSession,
  useRenewSession,
  useLaunchSession,
} from '@/lib/hooks/useSessions';
import { useContainerImages, useImageRepositories, useContext } from '@/lib/hooks/useImages';
import { useUserStorageSummary } from '@/lib/hooks/useUserStorage';
import { STATIC_PLATFORM_LOAD_DATA } from '@/lib/config/static-platform-load';
import type { Session, SessionLaunchParams } from '@/lib/api/skaha';
import {
  DOCS_URL,
  ABOUT_URL,
  OPEN_SOURCE_URL,
  SUPPORT_EMAIL,
  DISCORD_URL,
  STATUS_PAGE_URL,
} from '@/lib/config/site-config';
import { useOperatingSessionIds, useSessionUiActions } from '@/lib/stores';

export function SessionsDashboard() {
  const theme = useTheme();
  const isDesktopTopRow = useMediaQuery(theme.breakpoints.up('lg'));
  const { useCanfar, serviceUrls } = usePublicRuntimeConfig();
  const isOIDCMode = !useCanfar;

  const { data: authStatus, isLoading: authLoading } = useAuthStatus();
  const isAuthenticated = authStatus?.authenticated ?? false;
  // Widgets render only for authenticated users; while the auth check is in
  // flight they stay mounted in their loading state to avoid a layout flash.
  const isLoggedOut = !authLoading && !isAuthenticated;

  const operatingSessionIds = useOperatingSessionIds();
  const { markOperating, clearOperating } = useSessionUiActions();

  const {
    data: sessions = [],
    isLoading,
    refetch: refetchSessions,
  } = useSessions(isAuthenticated);

  const {
    data: imagesByType = {},
    isLoading: isLoadingImages,
    isFetching: isFetchingImages,
    refetch: refetchImages,
  } = useContainerImages(isAuthenticated);

  const {
    data: imageRepositories = [],
    isLoading: isLoadingRepositories,
    isFetching: isFetchingRepositories,
    refetch: refetchRepositories,
  } = useImageRepositories(isAuthenticated);

  const {
    data: context,
    isLoading: isLoadingContext,
    isFetching: isFetchingContext,
    refetch: refetchContext,
  } = useContext(isAuthenticated);

  const username = authStatus?.user?.username ?? '';
  const {
    data: storageSummary,
    isLoading: isLoadingStorageSummary,
    isFetching: isFetchingStorageSummary,
    error: storageError,
    refetch: refetchStorage, 
  } = useUserStorageSummary(username, isAuthenticated);

  const { mutate: deleteSession } = useDeleteSession({
    onSuccess: (_, sessionId) => {
      setTimeout(() => clearOperating(sessionId), 3500);
    },
    onError: (_error, sessionId) => {
      clearOperating(sessionId);
    },
  });

  const { mutate: renewSession } = useRenewSession({
    onSuccess: (_, { sessionId }) => {
      clearOperating(sessionId);
    },
    onError: (_error, { sessionId }) => {
      clearOperating(sessionId);
    },
  });

  const { mutateAsync: launchSessionAsync } = useLaunchSession();

  const handleLaunchSession = useCallback(
    async (params: SessionLaunchParams): Promise<Session> => {
      return await launchSessionAsync(params);
    },
    [launchSessionAsync],
  );

  const isLoadingSessions = authLoading || (isAuthenticated && isLoading);

  const isLoadingLaunchForm =
    authLoading ||
    (isAuthenticated &&
      (isLoadingImages ||
        isLoadingRepositories ||
        isLoadingContext ||
        isFetchingImages ||
        isFetchingRepositories ||
        isFetchingContext));

  const isLoadingUserStorage = authLoading || (isAuthenticated && isLoadingStorageSummary) || isFetchingStorageSummary;

  const handleDeleteSession = useCallback(
    (sessionId: string) => {
      markOperating(sessionId);
      deleteSession(sessionId);
    },
    [deleteSession, markOperating],
  );

  const handleRenewSession = useCallback(
    (sessionId: string) => {
      markOperating(sessionId);
      renewSession({ sessionId, hours: 12 });
    },
    [renewSession, markOperating],
  );

  const activeSessions: SessionCardProps[] = useMemo(() => {
    return sessions
      .filter(
        (session: Session) =>
          session.sessionType !== 'headless' && session.sessionType !== 'desktop-app',
      )
      .map((session: Session) => ({
        id: session.id,
        sessionId: session.sessionId,
        sessionType: session.sessionType,
        sessionName: session.sessionName,
        status: session.status,
        containerImage: session.containerImage,
        startedTime: session.startedTime,
        expiresTime: session.expiresTime,
        memoryUsage: session.memoryUsage,
        memoryAllocated: session.memoryAllocated,
        cpuUsage: session.cpuUsage,
        cpuAllocated: session.cpuAllocated,
        gpuAllocated: session.gpuAllocated,
        isFixedResources: session.isFixedResources,
        connectUrl: session.connectUrl,
        requestedRAM: session.requestedRAM,
        requestedCPU: session.requestedCPU,
        requestedGPU: session.requestedGPU,
        onDelete: () => handleDeleteSession(session.id),
        onExtendTime: () => handleRenewSession(session.id),
      }));
  }, [sessions, handleDeleteSession, handleRenewSession]);

  const handleSessionsRefresh = useCallback(() => {
    refetchSessions();
  }, [refetchSessions]);

  const handleStorageRefresh = useCallback(() => {
    void refetchStorage();
  }, [refetchStorage]);

  const handleLaunchFormRefresh = useCallback(() => {
    refetchImages();
    refetchRepositories();
    refetchContext();
  }, [refetchImages, refetchRepositories, refetchContext]);

  const footerSections = useMemo(
    () => [
      {
        title: 'Resources',
        links: [
          { label: 'Documentation', href: DOCS_URL, external: true },
          { label: 'About', href: ABOUT_URL, external: true },
          { label: 'Open Source', href: OPEN_SOURCE_URL, external: true },
        ],
      },
      {
        title: 'Services',
        links: [
          {
            label: 'Storage Management',
            href: serviceUrls.storageManagement,
            external: true,
          },
          {
            label: 'Group Management',
            href: serviceUrls.groupManagement,
            external: true,
          },
          {
            label: 'Data Publication',
            href: serviceUrls.dataPublication,
            external: true,
          },
          { label: 'Science Portal', href: serviceUrls.sciencePortal, external: true },
          { label: 'CADC Search', href: serviceUrls.cadcSearch, external: true },
          { label: 'OpenStack Cloud', href: serviceUrls.openstackCloud, external: true },
        ],
      },
      {
        title: 'Support',
        links: [
          { label: 'Help', href: SUPPORT_EMAIL, external: false },
          { label: 'Join us on Discord', href: DISCORD_URL, external: true },
          { label: 'Status Page', href: STATUS_PAGE_URL, external: true },
        ],
      },
    ],
    [serviceUrls],
  );

  return (
    <>
      <Box component="main" sx={{ flex: 1, pt: 2 }}>
        {isLoggedOut ? (
          <Container maxWidth="sm" sx={{ py: { xs: 8, md: 12 }, textAlign: 'center' }}>
            <Typography variant="h5" component="h1" gutterBottom>
              Sign in to access the Science Portal
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Use the Login button in the header to view your active sessions, check your
              storage, and launch new sessions.
            </Typography>
          </Container>
        ) : (
          <>
            <Container maxWidth="xl" sx={{ mb: 4, px: { xs: 2, sm: 3 } }}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', lg: 'row' },
                  gap: 3,
                  alignItems: { lg: isDesktopTopRow ? 'stretch' : 'flex-start' },
                }}
              >
                <Box
                  sx={{
                    flex: { xs: 1, lg: '0 0 80%' },
                    minWidth: 0,
                    display: { lg: isDesktopTopRow ? 'flex' : 'block' },
                    flexDirection: 'column',
                  }}
                >
                  <ActiveSessionsWidget
                    sessions={activeSessions}
                    operatingSessionIds={operatingSessionIds}
                    isLoading={isLoadingSessions}
                    onRefresh={handleSessionsRefresh}
                    fillHeight={isDesktopTopRow}
                  />
                </Box>

                <Box
                  sx={{
                    flex: { xs: 1, lg: '0 0 20%' },
                    minWidth: 0,
                    px: { xs: 1, sm: 2 },
                    display: { lg: isDesktopTopRow ? 'flex' : 'block' },
                    flexDirection: 'column',
                  }}
                >
                  <UserStorageWidget
                    data={storageSummary ?? null}
                    isLoading={isLoadingUserStorage}
                    errorMessage={storageError?.message}
                    onRefresh={handleStorageRefresh}
                    fillHeight={isDesktopTopRow}
                  />
                </Box>
              </Box>
            </Container>

            <Container maxWidth="xl" sx={{ mb: 4, px: { xs: 2, sm: 3 } }}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', lg: 'row' },
                  gap: 3,
                }}
              >
                <Box
                  sx={{
                    flex: { xs: 1, lg: '0 0 60%' },
                    minWidth: 0,
                  }}
                >
                  <LaunchFormWidget
                    helpUrl="https://www.opencadc.org/canfar/latest/platform/sessions/"
                    imagesByType={imagesByType}
                    repositoryHosts={imageRepositories
                      .map((repo) => repo.host)
                      .filter((host): host is string => Boolean(host))}
                    isLoading={isLoadingLaunchForm}
                    onRefresh={handleLaunchFormRefresh}
                    activeSessions={sessions}
                    launchSessionFn={handleLaunchSession}
                    coreOptions={context?.cores.options}
                    memoryOptions={context?.memoryGB.options}
                    gpuOptions={context?.gpus.options}
                  />
                </Box>

                <Box
                  sx={{
                    flex: { xs: 1, lg: '0 0 40%' },
                    minWidth: 0,
                    px: { xs: 1, sm: 2 },
                  }}
                >
                  <PlatformLoad
                    data={STATIC_PLATFORM_LOAD_DATA}
                    isLoading={false}
                    showDisabledOverlay
                  />
                </Box>
              </Box>
            </Container>
          </>
        )}
      </Box>

      {!isOIDCMode && <Footer sections={footerSections} copyright="© 2022-2026" />}
    </>
  );
}
