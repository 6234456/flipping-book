import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReaderTopBar } from '../ReaderTopBar';

describe('ReaderTopBar', () => {
  it('renders page title in zh-CN', () => {
    render(
      <ReaderTopBar
        title={{ 'zh-CN': '测试图册' }}
        pageTitle={{ 'zh-CN': '封面' }}
        pageNumber={1}
        totalPages={10}
        interactionMode="read"
      />
    );
    expect(screen.getByText('封面')).toBeInTheDocument();
  });

  it('falls back to book title when no page title', () => {
    render(
      <ReaderTopBar
        title={{ 'zh-CN': '测试图册' }}
        totalPages={10}
        interactionMode="read"
      />
    );
    expect(screen.getByText('测试图册')).toBeInTheDocument();
  });

  it('shows page number', () => {
    render(
      <ReaderTopBar
        title={{ 'zh-CN': '测试' }}
        pageNumber={5}
        totalPages={20}
        interactionMode="read"
      />
    );
    expect(screen.getByText('5 / 20')).toBeInTheDocument();
  });

  it('shows DEBUG badge in debug mode', () => {
    render(
      <ReaderTopBar
        title={{ 'zh-CN': '测试' }}
        totalPages={10}
        interactionMode="debugOverlay"
      />
    );
    expect(screen.getByText('DEBUG')).toBeInTheDocument();
  });

  it('does not show DEBUG badge in read mode', () => {
    render(
      <ReaderTopBar
        title={{ 'zh-CN': '测试' }}
        totalPages={10}
        interactionMode="read"
      />
    );
    expect(screen.queryByText('DEBUG')).not.toBeInTheDocument();
  });

  it('hides page number when not provided', () => {
    render(
      <ReaderTopBar
        title={{ 'zh-CN': '测试' }}
        totalPages={10}
        interactionMode="read"
      />
    );
    // No "x / y" pattern should be visible
    expect(screen.queryByText(/\d+ \/ \d+/)).not.toBeInTheDocument();
  });
});
