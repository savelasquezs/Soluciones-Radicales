import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('schema defaults', () => {
  it('default de technician_revenue_mode en schema es split', () => {
    const schemaPath = path.resolve(process.cwd(), 'src/infrastructure/database/schema.ts');
    const content = fs.readFileSync(schemaPath, 'utf8');
    expect(content).toContain("technicianRevenueMode: text('technician_revenue_mode').notNull().default('split')");
  });

  it('default de technician_revenue_mode en init.sql es split', () => {
    const initPath = path.resolve(process.cwd(), '../init.sql');
    const content = fs.readFileSync(initPath, 'utf8');
    expect(content).toContain("technician_revenue_mode TEXT NOT NULL DEFAULT 'split'");
  });
});
