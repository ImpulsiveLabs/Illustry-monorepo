import { normalizeShareCollaborators } from '../src/bzl/share-collaborators';

describe('share collaborator validation', () => {
  it('normalizes multiple users with different roles and deduplicates case-insensitively', () => {
    expect(normalizeShareCollaborators([
      { email: ' Viewer@Example.com ', permission: 'viewer' },
      { email: 'editor@example.com', permission: 'editor' },
      { email: 'viewer@example.com', permission: 'editor' }
    ], 'owner@example.com', 'dashboard')).toEqual([
      { email: 'viewer@example.com', permission: 'editor' },
      { email: 'editor@example.com', permission: 'editor' }
    ]);
  });

  it('rejects invalid email addresses', () => {
    expect(() => normalizeShareCollaborators([
      { email: 'not-an-email', permission: 'viewer' }
    ], 'owner@example.com', 'visualization')).toThrow('Invalid email address: not-an-email');
  });

  it('rejects self-sharing after normalization', () => {
    expect(() => normalizeShareCollaborators([
      { email: ' OWNER@example.com ', permission: 'editor' }
    ], 'owner@example.com', 'dashboard')).toThrow('You cannot share a dashboard with yourself');
  });

  it('requires at least one collaborator', () => {
    expect(() => normalizeShareCollaborators([], 'owner@example.com', 'dashboard')).toThrow('At least one collaborator is required');
  });
});
