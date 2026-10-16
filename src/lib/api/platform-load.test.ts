import { describe, expect, it } from 'vitest';

import { platformLoadFromStats } from './platform-load';
import type { SkahaStatsResponse } from './skaha';

const stats: SkahaStatsResponse = {
  cores: {
    requestedCPUCores: 873.25,
    cpuCoresAvailable: 3000,
    maxCPUCores: { cpuCores: 16, withRam: '192G' },
  },
  ram: {
    requestedRAM: '9432.822G',
    ramAvailable: '15032.386G',
    maxRAM: { ram: '192G', withCPUCores: 16 },
  },
  gpu: { requestedGPU: 15, gpuAvailable: 112, maxGPU: 7 },
};

describe('platformLoadFromStats', () => {
  it('maps CPU, RAM, and GPU from the stats payload', () => {
    const load = platformLoadFromStats(stats, '2026-10-15T00:00:00.000Z');

    expect(load.cpu).toEqual({ name: 'CPU', used: 873.25, free: 2126.75 });
    expect(load.ram).toEqual({ name: 'RAM', used: 9432.822, free: 5599.56 });
    expect(load.gpu).toEqual({ name: 'GPU', used: 15, free: 97 });
    expect(load.maxValues).toEqual({ cpu: 3000, ram: 15032.386, gpu: 112 });
    expect(load.lastUpdate).toBe('2026-10-15T00:00:00.000Z');
  });

  it('omits GPU when the cluster does not report it', () => {
    const { gpu: _gpu, ...withoutGpu } = stats;
    const load = platformLoadFromStats(withoutGpu);

    expect(load.gpu).toBeUndefined();
    expect(load.maxValues.gpu).toBeUndefined();
    expect(load.cpu.used).toBe(873.25);
  });

  it('omits GPU when the block is null or incomplete', () => {
    expect(platformLoadFromStats({ ...stats, gpu: null }).gpu).toBeUndefined();
    expect(
      platformLoadFromStats({
        ...stats,
        gpu: { requestedGPU: 1, gpuAvailable: Number.NaN, maxGPU: 1 },
      }).gpu,
    ).toBeUndefined();
  });
});
