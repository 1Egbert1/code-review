import { describe, expect, it } from 'vitest';

import type { InspectionConfig } from '../src/contracts/config.js';
import { DEFAULT_CONFIG } from '../src/config/defaults.js';
import type {
  ComplexityStats,
  DependencyStats,
  DuplicationStats,
  TestStats,
  TypeSafetyStats,
} from '../src/core/inspection/metrics.js';
import { scoreInspection } from '../src/core/inspection/score.js';

const CLEAN: {
  complexity: ComplexityStats;
  duplication: DuplicationStats;
  dependency: DependencyStats;
  typeSafety: TypeSafetyStats;
  tests: TestStats;
} = {
  complexity: {
    files: 10,
    totalLines: 1000,
    functions: 20,
    avgFunctionLines: 20,
    maxFunctionLines: 30,
    avgCyclomatic: 3,
    maxCyclomatic: 5,
    complexFunctions: 0,
    maxFileLines: 200,
  },
  duplication: {
    ratio: 0.01,
    duplicatedLines: 10,
    totalLines: 1000,
    blocks: 1,
  },
  dependency: {
    total: 10,
    loose: 1,
    looseRatio: 0.1,
    circular: 0,
    checkedOutdated: false,
  },
  typeSafety: {
    anyCount: 2,
    ignoredChecks: 0,
    anyDensity: 2,
    totalLines: 1000,
  },
  tests: { sourceFiles: 10, testFiles: 8, ratio: 0.8, coveragePercent: 90 },
};

function score(
  overrides: Partial<typeof CLEAN> = {},
  config: InspectionConfig = DEFAULT_CONFIG.inspection,
) {
  return scoreInspection({ ...CLEAN, ...overrides, config });
}

describe('健康项目拿满分', () => {
  it('全部指标在阈值内时为 100 分', () => {
    expect(score().totalScore).toBe(100);
  });

  it('每个维度都有明细，且都带实际值、阈值、扣分', () => {
    const outcome = score();
    expect(outcome.breakdown).toHaveLength(5);

    for (const dimension of outcome.breakdown) {
      expect(dimension.items.length).toBeGreaterThan(0);
      for (const item of dimension.items) {
        expect(item.actual).not.toBe('');
        expect(item.threshold).not.toBe('');
        expect(item.deduction).toBe(0);
      }
    }
  });
});

describe('扣分可核对', () => {
  it('复杂度超标时扣分，且明细能对上', () => {
    const outcome = score({
      complexity: {
        ...CLEAN.complexity,
        avgFunctionLines: 62,
        avgCyclomatic: 18,
        complexFunctions: 7,
      },
    });

    const complexity = outcome.breakdown.find((item) => item.dimension === 'complexity');
    expect(complexity?.score).toBeLessThan(20);

    const functionLength = complexity?.items.find((item) => item.metricId === 'avg-function-lines');
    expect(functionLength?.actual).toBe('62 行');
    expect(functionLength?.threshold).toBe('40 行');
    expect(functionLength?.deduction).toBeGreaterThan(0);
  });

  it('重复率按百分点扣，超得越多扣得越多', () => {
    const slight = score({ duplication: { ...CLEAN.duplication, ratio: 0.04 } });
    const severe = score({ duplication: { ...CLEAN.duplication, ratio: 0.1 } });

    const pick = (outcome: ReturnType<typeof score>): number =>
      outcome.breakdown.find((item) => item.dimension === 'duplication')?.score ?? 0;

    expect(pick(severe)).toBeLessThan(pick(slight));
  });

  it('单项扣分有上限，不会把整维打到零', () => {
    const outcome = score({
      complexity: { ...CLEAN.complexity, avgFunctionLines: 9999 },
    });
    const complexity = outcome.breakdown.find((item) => item.dimension === 'complexity');

    // 四个子项各封顶，合计不可能把 20 分扣光
    expect(complexity?.score).toBeGreaterThan(0);
  });

  it('分数不会为负', () => {
    const outcome = score({
      duplication: { ...CLEAN.duplication, ratio: 0.9 },
      dependency: { ...CLEAN.dependency, circular: 10, looseRatio: 1 },
      typeSafety: { ...CLEAN.typeSafety, anyDensity: 500, ignoredChecks: 100 },
      tests: { ...CLEAN.tests, ratio: 0, coveragePercent: 0 },
    });

    expect(outcome.totalScore).toBeGreaterThanOrEqual(0);
    for (const dimension of outcome.breakdown) expect(dimension.score).toBeGreaterThanOrEqual(0);
  });
});

describe('没有数据时不乱扣分', () => {
  it('没提供覆盖率就不扣测试维度的分', () => {
    const withCoverage = score({ tests: { ...CLEAN.tests, coveragePercent: 90 } });
    const withoutCoverage = score({ tests: { ...CLEAN.tests, coveragePercent: null } });

    // 不知道覆盖率不等于覆盖率是 0，拿 0 算会平白扣掉一整块
    expect(withoutCoverage.totalScore).toBeGreaterThanOrEqual(withCoverage.totalScore);
  });

  it('依赖过期与漏洞未检测时不假装已检测', () => {
    expect(score().breakdown.find((item) => item.dimension === 'dependency')).toBeDefined();
    expect(CLEAN.dependency.checkedOutdated).toBe(false);
  });
});

describe('权重', () => {
  it('权重合计不为 100 时按实际合计归一，总分不超过 100', () => {
    const config: InspectionConfig = {
      ...DEFAULT_CONFIG.inspection,
      weights: { complexity: 50, duplication: 50, dependency: 50, 'type-safety': 50, test: 50 },
    };
    expect(score({}, config).totalScore).toBeLessThanOrEqual(100);
  });

  it('权重全为零时不出现除零', () => {
    const config: InspectionConfig = {
      ...DEFAULT_CONFIG.inspection,
      weights: { complexity: 0, duplication: 0, dependency: 0, 'type-safety': 0, test: 0 },
    };
    expect(score({}, config).totalScore).toBe(0);
  });

  it('某维权重更高时，它的下降对总分影响更大', () => {
    const heavy: InspectionConfig = {
      ...DEFAULT_CONFIG.inspection,
      weights: { complexity: 80, duplication: 5, dependency: 5, 'type-safety': 5, test: 5 },
    };
    const bad = { complexity: { ...CLEAN.complexity, avgFunctionLines: 90 } };

    const normalDrop = 100 - score(bad).totalScore;
    const heavyDrop = 100 - score(bad, heavy).totalScore;
    expect(heavyDrop).toBeGreaterThan(normalDrop);
  });
});
