import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Auth from '@/pages/Auth';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    profile: null,
    isLoading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function renderAuth() {
  return render(
    <BrowserRouter>
      <Auth />
    </BrowserRouter>
  );
}

describe('Auth Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders sign-in tab as active by default', () => {
    renderAuth();
    const signInTab = screen.getByRole('tab', { name: /sign in/i });
    expect(signInTab).toBeInTheDocument();
    expect(signInTab).toHaveAttribute('aria-selected', 'true');
  });

  it('switches to sign-up tab when clicked', async () => {
    renderAuth();
    const signUpTab = screen.getByRole('tab', { name: /sign up/i });
    await userEvent.click(signUpTab);
    expect(signUpTab).toHaveAttribute('aria-selected', 'true');
  });

  it('renders email and password inputs on sign-in', () => {
    renderAuth();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('has a submit button on sign-in form', () => {
    renderAuth();
    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn).toHaveAttribute('type', 'submit');
  });
});
