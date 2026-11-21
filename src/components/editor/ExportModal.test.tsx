import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createProject } from '@/lib/factories';
import { useEditorStore } from '@/lib/store';
import { ExportModal } from './ExportModal';

describe('ExportModal large-file picker preflight', () => {
  let originalPicker: PropertyDescriptor | undefined;

  beforeEach(() => {
    originalPicker = Object.getOwnPropertyDescriptor(window, 'showSaveFilePicker');
    const project = createProject('Large export', '2d', '16:9');
    project.scenes[0].duration = 60;
    useEditorStore.setState({
      project,
      currentSceneId: project.scenes[0].id,
      currentTime: 0,
      isPlaying: false,
      isExporting: false,
    });
  });

  afterEach(() => {
    if (originalPicker) {
      Object.defineProperty(window, 'showSaveFilePicker', originalPicker);
    } else {
      Reflect.deleteProperty(window, 'showSaveFilePicker');
    }
  });

  it('fails safely before rendering when the browser has no Save File API', async () => {
    Object.defineProperty(window, 'showSaveFilePicker', {
      configurable: true,
      value: undefined,
    });

    render(<ExportModal open onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /exporter/i }));

    expect(await screen.findByText(/Cet export est estimé à plus de/i)).toBeInTheDocument();
    expect(useEditorStore.getState().isExporting).toBe(false);
  });

  it('treats native picker cancellation as a clean user cancellation', async () => {
    const picker = vi.fn().mockRejectedValue(new DOMException('User cancelled', 'AbortError'));
    Object.defineProperty(window, 'showSaveFilePicker', {
      configurable: true,
      value: picker,
    });

    render(<ExportModal open onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /exporter/i }));

    await waitFor(() => expect(picker).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByRole('button', { name: /exporter/i })).toBeInTheDocument());

    expect(screen.queryByText(/Cet export est estimé à plus de/i)).not.toBeInTheDocument();
    expect(useEditorStore.getState().isExporting).toBe(false);
  });
});
