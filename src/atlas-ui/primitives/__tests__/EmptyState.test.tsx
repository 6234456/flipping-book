import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FileText } from 'lucide-react';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState icon={FileText} title="还没有笔记" description="切换章节再查看" />);
    expect(screen.getByText('还没有笔记')).toBeInTheDocument();
    expect(screen.getByText('切换章节再查看')).toBeInTheDocument();
  });

  it('renders icon as decorative', () => {
    const { container } = render(<EmptyState icon={FileText} title="还没有笔记" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders action when provided', () => {
    render(
      <EmptyState
        icon={FileText}
        title="还没有笔记"
        action={<button>添加笔记</button>}
      />,
    );
    expect(screen.getByRole('button', { name: '添加笔记' })).toBeInTheDocument();
  });
});
