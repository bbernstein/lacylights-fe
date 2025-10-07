import { ApolloClient, InMemoryCache, createHttpLink, split } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

// Determine URLs based on environment
// In production (behind nginx), use relative paths
// In development, use localhost
const getGraphQLUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    // Production: use relative path (nginx proxy)
    return `${window.location.protocol}//${window.location.host}/graphql`;
  }
  return process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql';
};

const getWebSocketUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    // Production: use WebSocket with current host (nginx proxy)
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//${window.location.host}/ws`;
  }
  return process.env.NEXT_PUBLIC_GRAPHQL_WS_URL || 'ws://localhost:4000/graphql';
};

const httpLink = createHttpLink({
  uri: getGraphQLUrl(),
});

const wsLink = typeof window !== 'undefined' ? new GraphQLWsLink(createClient({
  url: getWebSocketUrl(),
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
  authLink.concat(httpLink),
) : authLink.concat(httpLink);

const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});

export default apolloClient;