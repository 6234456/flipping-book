import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { SearchTrigger } from '../SearchTrigger';

describe('SearchTrigger', () => {
  it('renders with ⌘K label and search aria-label', () => {
    render(<SearchTrigger onClick={vi.fn()} />);
    expect(screen.getByRole('button', { name: /搜索/ })).toBeInTheDocument();
    expect(screen.getByText('⌘K')).toBeInTheDocument();
  });

  it('click invokes onClick', async () => {
    const onClick = vi.fn();
    render(<SearchTrigger onClick={onClick} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
