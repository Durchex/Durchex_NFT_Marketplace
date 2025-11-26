import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import VerifiedBadge from '../VerifiedBadge';

describe('VerifiedBadge', () => {
  test('renders premium badge', () => {
    render(<VerifiedBadge status="premium" small={true} />);
    expect(screen.getByText(/Premium/i)).toBeInTheDocument();
  });

  test('renders super_premium badge', () => {
    render(<VerifiedBadge status="super_premium" />);
    expect(screen.getByText(/Super/i)).toBeInTheDocument();
  });

  test('renders pending badge', () => {
    render(<VerifiedBadge status="pending" />);
    expect(screen.getByText(/Pending/i)).toBeInTheDocument();
  });

  test('renders rejected badge', () => {
    render(<VerifiedBadge status="rejected" />);
    expect(screen.getByText(/Rejected/i)).toBeInTheDocument();
  });
});
