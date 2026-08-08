'use client';

import { useMemo, useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
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
import { useSessions, useLaunchSession } from '@/lib/hooks/useSessions';
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
import { SessionModalsHost } from '@/lib/features/sessions/SessionModalsHost';
import { DashboardLayoutToolbar } from '@/lib/features/sessions/DashboardLayoutToolbar';
import { DashboardLayoutEditProvider } from '@/lib/features/sessions/DashboardLayoutEditContext';
import { useDashboardLayout } from '@/lib/features/sessions/useDashboardLayout';
import { DASHBOARD_CUSTOMIZE_MIN_BREAKPOINT } from '@/lib/features/sessions/dashboardLayout';
import {
  DashboardGridSkeleton,
  createDashboardGridItem,
} from '@/lib/features/sessions/dashboardGridUi';

/** Code-split react-grid-layout so it is not on the critical auth/data path. */
const DashboardGrid = dynamic(
  () =>
    import('@/lib/features/sessions/DashboardGrid').then((mod) => ({
      default: mod.DashboardGrid,
    })),
  {
    ssr: false,
    loading: () => <DashboardGridSkeleton />,
  },
);

const LAUNCH_HELP_URL = 'https://www.opencadc.org/canfar/latest/platform/sessions/';

export function SessionsDashboard() {
  const theme = useTheme();
  const canCustomizeLayout = useMediaQuery(
    theme.breakpoints.up(DASHBOARD_CUSTOMIZE_MIN_BREAKPOINT),
  );
  const { useCanfar, serviceUrls } = usePublicRuntimeConfig();
  const isOIDCMode = !useCanfar;

  const { data: authStatus, isLoading: authLoading } = useAuthStatus();
  const isAuthenticated = authStatus?.authenticated ?? false;
  // Widgets render only for authenticated users; while the auth check is in
  // flight they stay mounted in their loading state to avoid a layout flash.
  const isLoggedOut = !authLoading && !isAuthenticated;

  const operatingSessionIds = useOperatingSessionIds();
  const { clearOperating } = useSessionUiActions();

  const [isEditingLayout, setIsEditingLayout] = useState(false);
  const {
    layouts,
    hiddenIds,
    availableWidgetIds,
    canHideWidget,
    layoutEpoch,
    hydrated,
    onLayoutChange,
    onInteractionStart,
    onInteractionStop,
    hideWidget,
    showWidget,
    resetLayouts,
  } = useDashboardLayout();

  const hiddenIdSet = useMemo(() => new Set(hiddenIds), [hiddenIds]);

  // Exit edit mode when viewport shrinks below md (drag/resize disabled there).
  useEffect(() => {
    if (!canCustomizeLayout && isEditingLayout) {
      setIsEditingLayout(false);
    }
  }, [canCustomizeLayout, isEditingLayout]);

  const {
    data: sessions = [],
    isLoading: isLoadingSessionsQuery,
    isFetching: isFetchingSessions,
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

  const { mutateAsync: launchSessionAsync } = useLaunchSession();

  const handleLaunchSession = useCallback(
    async (params: SessionLaunchParams): Promise<Session> => {
      return await launchSessionAsync(params);
    },
    [launchSessionAsync],
  );

  // isLoading = initial load, no data yet → widgets render skeletons.
  // isFetching = background refetch → widgets keep content, status bar animates.
  const isLoadingSessions = authLoading || (isAuthenticated && isLoadingSessionsQuery);

  const isLoadingLaunchForm =
    authLoading ||
    (isAuthenticated && (isLoadingImages || isLoadingRepositories || isLoadingContext));
  const isFetchingLaunchForm =
    isAuthenticated && (isFetchingImages || isFetchingRepositories || isFetchingContext);

  const isLoadingUserStorage = authLoading || (isAuthenticated && isLoadingStorageSummary);

  // A deleted session keeps its "Terminating" card state until the server
  // confirms it's gone, i.e. the session no longer appears in the refetched
  // list. (Renew marks are cleared by the mutation callbacks instead.)
  useEffect(() => {
    operatingSessionIds.forEach((operation, sessionId) => {
      if (operation === 'delete' && !sessions.some((s) => s.id === sessionId)) {
        clearOperating(sessionId);
      }
    });
  }, [sessions, operatingSessionIds, clearOperating]);

  const activeSessions: SessionCardProps[] = useMemo(() => {
    return sessions
      .filter(
        (session: Session) =>
          session.sessionType !== 'headless' && session.sessionType !== 'desktop-app',
      )
      .map((session: Session) => ({
        id: session.id,
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
      }));
  }, [sessions]);

  const repositoryHosts = useMemo(
    () =>
      imageRepositories
        .map((repo) => repo.host)
        .filter((host): host is string => Boolean(host)),
    [imageRepositories],
  );

  const handleStorageRefresh = useCallback(() => {
    void refetchStorage();
  }, [refetchStorage]);

  const handleLaunchFormRefresh = useCallback(() => {
    refetchImages();
    refetchRepositories();
    refetchContext();
  }, [refetchImages, refetchRepositories, refetchContext]);

  const handleToggleEditing = useCallback(() => {
    setIsEditingLayout((prev) => !prev);
  }, []);

  const coreOptions = context?.cores.options;
  const memoryOptions = context?.memoryGB.options;
  const gpuOptions = context?.gpus.options;
  const storageErrorMessage = storageError?.message;
  const isFetchingSessionsFlag = isAuthenticated && isFetchingSessions;
  const isFetchingStorageFlag = isAuthenticated && isFetchingStorageSummary;

  /**
   * Stable children array (not a Fragment) — react-grid-layout only sees
   * immediate keyed children; a Fragment would hide all widgets.
   * Hidden widgets are omitted so RGL collapses their slots.
   */
  const gridWidgets = useMemo(() => {
    const items = [
      {
        id: 'active-sessions' as const,
        node: (
          <ActiveSessionsWidget
            sessions={activeSessions}
            operatingSessionIds={operatingSessionIds}
            isLoading={isLoadingSessions}
            isFetching={isFetchingSessionsFlag}
            onRefresh={refetchSessions}
            fillHeight
          />
        ),
      },
      {
        id: 'user-storage' as const,
        node: (
          <UserStorageWidget
            data={storageSummary ?? null}
            isLoading={isLoadingUserStorage}
            isFetching={isFetchingStorageFlag}
            errorMessage={storageErrorMessage}
            onRefresh={handleStorageRefresh}
            fillHeight
          />
        ),
      },
      {
        id: 'launch-form' as const,
        node: (
          <LaunchFormWidget
            helpUrl={LAUNCH_HELP_URL}
            imagesByType={imagesByType}
            repositoryHosts={repositoryHosts}
            isLoading={isLoadingLaunchForm}
            isFetching={isFetchingLaunchForm}
            onRefresh={handleLaunchFormRefresh}
            activeSessions={sessions}
            launchSessionFn={handleLaunchSession}
            coreOptions={coreOptions}
            memoryOptions={memoryOptions}
            gpuOptions={gpuOptions}
            fillHeight
          />
        ),
      },
      {
        id: 'platform-load' as const,
        node: (
          <PlatformLoad
            data={STATIC_PLATFORM_LOAD_DATA}
            isLoading={false}
            showDisabledOverlay
            fillHeight
          />
        ),
      },
    ];

    return items
      .filter((item) => !hiddenIdSet.has(item.id))
      .map((item) => createDashboardGridItem(item.id, item.node));
  }, [
    activeSessions,
    operatingSessionIds,
    isLoadingSessions,
    isFetchingSessionsFlag,
    refetchSessions,
    storageSummary,
    isLoadingUserStorage,
    isFetchingStorageFlag,
    storageErrorMessage,
    handleStorageRefresh,
    imagesByType,
    repositoryHosts,
    isLoadingLaunchForm,
    isFetchingLaunchForm,
    handleLaunchFormRefresh,
    sessions,
    handleLaunchSession,
    coreOptions,
    memoryOptions,
    gpuOptions,
    hiddenIdSet,
  ]);

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
      <SessionModalsHost />
      <Box component="main" sx={{ flex: 1, pt: 2 }}>
        {isLoggedOut ? (
          <Container maxWidth="sm" sx={{ py: { xs: 8, md: 12 }, textAlign: 'center' }}>
            <Typography variant="h5" component="h1" gutterBottom>
              Sign in to access the Science Portal
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Use the Login button in the header to view your active sessions, check your storage,
              and launch new sessions.
            </Typography>
          </Container>
        ) : (
          <Container maxWidth="xl" sx={{ mb: 4, px: { xs: 2, sm: 3 } }}>
            <DashboardLayoutEditProvider
              isEditing={isEditingLayout && canCustomizeLayout}
              canHideWidget={canHideWidget}
              hideWidget={hideWidget}
            >
              <DashboardLayoutToolbar
                isEditing={isEditingLayout}
                onToggleEditing={handleToggleEditing}
                onReset={resetLayouts}
                availableWidgetIds={availableWidgetIds}
                onShowWidget={showWidget}
                visible={canCustomizeLayout}
              />
              {!hydrated ? (
                <DashboardGridSkeleton />
              ) : (
                <DashboardGrid
                  layouts={layouts}
                  layoutEpoch={layoutEpoch}
                  isEditing={isEditingLayout}
                  onLayoutChange={onLayoutChange}
                  onInteractionStart={onInteractionStart}
                  onInteractionStop={onInteractionStop}
                >
                  {gridWidgets}
                </DashboardGrid>
              )}
            </DashboardLayoutEditProvider>
          </Container>
        )}
      </Box>

      {!isOIDCMode && <Footer sections={footerSections} copyright="© 2022-2026" />}
    </>
  );
}
