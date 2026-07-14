import { DashboardWidgetImpl } from '@/app/implementation/dashboardWidget';
import type { DashboardWidgetProps } from '@/app/types/DashboardWidgetProps';

/**
 * DashboardWidget — the universal shell shared by all portal dashboard widgets.
 *
 * Owns the common chrome: outlined Paper, header (title, optional help link or
 * popover, optional refresh button), loading status bar, error alert, and an
 * optional caption footer.
 *
 * Everything domain-specific is composed in by the caller:
 * - data fetching (React Query hooks) and store wiring stay in the widget
 *   that uses this shell — pass the results down as `isLoading` / `error` /
 *   `onRefresh`;
 * - content, empty states, and any attached modals are rendered as `children`.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = useMyWidgetData();
 * return (
 *   <DashboardWidget
 *     title="My Widget"
 *     isLoading={isLoading}
 *     error={error?.message}
 *     onRefresh={() => void refetch()}
 *     help={{ url: DOCS_URL }}
 *   >
 *     {data ? <MyContent data={data} /> : <MyEmptyState />}
 *     <MyModal />
 *   </DashboardWidget>
 * );
 * ```
 */
export function DashboardWidget(props: DashboardWidgetProps) {
  return <DashboardWidgetImpl {...props} />;
}
