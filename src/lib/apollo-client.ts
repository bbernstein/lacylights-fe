import { ApolloClient, InMemoryCache, createHttpLink, split, from, ApolloLink, Observable } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient, Client } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { WEBSOCKET_CONFIG } from '@/constants/websocket';

// Runtime configuration cache
let runtimeConfig: { graphqlUrl: string; graphqlWsUrl: string } | null = null;
let configPromise: Promise<{ graphqlUrl: string; graphqlWsUrl: string }> | null = null;

// Mutable WebSocket client reference - can be recreated on reconnect
export let wsClient: Client | null = null;
let wsLink: GraphQLWsLink | null = null;

// Flag to prevent multiple simultaneous reconnection attempts
let isReconnecting = false;

// Fetch runtime configuration from API endpoint
async function fetchRuntimeConfig(): Promise<{ graphqlUrl: string; graphqlWsUrl: string }> {
  if (runtimeConfig) {
    return runtimeConfig;
  }

  if (configPromise) {
    return configPromise;
  }

  configPromise = (async () => {
    try {
      const response = await fetch('/api/config');
      if (response.ok) {
        runtimeConfig = await response.json();
        return runtimeConfig!;
      }
    } catch (error) {
      console.warn('Failed to fetch runtime config, using defaults:', error);
    }

    // Fallback to env vars (baked at build time) or defaults if API fetch fails
    runtimeConfig = {
      graphqlUrl: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql',
      graphqlWsUrl: process.env.NEXT_PUBLIC_GRAPHQL_WS_URL || 'ws://localhost:4000/graphql',
    };
    return runtimeConfig;
  })();

  return configPromise;
}

// Determine URLs based on environment
// In production (behind nginx), use relative paths
// In development or Mac app, use runtime configuration
function getGraphQLUrl(): string {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    // Production: use relative path (nginx proxy)
    return `${window.location.protocol}//${window.location.host}/graphql`;
  }

  // Mac app or development: use cached config, env vars, or default
  return runtimeConfig?.graphqlUrl || process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql';
}

async function getWebSocketUrl(): Promise<string> {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    // Production: use WebSocket with current host (nginx proxy)
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//${window.location.host}/ws`;
  }

  // Mac app or development: ensure config is loaded first
  if (!runtimeConfig) {
    await fetchRuntimeConfig();
  }
  return runtimeConfig?.graphqlWsUrl || process.env.NEXT_PUBLIC_GRAPHQL_WS_URL || 'ws://localhost:4000/graphql';
}

// Custom link that fetches config before making requests
const configLink = setContext(async (_, { headers }) => {
  // Fetch runtime config on first request if we're on localhost
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost' && !runtimeConfig) {
    await fetchRuntimeConfig();
  }
  return { headers };
});

const httpLink = createHttpLink({
  uri: () => getGraphQLUrl(),
});

/**
 * Creates a new WebSocket client and link.
 * Called on initial setup and when reconnecting.
 */
function createWsClient(): void {
  if (typeof window === 'undefined') {
    return;
  }

  wsClient = createClient({
    // Use async URL function to ensure config is loaded before connecting
    url: async () => getWebSocketUrl(),
    lazy: true, // Don't connect until first subscription
    connectionParams: () => {
      const token = localStorage.getItem('token');
      return {
        authorization: token ? `Bearer ${token}` : '',
      };
    },
    // Reconnection configuration for stale connections
    retryAttempts: Infinity, // Keep trying to reconnect indefinitely
    shouldRetry: () => true, // Always retry on disconnect
    keepAlive: WEBSOCKET_CONFIG.KEEPALIVE_INTERVAL, // Send ping to prevent proxy timeouts
    on: {
      connected: () => {
        // Dispatch custom event for WebSocket monitoring
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ws-connected'));
        }
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log('[WebSocket] Connected');
        }
      },
      closed: (event) => {
        // Dispatch custom event for WebSocket monitoring
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ws-closed', { detail: event }));
        }
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log('[WebSocket] Closed', event);
        }
      },
      error: (error) => {
        // Dispatch custom event for WebSocket monitoring
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ws-error', { detail: error }));
        }
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.error('[WebSocket] Error', error);
        }
      },
      message: () => {
        // Dispatch custom event for heartbeat monitoring
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ws-message'));
        }
      },
    },
  });

  wsLink = new GraphQLWsLink(wsClient);
}

// Create initial WebSocket client
createWsClient();

/**
 * Reconnects the WebSocket by creating a new client.
 * Returns a Promise that resolves when connected (or times out after 5 seconds).
 *
 * IMPORTANT: This disposes the old client which orphans existing subscriptions.
 * Only call this as a last resort (e.g., manual reconnect button).
 * For automatic reconnection, rely on graphql-ws's built-in retry mechanism.
 */
export function reconnectWebSocket(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    // Prevent multiple simultaneous reconnection attempts
    if (isReconnecting) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('[WebSocket] Reconnection already in progress (module flag), skipping');
      }
      resolve();
      return;
    }

    isReconnecting = true;

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[WebSocket] Reconnecting - creating new client');
    }

    // Dispose old client if it exists
    if (wsClient) {
      try {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log('[WebSocket] Disposing old client');
        }
        wsClient.dispose();
      } catch {
        // Ignore errors from disposing already-disposed client
      }
    }

    // Listen for the connected event before creating new client
    const handleConnected = () => {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('[WebSocket] Reconnection successful');
      }
      cleanup();
      isReconnecting = false;
      resolve();
    };

    // Timeout fallback - don't block forever
    const timeout = setTimeout(() => {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('[WebSocket] Reconnection timeout, proceeding anyway');
      }
      cleanup();
      isReconnecting = false;
      resolve();
    }, 5000);

    const cleanup = () => {
      window.removeEventListener('ws-connected', handleConnected);
      clearTimeout(timeout);
    };

    window.addEventListener('ws-connected', handleConnected);

    // Create new client - this will connect lazily on first subscription
    createWsClient();

    // Force the lazy client to connect now by triggering a subscription check
    // The wsLink will be picked up by the dynamic link below
  });
}

/**
 * Dynamic WebSocket link that forwards to the current wsLink.
 * This allows us to swap out the wsLink on reconnection without
 * recreating the entire Apollo Client.
 */
const dynamicWsLink = new ApolloLink((operation) => {
  if (!wsLink) {
    throw new Error('WebSocket link not initialized');
  }
  // Forward the operation to the current wsLink
  return new Observable((observer) => {
    const subscription = wsLink!.request(operation)?.subscribe({
      next: (result) => observer.next(result),
      error: (error) => observer.error(error),
      complete: () => observer.complete(),
    });
    return () => subscription?.unsubscribe();
  });
});

const authLink = setContext((_, { headers }) => {
  // Get the authentication token from local storage if it exists
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

// Use split link to route subscriptions to WebSocket and queries/mutations to HTTP
// Uses dynamicWsLink so we can swap the underlying wsLink on reconnection
const splitLink = typeof window !== 'undefined' && wsLink ? split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  dynamicWsLink,
  from([configLink, authLink, httpLink]),
) : from([configLink, authLink, httpLink]);

const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});

// Prefetch runtime configuration if on localhost
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  fetchRuntimeConfig().catch(err => {
    console.error('Failed to prefetch runtime config:', err);
  });
}

export default apolloClient;
