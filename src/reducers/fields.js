import { REVEAL, FLAG, UNFLAG, SET_MAP } from '../actions';
import fieldReducer from './field';
import { neighborIndexes, nineSquare, fieldSize } from '../helpers';

function createNewNeighbors(fields, field, seed){
  return nineSquare
  .map(p => ({ x: field.position.x + p.x, y: field.position.y + p.y }))
  .map(p => {
    const field = fields.find(f => f.position.x === p.x && f.position.y === p.y);
    if (!field) {
      return fieldReducer(undefined, { x: p.x * fieldSize, y: p.y * fieldSize }, seed);
    }
  })
  .filter(e => e);
}

function ensureFieldWithNeighbors(field, fields){
  if (field.loaded) return field;
  const neighborFields = nineSquare
    .map(p => fields.find(f =>
      field.position.x + p.x === f.position.x &&
      field.position.y + p.y === f.position.y
    ))
    .filter(f => f);
  if (neighborFields.length !== 9) return field;
  let plusCells = [
    neighborFields[8].cells[fieldSize * fieldSize - 1],
    ...neighborFields[1].cells.slice(fieldSize * (fieldSize - 1), fieldSize * fieldSize),
    neighborFields[2].cells[fieldSize * (fieldSize - 1)]
  ];
  for (let i = 0; i < fieldSize; i++) {
    plusCells = plusCells.concat([
      neighborFields[7].cells[fieldSize * (i + 1) - 1],
      ...field.cells.slice(fieldSize * i, fieldSize * (i + 1)),
      neighborFields[3].cells[fieldSize * i]
    ]);
  }
  plusCells = plusCells.concat([
    neighborFields[6].cells[fieldSize - 1],
    ...neighborFields[5].cells.slice(0, fieldSize),
    neighborFields[4].cells[0]
  ]);
  return Object.assign({}, field, {
    loaded: true,
    cells: plusCells.map((cell, cellIndex) => {
      const cellNeighborIndexes = neighborIndexes(fieldSize + 2, cellIndex);
      if (cellNeighborIndexes.length !== 8) return;

      return Object.assign(cell, {
        neighboringMineCount: cellNeighborIndexes
          .reduce((count, neighborIndex) => {
            return count + (plusCells[neighborIndex].mine ? 1 : 0);
          }, cell.mine ? 1 : 0)
      });
    }).filter(n => n)
  });
}

function delegateActionToIndividualFields(state, action){
  const { info: { game: { map: { seed } } } } = state;
  if (seed !== action.seed) return state;
  const positionsByField = action.positions.reduce((acc, position) => {
    const fx = Math.floor(position.x / fieldSize);
    const fy = Math.floor(position.y / fieldSize);
    const field = state.fields.find(field => field.position.x === fx && field.position.y === fy);
    if (!acc.has(field)) acc.set(field, []);
    const positions = acc.get(field);
    positions.push({ x: position.x - fx * fieldSize, y: position.y - fy * fieldSize });
    acc.set(field, positions);
    return acc;
  }, new Map());
  const newState = Array.from(positionsByField.keys())
  .filter(f => !f.loaded)
  .reduce((fields, fieldToLoad) => {
    return fields.concat(createNewNeighbors(fields, fieldToLoad, state.info.game.map.seed));
  }, state.fields);
  return Object.assign({}, state, {
    fields: newState.map((field, _fieldIndex, fields) => {
      if (positionsByField.has(field)) {
        return fieldReducer(ensureFieldWithNeighbors(field, fields), Object.assign({}, action, {
          positions: positionsByField.get(field),
          loaded: true
        }));
      }
      return field;
    })
  });
}

function init(state){
  if (!state.info.game || !state.info.game.map) return state;
  const { info: { game: { map: { seed } } } } = state;

  const fields = nineSquare
    .reduce((fields, position) => {
      return fields.concat(
        createNewNeighbors(fields, { position }, seed)
      );
    }, [])
    .map((field, _i, fields) => ensureFieldWithNeighbors(field, fields));
  return Object.assign({}, state, { fields });
}

export default function fields(_state, action){
  const state = (_state && _state.fields) ? _state : init(_state);

  const r = {
    [SET_MAP]: ()=> init(state),
    [REVEAL]: ()=> delegateActionToIndividualFields(state, action),
    [FLAG]: ()=> delegateActionToIndividualFields(state, action),
    [UNFLAG]: ()=> delegateActionToIndividualFields(state, action)
  }[action.type];
  return r ? r(action) : state;
}
