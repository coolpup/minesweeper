/* eslint-env browser */
import { REVEAL } from '../actions';
import { cellAt, newSeed } from '../helpers';

const bestHardcoreKey = 'minesweeper.bestHardcore';

export function init(){
  let bestHardcore = localStorage.getItem(bestHardcoreKey);
  if (bestHardcore) bestHardcore = parseInt(bestHardcore, 10);
  const hashOptions = location.hash
    .slice(1)
    .split(',')
    .reduce((hash,str) => {
      const [ key, value ] = str.split("=");
      hash[key] = value === undefined ? true : value;
      return hash;
    }, {
      safeStart: false,
      hardcore: false
    });
  const seed = hashOptions.mapKey || newSeed();
  return {
    reveals: [ 0 ],
    bestHardcore,
    seed,
    options: hashOptions
  };
}

export default function info(state, action){
  const isHardcore = state.info.options.hardcore;

  switch (action.type){
    case REVEAL:
      const fields = state.fields;
      const newInfo = action.positions.reduce((state, pos) => {
        const cell = cellAt(fields, pos.x, pos.y);
        if (cell.mine) {
          if (isHardcore){
            return Object.assign({}, state, {
              isGameOver: true
            });
          } else {
            return Object.assign({}, state, {
              reveals: [ 0, ...state.reveals ]
            });
          }
        }
        const currentReveals = state.reveals[0] + 1;
        let bestHardcore = state.bestHardcore;
        if (isHardcore && currentReveals > bestHardcore) {
          bestHardcore = currentReveals;
          try {
            localStorage.setItem(bestHardcoreKey, bestHardcore);
          } catch (e) { console.error(e); }
        }
        return Object.assign({}, state, {
          bestHardcore,
          reveals: [
            currentReveals,
            ...state.reveals.slice(1)
          ]
        });
      }, state.info);
      return Object.assign({}, state, { info: newInfo });

    default:
      return state;
  }
}
