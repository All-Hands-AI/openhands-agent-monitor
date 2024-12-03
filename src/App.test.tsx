import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import { fetchBotActivities } from './services/github';

vi.mock('./services/github', () => ({
  fetchBotActivities: vi.fn(),
}));

vi.mock('react-vega', () => ({
  VegaLite: vi.fn(() => <div data-testid="vega-lite-chart" />),
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should refresh data when clicking refresh button', async () => {
    const mockActivities = [
      {
        id: '1',
        type: 'issue',
        status: 'success',
        timestamp: '2023-11-28T12:00:00Z',
        url: 'https://github.com/example/1',
        description: 'Successfully resolved issue',
      }
    ];

    const mockNewActivities = [
      ...mockActivities,
      {
        id: '2',
        type: 'issue',
        status: 'success',
        timestamp: '2023-11-28T12:01:00Z',
        url: 'https://github.com/example/2',
        description: 'Another issue resolved',
      }
    ];

    (fetchBotActivities as unknown as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(mockActivities)
      .mockResolvedValueOnce(mockNewActivities);

    render(<App />);

    // Initial render should show one activity
    await screen.findByText('Successfully resolved issue');
    expect(screen.queryByText('Another issue resolved')).not.toBeInTheDocument();

    // Click refresh button
    const refreshButton = screen.getByTestId('refresh-button');
    fireEvent.click(refreshButton);

    // Should show both activities
    await screen.findByText('Another issue resolved');
    expect(screen.getByText('Successfully resolved issue')).toBeInTheDocument();
    expect(fetchBotActivities).toHaveBeenCalledTimes(2);
  });
});