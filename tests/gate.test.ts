import { describe, expect, it } from 'vitest';

import type { GateConfig } from '../src/contracts/config.js';
import type { Finding, Severity } from '../src/contracts/index.js';
import { DEFAULT_CONFIG } from '../src/config/defaults.js';
import { decideGate, evaluateGate, gateTitle } from '../src/core/gate/gate.js';
import type { Exemption } from '../src/core/gate/gate.js';

const CONFIG: GateConfig = {
  enabled: true,
  blockingSeverity: 'blocker',
  blockingCategories: ['null-safety', 'authz'],
  confidenceThreshold: 0.8,
  exemptionStore: 'issue-comment',
};

function finding(overrides: Partial<Finding> = {}): Finding {
  return {
    fingerprint: 'fp1',
    reviewer: 'correctness',
    anchor: { file: 'src/a.ts', oldPath: null, kind: 'added', newLine: 10, oldLine: null },
    positionOrigin: 'model-line',
    severity: 'blocker',
    category: 'null-safety',
    title: '空指针',
    body: 'b',
    evidence: 'return v.y;',
    suggestion: null,
    confidence: 0.9,
    preexisting: false,
    scope: 'changed',
    ...overrides,
  };
}

const NONE: readonly Exemption[] = [];

describe('致命判定是合取，缺一不阻塞', () => {
  it('四个条件都满足才阻塞', () => {
    expect(decideGate(finding(), CONFIG, false, NONE).block).toBe(true);
  });

  it('严重度不到致命就不阻塞——标致命是最廉价的动作', () => {
    for (const severity of ['major', 'minor', 'nit'] as Severity[]) {
      expect(decideGate(finding({ severity }), CONFIG, false, NONE).block).toBe(false);
    }
  });

  it('类别不在白名单不阻塞', () => {
    expect(decideGate(finding({ category: 'naming' }), CONFIG, false, NONE).block).toBe(false);
  });

  it('置信度不达标不阻塞', () => {
    const decision = decideGate(finding({ confidence: 0.5 }), CONFIG, false, NONE);
    expect(decision.block).toBe(false);
    expect(decision.reason).toContain('置信度');
  });

  it('规则事实不看置信度：确定性代码没有「把握」这回事', () => {
    expect(decideGate(finding({ confidence: 0.1 }), CONFIG, true, NONE).block).toBe(true);
  });

  it('门禁未启用时一律不阻塞', () => {
    expect(decideGate(finding(), { ...CONFIG, enabled: false }, false, NONE).block).toBe(false);
  });
});

describe('豁免', () => {
  const exemption: Exemption = {
    fingerprint: 'fp1',
    reason: '误判',
    by: 'alice',
    at: '2026-11-03T00:00:00Z',
  };

  it('指纹命中就不再阻塞', () => {
    expect(decideGate(finding(), CONFIG, false, [exemption]).block).toBe(false);
  });

  it('豁免绑定指纹，代码一改指纹就变，自动失效', () => {
    // 指纹含证据文本：证据变了就是另一条问题，旧豁免自然不适用
    const changed = finding({ fingerprint: 'fp2' });
    expect(decideGate(changed, CONFIG, false, [exemption]).block).toBe(true);
  });
});

describe('汇总', () => {
  it('有阻塞项时结论为 failure', () => {
    const outcome = evaluateGate({ findings: [finding()], config: CONFIG, exemptions: NONE });
    expect(outcome.conclusion).toBe('failure');
    expect(outcome.blockers).toHaveLength(1);
  });

  it('没有阻塞项时结论为 success，不返回 neutral——中性会让必需检查卡住', () => {
    const outcome = evaluateGate({
      findings: [finding({ severity: 'minor' })],
      config: CONFIG,
      exemptions: NONE,
    });
    expect(outcome.conclusion).toBe('success');
  });

  it('被豁免的单独统计，豁免率是可观察指标', () => {
    const exemption: Exemption = { fingerprint: 'fp1', reason: 'r', by: 'a', at: '' };
    const outcome = evaluateGate({
      findings: [finding()],
      config: CONFIG,
      exemptions: [exemption],
    });

    expect(outcome.conclusion).toBe('success');
    expect(outcome.exempted).toHaveLength(1);
  });

  it('本可阻塞但差一点的条目要留原因，便于解释为什么没挡住', () => {
    const outcome = evaluateGate({
      findings: [finding({ confidence: 0.3 })],
      config: CONFIG,
      exemptions: NONE,
    });
    expect(outcome.demoted[0]?.reason).toContain('置信度');
  });

  it('门禁关闭时结论为 neutral，表示「没参与判断」', () => {
    const outcome = evaluateGate({
      findings: [finding()],
      config: { ...CONFIG, enabled: false },
      exemptions: NONE,
    });
    expect(outcome.conclusion).toBe('neutral');
  });

  it('标题能一眼看出结果', () => {
    const blocked = evaluateGate({ findings: [finding()], config: CONFIG, exemptions: NONE });
    expect(gateTitle(blocked)).toContain('阻止合并');

    const passed = evaluateGate({ findings: [], config: CONFIG, exemptions: NONE });
    expect(gateTitle(passed)).toBe('通过');
  });
});

describe('默认配置的类别必须与维度 schema 对得上', () => {
  it('默认阻塞类别都是真实存在的类别名', () => {
    // 写抽象名（'crash'）会让门禁永远不触发，而这个错配置校验查不出来
    const known = new Set([
      'null-safety',
      'logic',
      'concurrency',
      'error-handling',
      'resource',
      'boundary',
      'injection',
      'authz',
      'secret-exposure',
      'unsafe-deserialization',
      'path-traversal',
      'ssrf',
      'crypto-misuse',
      'frontend-exposure',
    ]);

    for (const category of DEFAULT_CONFIG.gate.blockingCategories) {
      expect(known.has(category)).toBe(true);
    }
  });
});
