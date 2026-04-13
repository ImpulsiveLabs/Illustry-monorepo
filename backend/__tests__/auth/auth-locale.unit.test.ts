describe('auth locale helpers', () => {
  it('normalizes supported locale values and rejects unsupported ones', async () => {
    const locale = await import('../../src/auth/locale');

    expect(locale.normalizeAuthLocale('ro')).toBe('ro');
    expect(locale.normalizeAuthLocale('ro-RO')).toBe('ro');
    expect(locale.normalizeAuthLocale('en_US')).toBe('en');
    expect(locale.normalizeAuthLocale('fr')).toBeUndefined();
    expect(locale.normalizeAuthLocale(undefined)).toBeUndefined();
  });

  it('resolves the locale from request headers, cookies, and accept-language in priority order', async () => {
    const locale = await import('../../src/auth/locale');

    expect(locale.resolveRequestAuthLocale({
      header: (name: string) => (name === 'x-illustry-locale' ? 'ro-RO' : undefined),
      cookies: { 'illustry-locale': 'en' }
    } as any)).toBe('ro');

    expect(locale.resolveRequestAuthLocale({
      header: (name: string) => (name === 'accept-language' ? 'en-US,en;q=0.9' : undefined),
      cookies: { 'illustry-locale': 'ro' }
    } as any)).toBe('ro');

    expect(locale.resolveRequestAuthLocale({
      header: (name: string) => (name === 'accept-language' ? 'ro-RO,ro;q=0.9,en;q=0.8' : undefined),
      cookies: {}
    } as any)).toBe('ro');

    expect(locale.resolveRequestAuthLocale({
      header: (name: string) => (name === 'accept-language' ? 'fr-CA,fr;q=0.9' : undefined),
      cookies: {}
    } as any)).toBe('en');

    expect(locale.resolveRequestAuthLocale({
      header: () => undefined,
      cookies: {}
    } as any)).toBe('en');
  });

  it('translates known auth strings and leaves unknown strings untouched', async () => {
    const locale = await import('../../src/auth/locale');

    expect(locale.translateAuthText('ro', 'Invalid request payload')).toBe('Payload-ul cererii este invalid');
    expect(locale.translateAuthText('ro', 'If an account exists, an email was sent')).toBe('Daca exista un cont, a fost trimis un email');
    expect(locale.translateAuthText('en', 'Authentication required')).toBe('Authentication required');
    expect(locale.translateAuthText('ro', 'Something else')).toBe('Something else');
  });
});
