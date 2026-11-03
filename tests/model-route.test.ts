import { describe, expect, it } from 'vitest';

import type { RoutingConfig } from '../src/contracts/config.js';
import { DEFAULT_CONFIG } from '../src/config/defaults.js';
import { computeFileRisk, routeModel } from '../src/core/routing/model-route.js';

const CONFIG: RoutingConfig = {
  enabled: true,
  tiers: {
    strong: { model: 'big-model' },
    standard: { model: 'mid-model' },
    cheap: { model: 'small-model' },
  },
  byDimension: { correctness: 'strong', security: 'strong', convention: 'cheap' },
  fileRiskThreshold: 40,
  smallChangeLines: 0,
  defaultTier: 'standard',
};

describe('文件风险', () => {
  it('鉴权与资金路径得分最高', () => {
    expect(computeFileRisk('src/auth/login.ts', 5).score).toBeGreaterThanOrEqual(45);
    expect(computeFileRisk('src/payment/charge.ts', 5).score).toBeGreaterThanOrEqual(40);
  });

  it('普通工具函数不加分', () => {
    const risk = computeFileRisk('src/utils/format.ts', 3);
    expect(risk.score).toBe(0);
    expect(risk.reasons).toEqual([]);
  });

  it('改动大也加分，但 20 行以内不加', () => {
    expect(computeFileRisk('src/utils/format.ts', 20).score).toBe(0);
    expect(computeFileRisk('src/utils/format.ts', 100).score).toBeGreaterThan(0);
  });

  it('分数封顶 100', () => {
    expect(computeFileRisk('src/auth/payment/crypto/api/x.ts', 1000).score).toBe(100);
  });

  it('理由可读，能解释为什么这个文件用了强模型', () => {
    const risk = computeFileRisk('src/auth/session.ts', 5);
    expect(risk.reasons.join('')).toContain('鉴权');
  });
});

describe('路由优先级', () => {
  it('高危文件优先于维度映射：正确性本来就该用强模型，但安全维度的普通文件不该', () => {
    const risky = routeModel({
      config: CONFIG,
      reviewer: 'convention',
      filePath: 'src/auth/login.ts',
      changedLines: 10,
    });
    expect(risky.tier).toBe('strong');
    expect(risky.reason).toContain('文件风险');
  });

  it('无风险文件按维度走', () => {
    expect(
      routeModel({
        config: CONFIG,
        reviewer: 'convention',
        filePath: 'src/utils/a.ts',
        changedLines: 5,
      }).tier,
    ).toBe('cheap');
    expect(
      routeModel({
        config: CONFIG,
        reviewer: 'correctness',
        filePath: 'src/utils/a.ts',
        changedLines: 5,
      }).tier,
    ).toBe('strong');
  });

  it('规模降档默认关闭：小改动不该自动降档', () => {
    const decision = routeModel({
      config: CONFIG,
      reviewer: 'correctness',
      filePath: 'src/utils/a.ts',
      changedLines: 3,
    });
    expect(decision.tier).toBe('strong');
  });

  it('显式开启规模降档后才降', () => {
    const decision = routeModel({
      config: { ...CONFIG, smallChangeLines: 10 },
      reviewer: 'correctness',
      filePath: 'src/utils/a.ts',
      changedLines: 3,
    });
    expect(decision.tier).toBe('cheap');
  });

  it('路由关闭时用默认档位', () => {
    expect(
      routeModel({
        config: { ...CONFIG, enabled: false },
        reviewer: 'correctness',
        filePath: 'a.ts',
        changedLines: 1,
      }).tier,
    ).toBe('default');
  });

  it('档位没配模型时返回 null，由调用方回落到默认模型', () => {
    const decision = routeModel({
      config: { ...CONFIG, tiers: {} },
      reviewer: 'correctness',
      filePath: 'src/utils/a.ts',
      changedLines: 5,
    });
    expect(decision.model).toBeNull();
    expect(decision.tier).toBe('strong');
  });
});

describe('默认配置', () => {
  it('规模降档默认关闭——小改动往往最需要准确判断', () => {
    expect(DEFAULT_CONFIG.routing.smallChangeLines).toBe(0);
  });

  it('规范性走便宜档，正确性与安全性走强档', () => {
    expect(DEFAULT_CONFIG.routing.byDimension.convention).toBe('cheap');
    expect(DEFAULT_CONFIG.routing.byDimension.correctness).toBe('strong');
  });
});
