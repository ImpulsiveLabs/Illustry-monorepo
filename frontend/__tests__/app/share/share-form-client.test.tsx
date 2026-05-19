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

  it('submits multiple valid users with different roles', async () => {
    const user = userEvent.setup();
    render(
      <ShareFormClient
        resource="dashboard"
        name="Revenue"
        currentUserEmail="owner@example.com"
      />
    );

    await user.type(screen.getByLabelText('Email 1'), 'viewer@example.com');
    await user.click(screen.getByRole('button', { name: 'Add user' }));
    await user.type(screen.getByLabelText('Email 2'), 'editor@example.com');
    await user.click(screen.getByLabelText('Role 2'));
    await user.click(screen.getByRole('option', { name: 'Editor' }));
    await user.click(screen.getByRole('button', { name: 'Share' }));

    await waitFor(() => {
      expect(shareDashboard).toHaveBeenCalledWith({
        name: 'Revenue',
        collaborators: [
          { email: 'viewer@example.com', permission: 'viewer' },
          { email: 'editor@example.com', permission: 'editor' }
        ]
      });
    });
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

    await user.click(screen.getByRole('button', { name: 'Revoke' }));

    await waitFor(() => {
      expect(revokeDashboardShare).toHaveBeenCalledWith({
        name: 'Revenue',
        userId: 'user-2'
      });
    });
  });
});
