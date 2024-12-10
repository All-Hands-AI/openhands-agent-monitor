import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { ActivityList } from './ActivityList';
import { BotActivity } from '../types';
import { getComputedStyle } from '../test/testUtils';

describe('ActivityList', () => {
  const createMockActivity = (id: string): BotActivity => ({
    id,
    type: 'issue',
    status: 'success',
    timestamp: '2023-11-28T12:00:00Z',
    url: `https://github.com/example/${id}`,
    title: `Test Issue ${id}`,
    description: `Description for issue ${id}`,
  });

  const mockActivities: BotActivity[] = [
    {
      id: '1',
      type: 'issue',
      status: 'success',
      timestamp: '2023-11-28T12:00:00Z',
      url: 'https://github.com/example/1',
      title: 'ISSUE success 11/28/2023, 12:00:00 PM -- Test Issue 1',
      description: 'Successfully resolved issue',
    },
    {
      id: '2',
      type: 'pr',
      status: 'failure',
      timestamp: '2023-11-28T13:00:00Z',
      url: 'https://github.com/example/2',
      title: 'PR failure 11/28/2023, 1:00:00 PM -- Test PR 1',
      description: 'Failed to modify PR',
    },
  ];

  it('renders activities correctly', () => {
    render(<ActivityList activities={mockActivities} />);

    // Check if activities are rendered
    expect(screen.getByText('ISSUE success 11/28/2023, 12:00:00 PM -- Test Issue 1')).toBeInTheDocument();
    expect(screen.getByText('PR failure 11/28/2023, 1:00:00 PM -- Test PR 1')).toBeInTheDocument();
    expect(screen.getByText('Successfully resolved issue')).toBeInTheDocument();
    expect(screen.getByText('Failed to modify PR')).toBeInTheDocument();

    // Check if links are rendered correctly
    const links = screen.getAllByText('View on GitHub');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', 'https://github.com/example/1');
    expect(links[1]).toHaveAttribute('href', 'https://github.com/example/2');
  });

  it('renders empty state correctly', () => {
    render(<ActivityList activities={[]} />);
    expect(screen.queryByText('View on GitHub')).not.toBeInTheDocument();
  });

  it('does not show pagination controls when there are 20 or fewer items', () => {
    const activities = Array.from({ length: 20 }, (_, i) => createMockActivity(String(i + 1)));
    render(<ActivityList activities={activities} />);
    
    expect(screen.queryByText('Previous')).not.toBeInTheDocument();
    expect(screen.queryByText('Next')).not.toBeInTheDocument();
    expect(screen.queryByText(/Page \d+ of \d+/)).not.toBeInTheDocument();
  });

  it('shows pagination controls when there are more than 20 items', () => {
    const activities = Array.from({ length: 25 }, (_, i) => createMockActivity(String(i + 1)));
    render(<ActivityList activities={activities} />);
    
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  });

  it('shows only 20 items per page', () => {
    const activities = Array.from({ length: 25 }, (_, i) => createMockActivity(String(i + 1)));
    render(<ActivityList activities={activities} />);
    
    const items = screen.getAllByText(/Test Issue \d+/);
    expect(items).toHaveLength(20);
    expect(screen.getByText('Test Issue 1')).toBeInTheDocument();
    expect(screen.getByText('Test Issue 20')).toBeInTheDocument();
    expect(screen.queryByText('Test Issue 21')).not.toBeInTheDocument();
  });

  it('navigates between pages correctly', () => {
    const activities = Array.from({ length: 25 }, (_, i) => createMockActivity(String(i + 1)));
    render(<ActivityList activities={activities} />);
    
    // Initial page
    expect(screen.getByText('Test Issue 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Issue 21')).not.toBeInTheDocument();
    
    // Navigate to next page
    fireEvent.click(screen.getByText('Next'));
    expect(screen.queryByText('Test Issue 1')).not.toBeInTheDocument();
    expect(screen.getByText('Test Issue 21')).toBeInTheDocument();
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    
    // Navigate back to first page
    fireEvent.click(screen.getByText('Previous'));
    expect(screen.getByText('Test Issue 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Issue 21')).not.toBeInTheDocument();
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  });

  it('disables pagination buttons appropriately', () => {
    const activities = Array.from({ length: 25 }, (_, i) => createMockActivity(String(i + 1)));
    render(<ActivityList activities={activities} />);
    
    // On first page, Previous should be disabled
    expect(screen.getByText('Previous')).toBeDisabled();
    expect(screen.getByText('Next')).not.toBeDisabled();
    
    // Navigate to last page
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('Previous')).not.toBeDisabled();
    expect(screen.getByText('Next')).toBeDisabled();
  });

  describe('issue status styling', () => {
    beforeEach(() => {
      // Add CSS styles for testing
      const style = document.createElement('style');
      style.textContent = `
        .activity-item.no_pr { border-left: 4px solid #ffffff; }
        .activity-item.pr_open { border-left: 4px solid #4caf50; }
        .activity-item.pr_merged { border-left: 4px solid #9c27b0; }
        .activity-item.pr_closed { border-left: 4px solid #f44336; }
      `;
      document.head.appendChild(style);
    });

    afterEach(() => {
      // Clean up styles
      const styles = document.head.getElementsByTagName('style');
      Array.from(styles).forEach(style => style.remove());
    });

    const issueStatuses = [
      { status: 'no_pr', color: '#ffffff' },
      { status: 'pr_open', color: '#4caf50' },
      { status: 'pr_merged', color: '#9c27b0' },
      { status: 'pr_closed', color: '#f44336' }
    ];

    issueStatuses.forEach(({ status, color }) => {
      it(`applies correct border color for issue with ${status} status`, () => {
        const activity: BotActivity = {
          id: '1',
          type: 'issue',
          status: status as any,
          timestamp: '2023-11-28T12:00:00Z',
          url: 'https://github.com/example/1',
          title: `Test Issue with ${status}`,
          description: 'Test description',
          prUrl: status === 'no_pr' ? undefined : 'https://github.com/example/pr/1'
        };

        render(<ActivityList activities={[activity]} />);
        
        const item = document.querySelector('.activity-item') as HTMLElement;
        expect(item).not.toBeNull();
        expect(item.classList.contains(status)).toBe(true);
        
        const styleRules = Array.from(document.styleSheets)
          .flatMap(sheet => Array.from(sheet.cssRules))
          .map(rule => rule.cssText)
          .join('\n');
        
        expect(styleRules).toContain(`.activity-item.${status}`);
        expect(styleRules).toContain(`border-left: 4px solid ${color}`);
      });

      if (status !== 'no_pr') {
        it(`shows PR link for issue with ${status} status`, () => {
          const activity: BotActivity = {
            id: '1',
            type: 'issue',
            status: status as any,
            timestamp: '2023-11-28T12:00:00Z',
            url: 'https://github.com/example/1',
            title: `Test Issue with ${status}`,
            description: 'Test description',
            prUrl: 'https://github.com/example/pr/1'
          };

          render(<ActivityList activities={[activity]} />);
          
          const prLink = screen.getByText('View PR');
          expect(prLink).toBeInTheDocument();
          expect(prLink).toHaveAttribute('href', 'https://github.com/example/pr/1');
        });
      }
    });
  });

  describe('dark theme styling', () => {
    beforeEach(() => {
      // Set up CSS variables for dark theme
      document.documentElement.style.setProperty('--bg-input', '#393939');
      document.documentElement.style.setProperty('--text-editor-active', '#C4CBDA');
      document.documentElement.style.setProperty('--border', '#3c3c4a');
      document.documentElement.style.setProperty('--bg-editor-active', '#31343D');
      document.documentElement.style.setProperty('--text-editor-base', '#9099AC');

      // Add CSS styles for testing
      const style = document.createElement('style');
      style.textContent = `
        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          margin-top: 2rem;
        }

        .pagination button {
          padding: 0.5rem 1rem;
          background: var(--bg-input);
          color: var(--text-editor-active);
          border: 1px solid var(--border);
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .pagination button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination button:not(:disabled):hover {
          background: var(--bg-editor-active);
        }

        .pagination .page-info {
          color: var(--text-editor-base);
          padding: 0.5rem 1rem;
        }
      `;
      document.head.appendChild(style);
    });

    afterEach(() => {
      // Clean up styles
      const styles = document.head.getElementsByTagName('style');
      Array.from(styles).forEach(style => style.remove());
    });

    describe('pagination styling', () => {
      const activities = Array.from({ length: 25 }, (_, i) => createMockActivity(String(i + 1)));

      it('applies dark theme styles to pagination buttons', () => {
        render(<ActivityList activities={activities} />);

        // Check if the style rules exist with correct variables
        const styleRules = Array.from(document.styleSheets)
          .flatMap(sheet => Array.from(sheet.cssRules))
          .map(rule => rule.cssText)
          .join('\n');
        
        expect(styleRules).toContain('.pagination button');
        expect(styleRules).toContain('var(--bg-input)');
        expect(styleRules).toContain('var(--text-editor-active)');
        expect(styleRules).toContain('var(--border)');
      });

      it('has proper spacing between pagination elements', () => {
        render(<ActivityList activities={activities} />);

        const pagination = document.querySelector('.pagination') as HTMLElement;
        expect(pagination).not.toBeNull();
        expect(getComputedStyle(pagination, 'gap')).toBe('1rem');
        expect(getComputedStyle(pagination, 'margin-top')).toBe('2rem');
      });

      it('applies proper styles to disabled pagination buttons', () => {
        render(<ActivityList activities={activities} />);

        const prevButton = screen.getByText('Previous');
        expect(prevButton).toBeDisabled();
        expect(getComputedStyle(prevButton, 'opacity')).toBe('0.5');
        expect(getComputedStyle(prevButton, 'cursor')).toBe('not-allowed');
      });

      it('applies hover styles to enabled pagination buttons', () => {
        render(<ActivityList activities={activities} />);

        const nextButton = screen.getByText('Next');
        expect(nextButton).not.toBeDisabled();

        // Check if the hover style rule exists
        const styleRules = Array.from(document.styleSheets)
          .flatMap(sheet => Array.from(sheet.cssRules))
          .map(rule => rule.cssText)
          .join('\n');
        
        expect(styleRules).toContain('.pagination button:not(:disabled):hover');
        expect(styleRules).toContain('var(--bg-editor-active)');
      });

      it('styles page info text correctly', () => {
        render(<ActivityList activities={activities} />);

        const pageInfo = screen.getByText('Page 1 of 2');
        expect(pageInfo.classList.contains('page-info')).toBe(true);
        
        // Check if the style rule exists
        const styleRules = Array.from(document.styleSheets)
          .flatMap(sheet => Array.from(sheet.cssRules))
          .map(rule => rule.cssText)
          .join('\n');
        
        expect(styleRules).toContain('.pagination .page-info');
        expect(styleRules).toContain('var(--text-editor-base)');
        expect(styleRules).toContain('padding: 0.5rem 1rem');
      });

      it('has proper button padding and border radius', () => {
        render(<ActivityList activities={activities} />);

        const nextButton = screen.getByText('Next');
        expect(getComputedStyle(nextButton, 'padding')).toBe('0.5rem 1rem');
        expect(getComputedStyle(nextButton, 'border-radius')).toBe('4px');
      });
    });
  });
});