import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ToastProvider, useToast } from '../Toast';

function Demo() {
  const toast = useToast();
  return <button onClick={() => toast('Saved', { variant: 'success' })}>fire</button>;
}

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a toast when fired', async () => {
    render(
      <ToastProvider>
        <Demo />
      </ToastProvider>,
    );
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.click(screen.getByRole('button', { name: 'fire' }));
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('auto-dismisses after 3 seconds', async () => {
    render(
      <ToastProvider>
        <Demo />
      </ToastProvider>,
    );
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.click(screen.getByRole('button', { name: 'fire' }));
    expect(screen.getByText('Saved')).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(3500); });
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  });

  it('renders with role="status" for a11y', async () => {
    render(
      <ToastProvider>
        <Demo />
      </ToastProvider>,
    );
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.click(screen.getByRole('button', { name: 'fire' }));
    const region = screen.getByRole('status');
    expect(region).toHaveTextContent('Saved');
  });

  it('limits visible toasts to 3', async () => {
    function MultiDemo() {
      const toast = useToast();
      return (
        <button onClick={() => { toast('A'); toast('B'); toast('C'); toast('D'); }}>fire-many</button>
      );
    }
    render(
      <ToastProvider>
        <MultiDemo />
      </ToastProvider>,
    );
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.click(screen.getByRole('button', { name: 'fire-many' }));
    expect(screen.queryByText('A')).not.toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.getByText('D')).toBeInTheDocument();
  });
});
