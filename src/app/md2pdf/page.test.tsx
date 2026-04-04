import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MarkdownToPdfPage from './page';

describe('MarkdownToPdfPage', () => {
  it('renders the converter title', async () => {
    render(<MarkdownToPdfPage />);
    await waitFor(() => {
      expect(screen.getByText('Markdown 轉 PDF')).toBeInTheDocument();
    });
  });
});
