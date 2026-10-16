/**
 * Data structure for metric series
 */
export interface MetricSeries {
  /**
   * The label for this data point
   */
  name: string;
  /**
   * The used/occupied value
   */
  used: number;
  /**
   * The free/available value
   */
  free: number;
  /**
   * Index signature to match BarChartDataItem
   * Additional properties can be added for custom segments
   */
  [key: string]: number | string | undefined;
}

/**
 * Props for the MetricBlock component
 */
export interface MetricBlockProps {
  /**
   * The label for the metric (e.g., 'CPU', 'RAM')
   */
  label: string;
  /**
   * The data series for the metric. Unused when `unavailable` is set.
   */
  series?: MetricSeries;
  /**
   * The maximum value for the metric (used for chart domain)
   */
  max?: number;
  /**
   * Whether the metric is in a loading state
   */
  isLoading?: boolean;
  /**
   * Render the meter muted with no usage reading.
   * Used when the cluster does not report this resource.
   */
  unavailable?: boolean;
  /**
   * Optional custom class name
   */
  className?: string;
}
