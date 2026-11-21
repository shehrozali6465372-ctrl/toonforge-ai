import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DemoPlayer } from './DemoPlayer';
import { createProject } from '@/lib/factories';
import { useEditorStore } from '@/lib/store';

vi.mock('@/components/editor/Canvas3D', () => ({
  Canvas3D: () => <div data-testid="canvas3d" />,
}));

vi.mock('@/components/editor/Canvas2D', () => ({
  Canvas2D: () => <div data-testid="canvas2d" />,
}));

describe('DemoPlayer renderer lifecycle', () => {
  const demoProject = createProject('Test 3D demo', '3d', '16:9');

  beforeEach(() => {
    useEditorStore.setState({
      project: null,
      currentSceneId: null,
      selectedLayerIds: [],
      viewMode: 'editor',
      isPlaying: false,
      currentTime: 0,
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue(demoProject),
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('releases the demo renderer while a showcase lightbox is active', async () => {
    render(<DemoPlayer paused />);

    await screen.findByText('Test 3D demo');
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));

    expect(screen.queryByTestId('canvas3d')).not.toBeInTheDocument();
  });

  it('keeps the demo renderer mounted during normal playback', async () => {
    render(<DemoPlayer />);

    await screen.findByText('Test 3D demo');

    expect(screen.getByTestId('canvas3d')).toBeInTheDocument();
  });
});
