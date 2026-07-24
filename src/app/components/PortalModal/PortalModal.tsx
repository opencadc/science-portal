import { PortalModalImpl } from '@/app/implementation/portalModal';
import type { PortalModalProps } from '@/app/types/PortalModalProps';

/**
 * Unified modal shell for portal session dialogs and similar overlays.
 *
 * @example
 * ```tsx
 * <PortalModal
 *   open={open}
 *   onClose={onClose}
 *   title="Container Events"
 *   isLoading={isLoading}
 *   isFetching={isFetching}
 *   onRefresh={() => void refetch()}
 *   refreshAriaLabel="refresh events"
 *   refreshTooltip="Refresh events"
 * >
 *   {content}
 * </PortalModal>
 * ```
 */
export const PortalModal = (props: PortalModalProps) => {
  return <PortalModalImpl {...props} />;
};
