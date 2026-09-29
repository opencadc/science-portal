import React from 'react';
import { MetricBlockProps } from '../../types/MetricBlockProps';
import { MetricBlockImpl } from '../../implementation/metricBlock';

/**
 * MetricBlock: labeled usage meter (CPUs / Memory) with percent fill.
 *
 * @example
 * ```tsx
 * <MetricBlock
 *   label="CPU"
 *   series={{ name: 'CPU usage', used: 65, free: 35 }}
 *   max={100}
 * />
 * ```
 */
export const MetricBlock: React.FC<MetricBlockProps> = (props) => {
  return <MetricBlockImpl {...props} />;
};
