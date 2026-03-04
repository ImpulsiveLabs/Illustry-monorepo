import { render, screen } from '@testing-library/react';
import NewProjectPage from '@/app/(data)/projects/new/page';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

// ✅ Mock the AddProjectForm component
vi.mock('@/components/form/add-project-form', () => ({
  __esModule: true,
  default: () => (
    <div data-testid="add-project-form">Mocked AddProjectForm</div>
  ),
}));

describe('NewProjectPage', () => {
  it('renders AddProjectForm inside the styled wrapper', () => {
    render(<NewProjectPage />);

    expect(screen.getByTestId('add-project-form')).toBeInTheDocument();
    expect(screen.getByText('Mocked AddProjectForm')).toBeInTheDocument();
  });
});
