import { middleware } from '../middleware';

// Mock Next.js server modules since we're running in jsdom environment
const mockCookies = new Map<string, { value: string }>();
const mockGet = jest.fn((name: string) => mockCookies.get(name));

const mockNextUrl = {
  pathname: '/',
  search: '',
};

const mockRequest = {
  nextUrl: mockNextUrl,
  url: 'http://localhost:3000/',
  cookies: {
    get: mockGet,
  },
};

const mockRedirect = jest.fn();
const mockNext = jest.fn();

jest.mock('next/server', () => ({
  NextResponse: {
    redirect: (...args: unknown[]) => {
      mockRedirect(...args);
      return { status: 307, headers: new Map() };
    },
    next: () => {
      mockNext();
      return { status: 200, headers: new Map() };
    },
  },
}));

function createRequest(pathname: string, cookies: Record<string, string> = {}) {
  mockCookies.clear();
  for (const [name, value] of Object.entries(cookies)) {
    mockCookies.set(name, { value });
  }

  const url = new URL(pathname, 'http://localhost:3000');
  mockNextUrl.pathname = url.pathname;
  mockNextUrl.search = url.search;
  mockRequest.url = url.toString();

  return mockRequest as any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

describe('middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCookies.clear();
  });

  describe('excluded paths', () => {
    it('allows API routes', () => {
      middleware(createRequest('/api/health'));
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('allows static assets', () => {
      middleware(createRequest('/_next/static/chunk.js'));
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe('public routes', () => {
    it('allows /login without any cookies', () => {
      middleware(createRequest('/login'));
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('allows /register without any cookies', () => {
      middleware(createRequest('/register'));
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe('when auth is not enabled', () => {
    it('allows access to protected routes when no auth cookie', () => {
      middleware(createRequest('/'));
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('allows access when auth_enabled cookie is false', () => {
      middleware(createRequest('/', { lacylights_auth_enabled: 'false' }));
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe('when auth is enabled', () => {
    it('redirects to login when no auth cookies present', () => {
      middleware(createRequest('/dashboard', { lacylights_auth_enabled: 'true' }));
      expect(mockRedirect).toHaveBeenCalled();
      const redirectUrl = mockRedirect.mock.calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe('/login');
      expect(redirectUrl.searchParams.get('redirect')).toBe('/dashboard');
    });

    it('allows access with JWT session cookie', () => {
      middleware(createRequest('/dashboard', {
        lacylights_auth_enabled: 'true',
        lacylights_token: '1',
      }));
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('allows access with device auth cookie', () => {
      middleware(createRequest('/dashboard', {
        lacylights_auth_enabled: 'true',
        lacylights_device_auth: '1',
      }));
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('allows access with both JWT and device auth cookies', () => {
      middleware(createRequest('/dashboard', {
        lacylights_auth_enabled: 'true',
        lacylights_token: '1',
        lacylights_device_auth: '1',
      }));
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('rejects device auth cookie with non-1 value', () => {
      middleware(createRequest('/dashboard', {
        lacylights_auth_enabled: 'true',
        lacylights_device_auth: '0',
      }));
      expect(mockRedirect).toHaveBeenCalled();
      const redirectUrl = mockRedirect.mock.calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe('/login');
    });

    it('preserves query string in redirect', () => {
      middleware(createRequest('/projects?tab=active', { lacylights_auth_enabled: 'true' }));
      expect(mockRedirect).toHaveBeenCalled();
      const redirectUrl = mockRedirect.mock.calls[0][0] as URL;
      expect(redirectUrl.searchParams.get('redirect')).toBe('/projects?tab=active');
    });
  });
});
