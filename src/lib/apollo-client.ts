import { ApolloClient, InMemoryCache, createHttpLink, split, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

// Runtime configuration cache
let runtimeConfig: { graphqlUrl: string; graphqlWsUrl: string } | null = null;
let configPromise: Promise<{ graphqlUrl: string; graphqlWsUrl: string }> | null = null;

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

    // Fallback to defaults if API fetch fails
    runtimeConfig = {
      graphqlUrl: 'http://localhost:4000/graphql',
      graphqlWsUrl: 'ws://localhost:4000/graphql',
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

  // Mac app or development: use cached config or default
  return runtimeConfig?.graphqlUrl || 'http://localhost:4000/graphql';
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
  return runtimeConfig?.graphqlWsUrl || 'ws://localhost:4000/graphql';
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

const wsLink = typeof window !== 'undefined' ? new GraphQLWsLink(createClient({
  // Use async URL function to ensure config is loaded before connecting
  url: async () => await getWebSocketUrl(),
  lazy: true, // Don't connect until first subscription
  connectionParams: () => {
    const token = localStorage.getItem('token');
    return {
      authorization: token ? `Bearer ${token}` : '',
    };
  },
})) : null;

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
const splitLink = typeof window !== 'undefined' && wsLink ? split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
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
