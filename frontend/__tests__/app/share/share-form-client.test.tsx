import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ShareFormClient } from '@/app/share/share-form-client';
import { revokeDashboardShare, shareDashboard } from '@/app/_actions/dashboard';

const push = vi.fn();
const refresh = vi.fn();
const back = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh, back })
}));

vi.mock('@/app/_actions/dashboard', () => ({
  shareDashboard: vi.fn(() => Promise.resolve({ shareId: 'dash_shared' })),
  revokeDashboardShare: vi.fn(() => Promise.resolve({ shareId: 'dash_shared' }))
}));

vi.mock('@/app/_actions/visualization', () => ({
  shareVisualization: vi.fn(() => Promise.resolve({ shareId: 'viz_shared' })),
  revokeVisualizationShare: vi.fn(() => Promise.resolve({ shareId: 'viz_shared' }))
}));

describe('ShareFormClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('submits multiple valid users as viewers', async () => {
    const user = userEvent.setup();
    render(
      <ShareFormClient
        resource="dashboard"
        name="Revenue"
        currentUserEmail="owner@example.com"
        includedVisualizationCount={2}
      />
    );

    expect(screen.getByText(/also gives view-only access to 2 dashboard visualizations/i)).toBeInTheDocument();
    await user.type(screen.getByLabelText('Email 1'), 'viewer@example.com');
    await user.click(screen.getByRole('button', { name: 'Add user' }));
    await user.type(screen.getByLabelText('Email 2'), 'second@example.com');
    await user.click(screen.getByRole('button', { name: 'Share' }));

    await waitFor(() => {
      expect(shareDashboard).toHaveBeenCalledWith({
        name: 'Revenue',
        collaborators: [
          { email: 'viewer@example.com', permission: 'viewer' },
          { email: 'second@example.com', permission: 'viewer' }
        ]
      });
    });
    expect(screen.queryByRole('option', { name: 'Editor' })).not.toBeInTheDocument();
  });

  it('marks invalid, self, and duplicate emails and blocks submit', async () => {
    const user = userEvent.setup();
    render(
      <ShareFormClient
        resource="dashboard"
        name="Revenue"
        currentUserEmail="owner@example.com"
      />
    );

    await user.type(screen.getByLabelText('Email 1'), 'not-an-email');
    expect(screen.getByText('Invalid email address')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Share' })).toBeDisabled();

    await user.clear(screen.getByLabelText('Email 1'));
    await user.type(screen.getByLabelText('Email 1'), 'OWNER@example.com');
    expect(screen.getByText('You cannot share with yourself')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Share' })).toBeDisabled();

    await user.clear(screen.getByLabelText('Email 1'));
    await user.type(screen.getByLabelText('Email 1'), 'dupe@example.com');
    await user.click(screen.getByRole('button', { name: 'Add user' }));
    await user.type(screen.getByLabelText('Email 2'), 'DUPE@example.com');

    expect(screen.getAllByText('Duplicate email')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Share' })).toBeDisabled();
    expect(shareDashboard).not.toHaveBeenCalled();
  });

  it('blocks sharing a user who already has active access', async () => {
    const user = userEvent.setup();
    render(
      <ShareFormClient
        resource="dashboard"
        name="Revenue"
        currentUserEmail="owner@example.com"
        existingShares={[
          {
            userId: 'user-2',
            email: 'viewer@example.com',
            name: 'Viewer User',
            permission: 'viewer',
            status: 'accepted'
          }
        ]}
      />
    );

    await user.type(screen.getByLabelText('Email 1'), 'VIEWER@example.com');

    expect(screen.getByText('This user already has access.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Share' })).toBeDisabled();
    expect(shareDashboard).not.toHaveBeenCalled();
  });

  it('renders current permissions and revokes a collaborator', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValueOnce(true);

    render(
      <ShareFormClient
        resource="dashboard"
        name="Revenue"
        currentUserEmail="owner@example.com"
        existingShares={[
          {
            userId: 'user-2',
            email: 'viewer@example.com',
            name: 'Viewer User',
            permission: 'viewer',
            status: 'accepted'
          }
        ]}
      />
    );

    expect(screen.getByText('Current permissions')).toBeInTheDocument();
    expect(screen.getByText('viewer@example.com')).toBeInTheDocument();
    expect(screen.getByText('direct')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Revoke' }));

    await waitFor(() => {
      expect(revokeDashboardShare).toHaveBeenCalledWith({
        name: 'Revenue',
        userId: 'user-2'
      });
    });
  });

  it('labels inherited visualization access and blocks revoking it as a direct share', async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(true);

    render(
      <ShareFormClient
        resource="visualization"
        name="Revenue"
        type="bar-chart"
        currentUserEmail="owner@example.com"
        existingShares={[
          {
            userId: 'user-2',
            email: 'viewer@example.com',
            name: 'Viewer User',
            permission: 'viewer',
            status: 'accepted',
            accessType: 'inherited',
            sourceType: 'dashboard',
            sourceDashboardId: 'dash_shared'
          }
        ]}
      />
    );

    expect(screen.getByText('inherited')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Revoke' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Revoke' }));
    expect(confirm).not.toHaveBeenCalled();
  });
});
