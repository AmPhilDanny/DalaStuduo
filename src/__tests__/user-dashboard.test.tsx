import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

const mockSupabaseQuery = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      }),
    }),
  },
}));

const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('UserDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner while auth is loading', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
      isLoading: true,
    });

    const UserDashboard = (await import('@/pages/UserDashboard')).default;
    const { container } = render(
      <BrowserRouter>
        <UserDashboard />
      </BrowserRouter>
    );

    // The loader uses a LoaderCircle icon (lucide) with animate-spin class
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders dashboard heading when authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', email: 'test@test.com' },
      profile: { full_name: 'Test User', role: 'student' },
      isLoading: false,
    });

    const UserDashboard = (await import('@/pages/UserDashboard')).default;
    render(
      <BrowserRouter>
        <UserDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      // Dashboard header should render with user name
      expect(screen.getByText(/my applications/i)).toBeInTheDocument();
    });
  });
});
