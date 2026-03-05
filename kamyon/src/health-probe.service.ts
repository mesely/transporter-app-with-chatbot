import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { UsersService } from './users/users.service';

type ProbeReport = {
  ok: boolean;
  ts: number;
  durationMs: number;
  totals: {
    all: number;
    kurtarici: number;
    nakliye: number;
    sarj: number;
    yolcu: number;
  };
  error?: string;
};

@Injectable()
export class HealthProbeService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(HealthProbeService.name);
  private readonly intervalMs = 10 * 60 * 1000;
  private timer: NodeJS.Timeout | null = null;
  private lastReport: ProbeReport | null = null;
  private running = false;

  constructor(private readonly usersService: UsersService) {}

  onModuleInit() {
    void this.runProbe();
    this.timer = setInterval(() => {
      void this.runProbe();
    }, this.intervalMs);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  getLastReport() {
    return this.lastReport;
  }

  private async runProbe() {
    if (this.running) return;
    this.running = true;
    const startedAt = Date.now();
    try {
      const [all, kurtarici, nakliye, sarj, yolcu] = await Promise.all([
        this.usersService.findNearby(41.0082, 28.9784, '', 4.8, undefined, 240),
        this.usersService.findNearby(41.0082, 28.9784, 'kurtarici', 4.8, undefined, 240),
        this.usersService.findNearby(41.0082, 28.9784, 'nakliye', 4.8, undefined, 240),
        this.usersService.findNearby(41.0082, 28.9784, 'sarj', 4.8, undefined, 240),
        this.usersService.findNearby(41.0082, 28.9784, 'yolcu', 4.8, undefined, 240),
      ]);

      const report: ProbeReport = {
        ok: true,
        ts: Date.now(),
        durationMs: Date.now() - startedAt,
        totals: {
          all: Array.isArray(all) ? all.length : 0,
          kurtarici: Array.isArray(kurtarici) ? kurtarici.length : 0,
          nakliye: Array.isArray(nakliye) ? nakliye.length : 0,
          sarj: Array.isArray(sarj) ? sarj.length : 0,
          yolcu: Array.isArray(yolcu) ? yolcu.length : 0,
        },
      };
      this.lastReport = report;
      this.logger.log(
        `[provider-probe] ok duration=${report.durationMs}ms all=${report.totals.all} k=${report.totals.kurtarici} n=${report.totals.nakliye} s=${report.totals.sarj} y=${report.totals.yolcu}`,
      );
    } catch (error: any) {
      const report: ProbeReport = {
        ok: false,
        ts: Date.now(),
        durationMs: Date.now() - startedAt,
        totals: { all: 0, kurtarici: 0, nakliye: 0, sarj: 0, yolcu: 0 },
        error: String(error?.message || error || 'unknown_error'),
      };
      this.lastReport = report;
      this.logger.error(`[provider-probe] failed: ${report.error}`);
    } finally {
      this.running = false;
    }
  }
}
