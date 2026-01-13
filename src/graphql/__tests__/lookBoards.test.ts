import {
  GET_PROJECT_LOOK_BOARDS,
  GET_LOOK_BOARD,
  CREATE_LOOK_BOARD,
  UPDATE_LOOK_BOARD,
  DELETE_LOOK_BOARD,
  ADD_LOOK_TO_BOARD,
  UPDATE_LOOK_BOARD_BUTTON,
  REMOVE_LOOK_FROM_BOARD,
  UPDATE_LOOK_BOARD_BUTTON_POSITIONS,
  ACTIVATE_LOOK_FROM_BOARD,
} from '../lookBoards';

describe('GraphQL Look Boards', () => {
  describe('Query exports', () => {
    it('exports GET_PROJECT_LOOK_BOARDS query', () => {
      expect(GET_PROJECT_LOOK_BOARDS).toBeDefined();
      expect(GET_PROJECT_LOOK_BOARDS.kind).toBe('Document');
    });

    it('exports GET_LOOK_BOARD query', () => {
      expect(GET_LOOK_BOARD).toBeDefined();
      expect(GET_LOOK_BOARD.kind).toBe('Document');
    });
  });

  describe('Mutation exports', () => {
    it('exports CREATE_LOOK_BOARD mutation', () => {
      expect(CREATE_LOOK_BOARD).toBeDefined();
      expect(CREATE_LOOK_BOARD.kind).toBe('Document');
    });

    it('exports UPDATE_LOOK_BOARD mutation', () => {
      expect(UPDATE_LOOK_BOARD).toBeDefined();
      expect(UPDATE_LOOK_BOARD.kind).toBe('Document');
    });

    it('exports DELETE_LOOK_BOARD mutation', () => {
      expect(DELETE_LOOK_BOARD).toBeDefined();
      expect(DELETE_LOOK_BOARD.kind).toBe('Document');
    });

    it('exports ADD_LOOK_TO_BOARD mutation', () => {
      expect(ADD_LOOK_TO_BOARD).toBeDefined();
      expect(ADD_LOOK_TO_BOARD.kind).toBe('Document');
    });

    it('exports UPDATE_LOOK_BOARD_BUTTON mutation', () => {
      expect(UPDATE_LOOK_BOARD_BUTTON).toBeDefined();
      expect(UPDATE_LOOK_BOARD_BUTTON.kind).toBe('Document');
    });

    it('exports REMOVE_LOOK_FROM_BOARD mutation', () => {
      expect(REMOVE_LOOK_FROM_BOARD).toBeDefined();
      expect(REMOVE_LOOK_FROM_BOARD.kind).toBe('Document');
    });

    it('exports UPDATE_LOOK_BOARD_BUTTON_POSITIONS mutation', () => {
      expect(UPDATE_LOOK_BOARD_BUTTON_POSITIONS).toBeDefined();
      expect(UPDATE_LOOK_BOARD_BUTTON_POSITIONS.kind).toBe('Document');
    });

    it('exports ACTIVATE_LOOK_FROM_BOARD mutation', () => {
      expect(ACTIVATE_LOOK_FROM_BOARD).toBeDefined();
      expect(ACTIVATE_LOOK_FROM_BOARD.kind).toBe('Document');
    });
  });

  describe('GraphQL document validation', () => {
    it('all queries are valid GraphQL documents', () => {
      const queries = [GET_PROJECT_LOOK_BOARDS, GET_LOOK_BOARD];

      queries.forEach(query => {
        expect(query.kind).toBe('Document');
        expect(query.definitions).toBeDefined();
        expect(query.definitions.length).toBeGreaterThan(0);
      });
    });

    it('all mutations are valid GraphQL documents', () => {
      const mutations = [
        CREATE_LOOK_BOARD,
        UPDATE_LOOK_BOARD,
        DELETE_LOOK_BOARD,
        ADD_LOOK_TO_BOARD,
        UPDATE_LOOK_BOARD_BUTTON,
        REMOVE_LOOK_FROM_BOARD,
        UPDATE_LOOK_BOARD_BUTTON_POSITIONS,
        ACTIVATE_LOOK_FROM_BOARD,
      ];

      mutations.forEach(mutation => {
        expect(mutation.kind).toBe('Document');
        expect(mutation.definitions).toBeDefined();
        expect(mutation.definitions.length).toBeGreaterThan(0);
      });
    });

    it('operations have valid definitions', () => {
      const operations = [
        GET_PROJECT_LOOK_BOARDS,
        GET_LOOK_BOARD,
        CREATE_LOOK_BOARD,
        UPDATE_LOOK_BOARD,
        DELETE_LOOK_BOARD,
      ];

      operations.forEach(operation => {
        const definition = operation.definitions[0];
        expect(definition.kind).toBe('OperationDefinition');
      });
    });
  });

  describe('Query structure validation', () => {
    it('GET_PROJECT_LOOK_BOARDS contains expected content', () => {
      const queryString = GET_PROJECT_LOOK_BOARDS.loc?.source.body;
      expect(queryString).toContain('query');
      expect(queryString?.toLowerCase()).toContain('lookboards');
      expect(queryString).toContain('$projectId');
    });

    it('GET_LOOK_BOARD contains expected content', () => {
      const queryString = GET_LOOK_BOARD.loc?.source.body;
      expect(queryString).toContain('query');
      expect(queryString?.toLowerCase()).toContain('lookboard');
      expect(queryString).toContain('$id');
    });
  });

  describe('Mutation structure validation', () => {
    it('CREATE_LOOK_BOARD contains expected content', () => {
      const mutationString = CREATE_LOOK_BOARD.loc?.source.body;
      expect(mutationString).toContain('mutation');
      expect(mutationString?.toLowerCase()).toContain('createlookboard');
      expect(mutationString).toContain('$input');
    });

    it('UPDATE_LOOK_BOARD contains expected content', () => {
      const mutationString = UPDATE_LOOK_BOARD.loc?.source.body;
      expect(mutationString).toContain('mutation');
      expect(mutationString?.toLowerCase()).toContain('updatelookboard');
      expect(mutationString).toContain('$id');
      expect(mutationString).toContain('$input');
    });

    it('DELETE_LOOK_BOARD contains expected content', () => {
      const mutationString = DELETE_LOOK_BOARD.loc?.source.body;
      expect(mutationString).toContain('mutation');
      expect(mutationString?.toLowerCase()).toContain('deletelookboard');
      expect(mutationString).toContain('$id');
    });

    it('ADD_LOOK_TO_BOARD contains expected content', () => {
      const mutationString = ADD_LOOK_TO_BOARD.loc?.source.body;
      expect(mutationString).toContain('mutation');
      expect(mutationString?.toLowerCase()).toContain('addlooktoboard');
      expect(mutationString).toContain('$input');
    });

    it('UPDATE_LOOK_BOARD_BUTTON contains expected content', () => {
      const mutationString = UPDATE_LOOK_BOARD_BUTTON.loc?.source.body;
      expect(mutationString).toContain('mutation');
      expect(mutationString?.toLowerCase()).toContain('updatelookboardbutton');
      expect(mutationString).toContain('$id');
      expect(mutationString).toContain('$input');
    });

    it('REMOVE_LOOK_FROM_BOARD contains expected content', () => {
      const mutationString = REMOVE_LOOK_FROM_BOARD.loc?.source.body;
      expect(mutationString).toContain('mutation');
      expect(mutationString?.toLowerCase()).toContain('removelookfromboard');
      expect(mutationString).toContain('$buttonId');
    });

    it('UPDATE_LOOK_BOARD_BUTTON_POSITIONS contains expected content', () => {
      const mutationString = UPDATE_LOOK_BOARD_BUTTON_POSITIONS.loc?.source.body;
      expect(mutationString).toContain('mutation');
      expect(mutationString?.toLowerCase()).toContain('updatelookboardbuttonpositions');
      expect(mutationString).toContain('$positions');
    });

    it('ACTIVATE_LOOK_FROM_BOARD contains expected content', () => {
      const mutationString = ACTIVATE_LOOK_FROM_BOARD.loc?.source.body;
      expect(mutationString).toContain('mutation');
      expect(mutationString?.toLowerCase()).toContain('activatelookfromboard');
      expect(mutationString).toContain('$lookBoardId');
      expect(mutationString).toContain('$lookId');
    });
  });

  describe('Variable requirements', () => {
    it('GET_PROJECT_LOOK_BOARDS requires projectId variable', () => {
      const operation = GET_PROJECT_LOOK_BOARDS.definitions[0];
      if (operation.kind === 'OperationDefinition' && operation.variableDefinitions) {
        const hasProjectIdVariable = operation.variableDefinitions.some(
          varDef => varDef.variable.name.value === 'projectId'
        );
        expect(hasProjectIdVariable).toBe(true);
      }
    });

    it('GET_LOOK_BOARD requires id variable', () => {
      const operation = GET_LOOK_BOARD.definitions[0];
      if (operation.kind === 'OperationDefinition' && operation.variableDefinitions) {
        const hasIdVariable = operation.variableDefinitions.some(
          varDef => varDef.variable.name.value === 'id'
        );
        expect(hasIdVariable).toBe(true);
      }
    });

    it('CREATE_LOOK_BOARD requires input variable', () => {
      const operation = CREATE_LOOK_BOARD.definitions[0];
      if (operation.kind === 'OperationDefinition' && operation.variableDefinitions) {
        const hasInputVariable = operation.variableDefinitions.some(
          varDef => varDef.variable.name.value === 'input'
        );
        expect(hasInputVariable).toBe(true);
      }
    });

    it('UPDATE_LOOK_BOARD requires id and input variables', () => {
      const operation = UPDATE_LOOK_BOARD.definitions[0];
      if (operation.kind === 'OperationDefinition' && operation.variableDefinitions) {
        const variableNames = operation.variableDefinitions.map(
          varDef => varDef.variable.name.value
        );
        expect(variableNames).toContain('id');
        expect(variableNames).toContain('input');
      }
    });

    it('DELETE_LOOK_BOARD requires id variable', () => {
      const operation = DELETE_LOOK_BOARD.definitions[0];
      if (operation.kind === 'OperationDefinition' && operation.variableDefinitions) {
        const hasIdVariable = operation.variableDefinitions.some(
          varDef => varDef.variable.name.value === 'id'
        );
        expect(hasIdVariable).toBe(true);
      }
    });

    it('ACTIVATE_LOOK_FROM_BOARD requires lookBoardId and lookId variables', () => {
      const operation = ACTIVATE_LOOK_FROM_BOARD.definitions[0];
      if (operation.kind === 'OperationDefinition' && operation.variableDefinitions) {
        const variableNames = operation.variableDefinitions.map(
          varDef => varDef.variable.name.value
        );
        expect(variableNames).toContain('lookBoardId');
        expect(variableNames).toContain('lookId');
      }
    });
  });

  describe('Field selections', () => {
    it('look board queries include essential fields', () => {
      const queryString = GET_PROJECT_LOOK_BOARDS.loc?.source.body;
      expect(queryString).toContain('id');
      expect(queryString).toContain('name');
      expect(queryString).toContain('description');
      expect(queryString).toContain('defaultFadeTime');
      expect(queryString).toContain('gridSize');
      expect(queryString).toContain('canvasWidth');
      expect(queryString).toContain('canvasHeight');
    });

    it('GET_LOOK_BOARD includes buttons with layout fields', () => {
      const queryString = GET_LOOK_BOARD.loc?.source.body;
      expect(queryString).toContain('buttons');
      expect(queryString).toContain('layoutX');
      expect(queryString).toContain('layoutY');
      expect(queryString).toContain('width');
      expect(queryString).toContain('height');
      expect(queryString).toContain('color');
      expect(queryString).toContain('label');
    });

    it('button queries include look reference', () => {
      const queryString = GET_LOOK_BOARD.loc?.source.body;
      expect(queryString).toContain('look');
    });
  });

  describe('Operation types', () => {
    it('queries have correct operation type', () => {
      const queries = [GET_PROJECT_LOOK_BOARDS, GET_LOOK_BOARD];
      queries.forEach(query => {
        const operation = query.definitions[0];
        if (operation.kind === 'OperationDefinition') {
          expect(operation.operation).toBe('query');
        }
      });
    });

    it('mutations have correct operation type', () => {
      const mutations = [
        CREATE_LOOK_BOARD,
        UPDATE_LOOK_BOARD,
        DELETE_LOOK_BOARD,
        ADD_LOOK_TO_BOARD,
        UPDATE_LOOK_BOARD_BUTTON,
        REMOVE_LOOK_FROM_BOARD,
        UPDATE_LOOK_BOARD_BUTTON_POSITIONS,
        ACTIVATE_LOOK_FROM_BOARD,
      ];
      mutations.forEach(mutation => {
        const operation = mutation.definitions[0];
        if (operation.kind === 'OperationDefinition') {
          expect(operation.operation).toBe('mutation');
        }
      });
    });
  });
});
