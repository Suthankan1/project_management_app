import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Editor, { validateUrl } from './Editor';

// Mock Yjs to avoid errors in JSDOM
jest.mock('yjs', () => ({
  Doc: jest.fn(() => ({
    getMap: jest.fn(),
  })),
}));

describe('validateUrl utility', () => {
  it('allows http: and https: protocols', () => {
    expect(validateUrl('http://example.com')).toBe(true);
    expect(validateUrl('https://example.com/some/path?param=value#hash')).toBe(true);
    expect(validateUrl('HTTPS://SECURE.COM')).toBe(true);
  });

  it('allows mailto: links', () => {
    expect(validateUrl('mailto:user@example.com')).toBe(true);
    expect(validateUrl('MAILTO:test@example.org')).toBe(true);
  });

  it('allows relative app-safe links', () => {
    expect(validateUrl('/dashboard')).toBe(true);
    expect(validateUrl('pages/123')).toBe(true);
    expect(validateUrl('?projectId=456')).toBe(true);
    expect(validateUrl('#section-one')).toBe(true);
    expect(validateUrl('detail?id=foo:bar')).toBe(true);
    expect(validateUrl('detail#section:one')).toBe(true);
  });

  it('rejects javascript:, data:, and vbscript: protocols', () => {
    expect(validateUrl('javascript:alert(1)')).toBe(false);
    expect(validateUrl(' javascript:alert(1)')).toBe(false);
    expect(validateUrl('JAVASCRIPT:alert(1)')).toBe(false);
    expect(validateUrl('javascript :alert(1)')).toBe(false);
    
    expect(validateUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(validateUrl('data:image/svg+xml,...')).toBe(false);
    
    expect(validateUrl('vbscript:msgbox("hello")')).toBe(false);
  });

  it('rejects protocol-relative external URLs', () => {
    expect(validateUrl('//google.com')).toBe(false);
    expect(validateUrl('  //external-site.org/path')).toBe(false);
  });

  it('rejects malformed URLs', () => {
    expect(validateUrl('http://[invalid]')).toBe(false);
  });
});

describe('Editor Component Link Modal', () => {
  it('renders editor and opens link modal when link button is clicked', () => {
    render(<Editor content="<p>Test content</p>" onUpdate={jest.fn()} />);

    // The link button should be present in the toolbar
    const linkButton = screen.getByTitle('Link');
    expect(linkButton).toBeInTheDocument();

    // Click link button to open the modal
    fireEvent.click(linkButton);

    // The link modal title should now be visible in the document
    expect(screen.getByText('Insert / Edit Link')).toBeInTheDocument();

    // Verify modal elements are visible
    const input = screen.getByLabelText('URL');
    expect(input).toBeInTheDocument();
    
    const saveButton = screen.getByRole('button', { name: 'Save' });
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    expect(saveButton).toBeInTheDocument();
    expect(cancelButton).toBeInTheDocument();
  });

  it('displays validation error when entering an invalid URL', () => {
    render(<Editor content="<p>Test content</p>" onUpdate={jest.fn()} />);

    const linkButton = screen.getByTitle('Link');
    fireEvent.click(linkButton);

    const input = screen.getByLabelText('URL');
    const saveButton = screen.getByRole('button', { name: 'Save' });

    // Enter malicious URL
    fireEvent.change(input, { target: { value: 'javascript:alert("XSS")' } });
    fireEvent.click(saveButton);

    // Error message should be shown on the modal
    const errorText = screen.getByRole('alert');
    expect(errorText).toBeInTheDocument();
    expect(errorText.textContent).toContain('Invalid URL');

    // Modal should remain open
    expect(screen.getByText('Insert / Edit Link')).toBeInTheDocument();
  });

  it('closes modal when cancel button is clicked', () => {
    render(<Editor content="<p>Test content</p>" onUpdate={jest.fn()} />);

    const linkButton = screen.getByTitle('Link');
    fireEvent.click(linkButton);

    expect(screen.getByText('Insert / Edit Link')).toBeInTheDocument();

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);

    // Modal should be closed (Insert / Edit Link should no longer be in the document)
    expect(screen.queryByText('Insert / Edit Link')).not.toBeInTheDocument();
  });
});
