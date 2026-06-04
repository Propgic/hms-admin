import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ThemeContext } from '../../../store/themeContext';

// Mock the axios api client so no real HTTP happens. The form calls api.get on
// mount (plans list) and api.post on create.
vi.mock('../../../api/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
  forceLogout: vi.fn(),
}));

import api from '../../../api/axios';
import HospitalForm from '../HospitalForm';

const PLANS = [
  { id: 'plan-basic', name: 'Basic' },
  { id: 'plan-pro', name: 'Pro' },
];

// Select uses useTheme() which throws without a ThemeContext provider.
function renderForm(props = {}) {
  return render(
    <ThemeContext.Provider value={{ isDark: false, theme: 'light', toggleTheme: vi.fn(), setTheme: vi.fn() }}>
      <HospitalForm
        isOpen
        onClose={props.onClose || vi.fn()}
        onSuccess={props.onSuccess || vi.fn()}
        hospital={props.hospital}
      />
    </ThemeContext.Provider>
  );
}

describe('HospitalForm', () => {
  beforeEach(() => {
    // Plans fetch on mount resolves with the documented response shape
    // (res.data.data.plans). This backs the "silent form-load error" finding:
    // when the dropdown is fed a real list the form should populate it.
    api.get.mockResolvedValue({ data: { data: { plans: PLANS } } });
    api.post.mockResolvedValue({ data: { data: { id: 'new-hospital' } } });
  });

  it('renders the create-mode key fields and title', async () => {
    renderForm();

    expect(screen.getByText('Add Hospital')).toBeInTheDocument();
    expect(screen.getByText('Hospital Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Phone')).toBeInTheDocument();
    expect(screen.getByText('Plan')).toBeInTheDocument();
    expect(screen.getByText('Address')).toBeInTheDocument();
    expect(screen.getByText('Admin Account')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create hospital/i })).toBeInTheDocument();

    await waitFor(() => expect(api.get).toHaveBeenCalled());
  });

  it('fetches plans on mount so the dropdown is fed a real list', async () => {
    renderForm();

    await waitFor(() => expect(api.get).toHaveBeenCalled());
    // First arg is the plans list endpoint, params limit 100.
    const [url, config] = api.get.mock.calls[0];
    expect(url).toBe('/platform/plans');
    expect(config).toEqual({ params: { limit: 100 } });
  });

  it('surfaces validation on empty submit and does NOT call the create endpoint', async () => {
    renderForm();
    await waitFor(() => expect(api.get).toHaveBeenCalled());

    const form = screen.getByRole('button', { name: /create hospital/i }).closest('form');
    fireEvent.submit(form);

    // zod validation should produce field errors (rendered as <p> with the
    // message text), proving the empty form is rejected client-side.
    await waitFor(() => {
      expect(screen.getByText('Hospital name must be at least 2 characters')).toBeInTheDocument();
    });
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
    expect(screen.getByText('Please select a plan')).toBeInTheDocument();

    // The create endpoint must never be hit for an invalid form.
    expect(api.post).not.toHaveBeenCalled();
  });

  it('shows a digits-in-name validation error rather than submitting', async () => {
    renderForm();
    await waitFor(() => expect(api.get).toHaveBeenCalled());

    // blockDigits prevents typing digits via keydown, but value can still be
    // set programmatically; fire a change with a digit to exercise the zod rule.
    const nameInput = document.querySelector('input[name="name"]');
    expect(nameInput).toBeTruthy();
    fireEvent.change(nameInput, { target: { value: 'Hosp1tal' } });

    const form = screen.getByRole('button', { name: /create hospital/i }).closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Hospital name cannot contain numbers')).toBeInTheDocument();
    });
    expect(api.post).not.toHaveBeenCalled();
  });
});
