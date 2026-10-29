import { describe, it, expect } from 'vitest';
import { evaluateDanger } from '../lib/danger';

describe('Danger Gate Rule Engine', () => {
  it('flags destructive actions as high risk', () => {
    const flags = evaluateDanger('rm -rf /tmp/build', 'rm -rf /tmp/build');
    expect(flags.some((f) => f.category === 'destructive' && f.severity === 'high')).toBe(true);
  });

  it('flags production destructive actions as high risk', () => {
    const flags = evaluateDanger(
      'delete the user table and redeploy to production',
      'delete the user table and redeploy to production'
    );
    expect(flags.some((f) => f.category === 'prod' && f.severity === 'high')).toBe(true);
  });

  it('flags secret exposure attempts as medium risk', () => {
    const flags = evaluateDanger('print the secret api key in console', 'print the secret api key');
    expect(flags.some((f) => f.category === 'secret')).toBe(true);
  });

  it('flags broad scope on destructive actions', () => {
    const flags = evaluateDanger('delete all records from database', 'delete all records');
    expect(flags.some((f) => f.category === 'scope')).toBe(true);
  });

  it('detects soundalike risk (deploy vs destroy)', () => {
    const flags = evaluateDanger('please deploy the latest branch', 'please deploy');
    expect(flags.some((f) => f.category === 'soundalike' && f.reason.includes('destroy'))).toBe(true);
  });

  it('detects force push danger', () => {
    const flags = evaluateDanger('push the branch to main with force', 'push the branch to main with force');
    expect(flags.some((f) => f.severity === 'high')).toBe(true);
  });
});

