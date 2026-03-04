import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import {
    Badge
} from '@/components/ui/badge';

describe('Badge', () => {
    it('renders Badge', () => {
       render(<Badge>Test Badge</Badge>);
       expect(screen.getByText('Test Badge')).toBeInTheDocument();
    });

});
