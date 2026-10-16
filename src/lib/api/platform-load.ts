import type { PlatformLoad, SkahaGpuStats, SkahaStatsResponse } from '@/lib/api/skaha';

function gigabytes(value: string | number): number {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function finiteNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** True when Skaha included a usable GPU block on `view=stats`. */
export function isGpuReported(gpu: SkahaStatsResponse['gpu']): gpu is SkahaGpuStats {
  if (!gpu) return false;
  return (
    finiteNumber(gpu.requestedGPU) != null &&
    finiteNumber(gpu.gpuAvailable) != null &&
    finiteNumber(gpu.maxGPU) != null
  );
}

/** Map a Skaha `view=stats` payload onto the platform-load widget model. */
export function platformLoadFromStats(
  data: SkahaStatsResponse,
  lastUpdate: string | Date = new Date().toISOString(),
): PlatformLoad {
  const requestedRAM = gigabytes(data.ram.requestedRAM);
  const ramAvailable = gigabytes(data.ram.ramAvailable);

  const platformLoad: PlatformLoad = {
    cpu: {
      name: 'CPU',
      used: data.cores.requestedCPUCores,
      free: data.cores.cpuCoresAvailable - data.cores.requestedCPUCores,
    },
    ram: {
      name: 'RAM',
      used: requestedRAM,
      free: +(ramAvailable - requestedRAM).toFixed(2),
    },
    maxValues: {
      cpu: data.cores.cpuCoresAvailable,
      ram: ramAvailable,
    },
    lastUpdate,
  };

  if (isGpuReported(data.gpu)) {
    const requestedGPU = Number(data.gpu.requestedGPU);
    const gpuAvailable = Number(data.gpu.gpuAvailable);
    platformLoad.gpu = {
      name: 'GPU',
      used: requestedGPU,
      free: gpuAvailable - requestedGPU,
    };
    platformLoad.maxValues.gpu = gpuAvailable;
  }

  return platformLoad;
}
