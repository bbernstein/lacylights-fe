/**
 * GraphQL Integration Contract Tests
 *
 * These tests validate that frontend queries work correctly against the real backend
 * GraphQL API. They ensure contract compatibility end-to-end.
 *
 * Requirements:
 * - Backend server must be running at GRAPHQL_ENDPOINT (default: http://localhost:4000/graphql)
 * - Database should have some test data (or tests will skip assertions)
 *
 * Usage:
 * - npm run test:contracts (isolated contract tests)
 * - CI: GitHub Actions will start backend, run migrations, then run these tests
 */

import 'cross-fetch/polyfill';
import { ApolloClient, InMemoryCache, gql, HttpLink } from '@apollo/client';
import { GET_PROJECTS, GET_PROJECT } from '../projects';
import { GET_PROJECT_LOOKS } from '../looks';

describe('GraphQL Integration Contract Tests', () => {
  let client: ApolloClient<unknown>;
  const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql';

  beforeAll(() => {
    client = new ApolloClient({
      link: new HttpLink({
        uri: GRAPHQL_ENDPOINT,
        fetch,
      }),
      cache: new InMemoryCache(),
    });
  });

  afterAll(() => {
    if (client) {
      client.stop();
    }
  });

  describe('Backend Connectivity', () => {
    it('should successfully connect to GraphQL endpoint', async () => {
      const query = gql`
        query TestConnection {
          __typename
        }
      `;

      const { data, errors } = await client.query({
        query,
        fetchPolicy: 'network-only',
      });

      expect(errors).toBeUndefined();
      expect(data.__typename).toBe('Query');
    });
  });

  describe('Project Queries', () => {
    it('should successfully query projects list', async () => {
      const { data, errors } = await client.query({
        query: GET_PROJECTS,
        fetchPolicy: 'network-only',
      });

      expect(errors).toBeUndefined();
      expect(data).toBeDefined();
      expect(data.projects).toBeDefined();
      expect(Array.isArray(data.projects)).toBe(true);

      // Validate type structure if data exists
      if (data.projects.length > 0) {
        const project = data.projects[0];
        expect(project).toHaveProperty('id');
        expect(project).toHaveProperty('name');
        expect(project).toHaveProperty('createdAt');
        expect(project).toHaveProperty('updatedAt');
        expect(typeof project.id).toBe('string');
        expect(typeof project.name).toBe('string');
      }
    });

    it('should successfully query single project with nested data', async () => {
      // First get a project ID
      const projectsResult = await client.query({
        query: GET_PROJECTS,
        fetchPolicy: 'network-only',
      });

      if (projectsResult.data.projects.length > 0) {
        const projectId = projectsResult.data.projects[0].id;

        const { data, errors } = await client.query({
          query: GET_PROJECT,
          variables: { id: projectId },
          fetchPolicy: 'network-only',
        });

        expect(errors).toBeUndefined();
        expect(data).toBeDefined();
        expect(data.project).toBeDefined();

        if (data.project) {
          // Validate top-level project fields
          expect(data.project.id).toBe(projectId);
          expect(data.project).toHaveProperty('name');
          expect(data.project).toHaveProperty('description');
          expect(data.project).toHaveProperty('createdAt');
          expect(data.project).toHaveProperty('updatedAt');

          // Validate nested relationships
          expect(data.project).toHaveProperty('fixtures');
          expect(data.project).toHaveProperty('looks');
          expect(data.project).toHaveProperty('cueLists');
          expect(Array.isArray(data.project.fixtures)).toBe(true);
          expect(Array.isArray(data.project.looks)).toBe(true);
          expect(Array.isArray(data.project.cueLists)).toBe(true);

          // Validate nested object structure if data exists
          if (data.project.fixtures.length > 0) {
            const fixture = data.project.fixtures[0];
            expect(fixture).toHaveProperty('id');
            expect(fixture).toHaveProperty('name');
          }

          if (data.project.looks.length > 0) {
            const look = data.project.looks[0];
            expect(look).toHaveProperty('id');
            expect(look).toHaveProperty('name');
          }

          if (data.project.cueLists.length > 0) {
            const cueList = data.project.cueLists[0];
            expect(cueList).toHaveProperty('id');
            expect(cueList).toHaveProperty('name');
            expect(cueList).toHaveProperty('loop');
            expect(typeof cueList.loop).toBe('boolean');
          }
        }
      } else {
        console.log('Skipping single project test - no projects in database');
      }
    });
  });

  describe('Look Queries', () => {
    it('should successfully query project looks with nested fixture data', async () => {
      // Get a project first
      const projectsResult = await client.query({
        query: GET_PROJECTS,
        fetchPolicy: 'network-only',
      });

      if (projectsResult.data.projects.length > 0) {
        const projectId = projectsResult.data.projects[0].id;

        const { data, errors } = await client.query({
          query: GET_PROJECT_LOOKS,
          variables: { projectId },
          fetchPolicy: 'network-only',
        });

        expect(errors).toBeUndefined();
        expect(data).toBeDefined();
        expect(data.project).toBeDefined();
        expect(data.project.looks).toBeDefined();
        expect(Array.isArray(data.project.looks)).toBe(true);

        // Validate look structure if looks exist
        if (data.project.looks.length > 0) {
          const look = data.project.looks[0];
          expect(look).toHaveProperty('id');
          expect(look).toHaveProperty('name');
          expect(look).toHaveProperty('fixtureValues');
          expect(Array.isArray(look.fixtureValues)).toBe(true);

          // Validate fixture values structure if data exists
          if (look.fixtureValues.length > 0) {
            const fixtureValue = look.fixtureValues[0];
            expect(fixtureValue).toHaveProperty('id');
            expect(fixtureValue).toHaveProperty('fixture');
            expect(fixtureValue).toHaveProperty('channels');
            expect(Array.isArray(fixtureValue.channels)).toBe(true);

            // Validate fixture structure
            const fixture = fixtureValue.fixture;
            expect(fixture).toHaveProperty('id');
            expect(fixture).toHaveProperty('name');
            expect(fixture).toHaveProperty('universe');
            expect(fixture).toHaveProperty('startChannel');
            expect(fixture).toHaveProperty('manufacturer');
            expect(fixture).toHaveProperty('model');
            expect(fixture).toHaveProperty('type');
            expect(fixture).toHaveProperty('modeName');
            expect(fixture).toHaveProperty('channelCount');
            expect(fixture).toHaveProperty('channels');
            expect(Array.isArray(fixture.channels)).toBe(true);

            // Validate channel structure if channels exist
            if (fixture.channels.length > 0) {
              const channel = fixture.channels[0];
              expect(channel).toHaveProperty('id');
              expect(channel).toHaveProperty('offset');
              expect(channel).toHaveProperty('name');
              expect(channel).toHaveProperty('type');
              expect(typeof channel.offset).toBe('number');
            }
          }
        }
      } else {
        console.log('Skipping look test - no projects in database');
      }
    });
  });

  describe('Schema Type Validation', () => {
    it('should respect scalar types for DateTime fields', async () => {
      const projectsResult = await client.query({
        query: GET_PROJECTS,
        fetchPolicy: 'network-only',
      });

      if (projectsResult.data.projects.length > 0) {
        const project = projectsResult.data.projects[0];

        // DateTime should be returned as string (either ISO 8601 or timestamp)
        if (project.createdAt) {
          expect(typeof project.createdAt).toBe('string');

          // Backend returns integer timestamp as string, not ISO 8601
          // Parse as number first, then create Date
          const timestamp = parseInt(project.createdAt, 10);
          const createdDate = new Date(timestamp);

          expect(createdDate).toBeInstanceOf(Date);
          expect(createdDate.getTime()).toBeGreaterThan(0);
          expect(isNaN(createdDate.getTime())).toBe(false);
        }

        if (project.updatedAt) {
          expect(typeof project.updatedAt).toBe('string');
        }
      } else {
        console.log('Skipping DateTime test - no projects in database');
      }
    });

    it('should respect ID scalar type', async () => {
      const projectsResult = await client.query({
        query: GET_PROJECTS,
        fetchPolicy: 'network-only',
      });

      if (projectsResult.data.projects.length > 0) {
        const project = projectsResult.data.projects[0];

        // ID should be a string
        expect(typeof project.id).toBe('string');
        expect(project.id.length).toBeGreaterThan(0);
      }
    });
  });
});
