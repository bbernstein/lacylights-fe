import { gql } from '@apollo/client';
import {
  GET_PROJECT_SCENE_BOARDS,
  GET_SCENE_BOARD,
  CREATE_SCENE_BOARD,
  UPDATE_SCENE_BOARD,
  DELETE_SCENE_BOARD,
  ADD_SCENE_TO_BOARD,
  UPDATE_SCENE_BOARD_BUTTON,
  REMOVE_SCENE_FROM_BOARD,
  UPDATE_SCENE_BOARD_BUTTON_POSITIONS,
  ACTIVATE_SCENE_FROM_BOARD,
} from '../sceneBoards';

describe('Scene Board GraphQL Operations', () => {
  describe('Queries', () => {
    it('GET_PROJECT_SCENE_BOARDS should be defined and have correct structure', () => {
      expect(GET_PROJECT_SCENE_BOARDS).toBeDefined();
      expect(GET_PROJECT_SCENE_BOARDS.kind).toBe('Document');

      const queryString = GET_PROJECT_SCENE_BOARDS.loc?.source.body;
      expect(queryString).toContain('query GetProjectSceneBoards');
      expect(queryString).toContain('$projectId: ID!');
      expect(queryString).toContain('sceneBoards(projectId: $projectId)');
      expect(queryString).toContain('id');
      expect(queryString).toContain('name');
      expect(queryString).toContain('description');
      expect(queryString).toContain('defaultFadeTime');
      expect(queryString).toContain('gridSize');
      expect(queryString).toContain('buttons');
    });

    it('GET_SCENE_BOARD should be defined and have correct structure', () => {
      expect(GET_SCENE_BOARD).toBeDefined();
      expect(GET_SCENE_BOARD.kind).toBe('Document');

      const queryString = GET_SCENE_BOARD.loc?.source.body;
      expect(queryString).toContain('query GetSceneBoard');
      expect(queryString).toContain('$id: ID!');
      expect(queryString).toContain('sceneBoard(id: $id)');
      expect(queryString).toContain('project');
      expect(queryString).toContain('buttons');
    });
  });

  describe('Mutations', () => {
    it('CREATE_SCENE_BOARD should be defined and have correct structure', () => {
      expect(CREATE_SCENE_BOARD).toBeDefined();
      expect(CREATE_SCENE_BOARD.kind).toBe('Document');

      const mutationString = CREATE_SCENE_BOARD.loc?.source.body;
      expect(mutationString).toContain('mutation CreateSceneBoard');
      expect(mutationString).toContain('$input: CreateSceneBoardInput!');
      expect(mutationString).toContain('createSceneBoard(input: $input)');
    });

    it('UPDATE_SCENE_BOARD should be defined and have correct structure', () => {
      expect(UPDATE_SCENE_BOARD).toBeDefined();
      expect(UPDATE_SCENE_BOARD.kind).toBe('Document');

      const mutationString = UPDATE_SCENE_BOARD.loc?.source.body;
      expect(mutationString).toContain('mutation UpdateSceneBoard');
      expect(mutationString).toContain('$id: ID!');
      expect(mutationString).toContain('$input: UpdateSceneBoardInput!');
      expect(mutationString).toContain('updateSceneBoard(id: $id, input: $input)');
    });

    it('DELETE_SCENE_BOARD should be defined and have correct structure', () => {
      expect(DELETE_SCENE_BOARD).toBeDefined();
      expect(DELETE_SCENE_BOARD.kind).toBe('Document');

      const mutationString = DELETE_SCENE_BOARD.loc?.source.body;
      expect(mutationString).toContain('mutation DeleteSceneBoard');
      expect(mutationString).toContain('$id: ID!');
      expect(mutationString).toContain('deleteSceneBoard(id: $id)');
    });

    it('ADD_SCENE_TO_BOARD should be defined and have correct structure', () => {
      expect(ADD_SCENE_TO_BOARD).toBeDefined();
      expect(ADD_SCENE_TO_BOARD.kind).toBe('Document');

      const mutationString = ADD_SCENE_TO_BOARD.loc?.source.body;
      expect(mutationString).toContain('mutation AddSceneToBoard');
      expect(mutationString).toContain('$input: CreateSceneBoardButtonInput!');
      expect(mutationString).toContain('addSceneToBoard(input: $input)');
      expect(mutationString).toContain('layoutX');
      expect(mutationString).toContain('layoutY');
      expect(mutationString).toContain('scene');
      expect(mutationString).toContain('sceneBoard');
    });

    it('UPDATE_SCENE_BOARD_BUTTON should be defined and have correct structure', () => {
      expect(UPDATE_SCENE_BOARD_BUTTON).toBeDefined();
      expect(UPDATE_SCENE_BOARD_BUTTON.kind).toBe('Document');

      const mutationString = UPDATE_SCENE_BOARD_BUTTON.loc?.source.body;
      expect(mutationString).toContain('mutation UpdateSceneBoardButton');
      expect(mutationString).toContain('$id: ID!');
      expect(mutationString).toContain('$input: UpdateSceneBoardButtonInput!');
      expect(mutationString).toContain('updateSceneBoardButton(id: $id, input: $input)');
      expect(mutationString).toContain('color');
      expect(mutationString).toContain('label');
    });

    it('REMOVE_SCENE_FROM_BOARD should be defined and have correct structure', () => {
      expect(REMOVE_SCENE_FROM_BOARD).toBeDefined();
      expect(REMOVE_SCENE_FROM_BOARD.kind).toBe('Document');

      const mutationString = REMOVE_SCENE_FROM_BOARD.loc?.source.body;
      expect(mutationString).toContain('mutation RemoveSceneFromBoard');
      expect(mutationString).toContain('$buttonId: ID!');
      expect(mutationString).toContain('removeSceneFromBoard(buttonId: $buttonId)');
    });

    it('UPDATE_SCENE_BOARD_BUTTON_POSITIONS should be defined and have correct structure', () => {
      expect(UPDATE_SCENE_BOARD_BUTTON_POSITIONS).toBeDefined();
      expect(UPDATE_SCENE_BOARD_BUTTON_POSITIONS.kind).toBe('Document');

      const mutationString = UPDATE_SCENE_BOARD_BUTTON_POSITIONS.loc?.source.body;
      expect(mutationString).toContain('mutation UpdateSceneBoardButtonPositions');
      expect(mutationString).toContain('$positions: [SceneBoardButtonPositionInput!]!');
      expect(mutationString).toContain('updateSceneBoardButtonPositions(positions: $positions)');
    });

    it('ACTIVATE_SCENE_FROM_BOARD should be defined and have correct structure', () => {
      expect(ACTIVATE_SCENE_FROM_BOARD).toBeDefined();
      expect(ACTIVATE_SCENE_FROM_BOARD.kind).toBe('Document');

      const mutationString = ACTIVATE_SCENE_FROM_BOARD.loc?.source.body;
      expect(mutationString).toContain('mutation ActivateSceneFromBoard');
      expect(mutationString).toContain('$sceneBoardId: ID!');
      expect(mutationString).toContain('$sceneId: ID!');
      expect(mutationString).toContain('$fadeTimeOverride: Float');
      expect(mutationString).toContain('activateSceneFromBoard');
    });
  });

  describe('Query and Mutation Validation', () => {
    it('all queries should be valid GraphQL DocumentNode objects', () => {
      const queries = [GET_PROJECT_SCENE_BOARDS, GET_SCENE_BOARD];

      queries.forEach((query) => {
        expect(query.kind).toBe('Document');
        expect(query.definitions).toBeDefined();
        expect(query.definitions.length).toBeGreaterThan(0);
      });
    });

    it('all mutations should be valid GraphQL DocumentNode objects', () => {
      const mutations = [
        CREATE_SCENE_BOARD,
        UPDATE_SCENE_BOARD,
        DELETE_SCENE_BOARD,
        ADD_SCENE_TO_BOARD,
        UPDATE_SCENE_BOARD_BUTTON,
        REMOVE_SCENE_FROM_BOARD,
        UPDATE_SCENE_BOARD_BUTTON_POSITIONS,
        ACTIVATE_SCENE_FROM_BOARD,
      ];

      mutations.forEach((mutation) => {
        expect(mutation.kind).toBe('Document');
        expect(mutation.definitions).toBeDefined();
        expect(mutation.definitions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Field Coverage', () => {
    it('GET_PROJECT_SCENE_BOARDS should include all essential scene board fields', () => {
      const queryString = GET_PROJECT_SCENE_BOARDS.loc?.source.body || '';

      // Essential board fields
      expect(queryString).toContain('id');
      expect(queryString).toContain('name');
      expect(queryString).toContain('description');
      expect(queryString).toContain('defaultFadeTime');
      expect(queryString).toContain('gridSize');
      expect(queryString).toContain('createdAt');
      expect(queryString).toContain('updatedAt');

      // Button fields
      expect(queryString).toContain('buttons');
      expect(queryString).toContain('layoutX');
      expect(queryString).toContain('layoutY');
      expect(queryString).toContain('width');
      expect(queryString).toContain('height');
      expect(queryString).toContain('color');
      expect(queryString).toContain('label');

      // Scene reference
      expect(queryString).toContain('scene');
    });

    it('GET_SCENE_BOARD should include project relationship', () => {
      const queryString = GET_SCENE_BOARD.loc?.source.body || '';

      expect(queryString).toContain('project');
      expect(queryString).toContain('buttons');
    });

    it('ADD_SCENE_TO_BOARD should return all button properties', () => {
      const mutationString = ADD_SCENE_TO_BOARD.loc?.source.body || '';

      expect(mutationString).toContain('id');
      expect(mutationString).toContain('layoutX');
      expect(mutationString).toContain('layoutY');
      expect(mutationString).toContain('width');
      expect(mutationString).toContain('height');
      expect(mutationString).toContain('color');
      expect(mutationString).toContain('label');
      expect(mutationString).toContain('scene {');
      expect(mutationString).toContain('sceneBoard {');
    });
  });
});
