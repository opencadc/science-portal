import { describe, expect, it } from 'vitest';
import {
  REDACTED,
  cookieNames,
  redactBodyText,
  redactHeaderRecord,
  redactSecrets,
} from './redact';

describe('redactHeaderRecord', () => {
  it('replaces credential headers and leaves the rest', () => {
    expect(
      redactHeaderRecord({
        Accept: 'application/json',
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.payload.sig',
        Cookie: 'CADC_SSO=abc; authjs.session-token=def',
        'x-skaha-registry-auth': 'user:secret',
      }),
    ).toEqual({
      Accept: 'application/json',
      Authorization: REDACTED,
      Cookie: REDACTED,
      'x-skaha-registry-auth': REDACTED,
    });
  });

  it('redacts a benign header whose value carries a credential', () => {
    expect(redactHeaderRecord({ Referer: 'https://example.test/cb?token=abc' })).toEqual({
      Referer: REDACTED,
    });
  });
});

describe('cookieNames', () => {
  it('returns names without values', () => {
    expect(cookieNames('CADC_SSO=secret; authjs.session-token=also-secret')).toEqual([
      'CADC_SSO',
      'authjs.session-token',
    ]);
  });
});

describe('redactSecrets', () => {
  it('redacts credential text nested in a string field', () => {
    expect(redactSecrets({ text: 'username=ada&password=hunter2' })).toEqual({ text: REDACTED });
  });

  it('redacts nested credential fields', () => {
    expect(
      redactSecrets({
        username: 'ada',
        password: 'hunter2',
        registrySecret: 'reg',
        env: { TOKEN: 'abc' },
        nested: { accessToken: 'jwt' },
      }),
    ).toEqual({
      username: 'ada',
      password: REDACTED,
      registrySecret: REDACTED,
      env: REDACTED,
      nested: { accessToken: REDACTED },
    });
  });
});

describe('redactBodyText', () => {
  it('drops form bodies that carry a password', () => {
    expect(redactBodyText('username=ada&password=hunter2')).toBe(REDACTED);
  });

  it('drops registration payloads that embed a password', () => {
    expect(redactBodyText('userRequest={"password":{"$":"hunter2"}}')).toBe(REDACTED);
  });
});
