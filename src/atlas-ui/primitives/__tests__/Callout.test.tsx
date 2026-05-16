import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Callout } from '../Callout';

describe('Callout', () => {
  it('renders title and body', () => {
    render(
      <Callout variant="info" title="提示">
        欧盟 VAT 调整
      </Callout>,
    );
    expect(screen.getByText('提示')).toBeInTheDocument();
    expect(screen.getByText('欧盟 VAT 调整')).toBeInTheDocument();
  });

  it.each(['info', 'warning', 'risk', 'legal', 'evidence'] as const)(
    'applies variant=%s without raising',
    (variant) => {
      const { container } = render(
        <Callout variant={variant} title="t">body</Callout>,
      );
      expect(container.querySelector(`[data-callout-variant="${variant}"]`)).not.toBeNull();
    },
  );

  it('renders without title', () => {
    render(<Callout variant="info">无标题正文</Callout>);
    expect(screen.getByText('无标题正文')).toBeInTheDocument();
  });
});
