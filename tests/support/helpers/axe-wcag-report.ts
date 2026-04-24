// Shared axe result helpers for accessibility specs — attachments + serious/critical filtering.

import type { AxeResults } from 'axe-core';
import type { TestInfo } from '@playwright/test';

export type AxeViolation = AxeResults['violations'][number];

export function seriousOrCritical(violations: AxeViolation[]): AxeViolation[] {
  return violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
}

function countByImpact(violations: AxeViolation[]): Record<string, number> {
  return violations.reduce<Record<string, number>>((acc, v) => {
    const k = v.impact ?? 'unknown';
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
}

/** Writes axe summary + violations (+ incomplete if any) to the Playwright / Allure report. */
export async function attachAxeReport(
  testInfo: TestInfo,
  slug: string,
  results: AxeResults,
): Promise<void> {
  const { violations, incomplete } = results;
  const summary = {
    url: slug,
    violationCount: violations.length,
    incompleteCount: incomplete?.length ?? 0,
    violationsByImpact: countByImpact(violations),
    violationIds: violations.map((v) => v.id),
  };

  await testInfo.attach(`axe-${slug}-summary.json`, {
    body: Buffer.from(JSON.stringify(summary, null, 2), 'utf-8'),
    contentType: 'application/json',
  });

  await testInfo.attach(`axe-${slug}-violations.json`, {
    body: Buffer.from(JSON.stringify(violations, null, 2), 'utf-8'),
    contentType: 'application/json',
  });

  if (incomplete?.length) {
    await testInfo.attach(`axe-${slug}-incomplete.json`, {
      body: Buffer.from(JSON.stringify(incomplete, null, 2), 'utf-8'),
      contentType: 'application/json',
    });
  }
}
