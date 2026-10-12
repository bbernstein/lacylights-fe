import { render, screen } from '@testing-library/react';
import CueListPageClient from '../CueListPageClient';

let mockMode: string | null = null;
let mockCurrentProject: { id: string } | null = { id: 'selected-project' };
let mockReportedProjectId: string | null | undefined = 'owner-project';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => ({ get: () => mockMode }),
}));

jest.mock('@/contexts/ProjectContext', () => ({
  useProject: () => ({ currentProject: mockCurrentProject }),
}));

jest.mock('@/components/ExportMenuButton', () => ({
  __esModule: true,
  default: ({ projectId, scopeId }: { projectId: string; scopeId: string }) => (
    <div data-testid="export-menu" data-project-id={projectId} data-scope-id={scopeId} />
  ),
}));

jest.mock('@/components/CueListPlayer', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useEffect } = require('react');
  function MockCueListPlayer({
    onCueListLoaded,
  }: {
    onCueListLoaded: (n: string, p?: string | null) => void;
  }) {
    useEffect(() => onCueListLoaded('Act 1', mockReportedProjectId), [onCueListLoaded]);
    return <div>player</div>;
  }
  return { __esModule: true, default: MockCueListPlayer };
});

jest.mock('@/components/CueListUnifiedView', () => ({
  __esModule: true,
  default: () => <div>editor</div>,
}));

describe('CueListPageClient export menu', () => {
  beforeEach(() => {
    mockMode = null;
    mockCurrentProject = { id: 'selected-project' };
    mockReportedProjectId = 'owner-project';
  });

  it("exports with the cue list's own project, not the selected one", () => {
    render(<CueListPageClient cueListId="cl1" />);
    expect(screen.getByText('Act 1')).toBeInTheDocument();
    const menu = screen.getByTestId('export-menu');
    expect(menu).toHaveAttribute('data-project-id', 'owner-project');
    expect(menu).toHaveAttribute('data-scope-id', 'cl1');
  });

  it('falls back to the selected project until the owner is known', () => {
    mockReportedProjectId = null;
    render(<CueListPageClient cueListId="cl1" />);
    expect(screen.getByTestId('export-menu')).toHaveAttribute('data-project-id', 'selected-project');
  });

  it('hides the export menu without any project', () => {
    mockReportedProjectId = null;
    mockCurrentProject = null;
    render(<CueListPageClient cueListId="cl1" />);
    expect(screen.queryByTestId('export-menu')).not.toBeInTheDocument();
  });
});
