/* eslint-env browser */
/* global ga */
import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';
import PureRenderMixin from 'react-addons-pure-render-mixin';
import { revealSafe, newGame, setNextGameMode, setNextSafeStart } from '../actions';
require('./info.css');

function RevealSummary({ bestHardcore, revealCount }){
  return <div className='info_summary'>
    <small>current &lt; best</small>
    <div>Squares revealed: { revealCount } <small>&lt; { bestHardcore }</small></div>
  </div>;
}
RevealSummary.propTypes = {
  bestHardcore: PropTypes.number,
  revealCount: PropTypes.number.isRequired
};

class Info extends Component {
  static get propTypes(){
    return {
      bestHardcore: PropTypes.number,
      peerId: PropTypes.string.isRequired,
      reveals: PropTypes.objectOf(PropTypes.shape({
        count: PropTypes.number.isRequired,
        isGameOver: PropTypes.bool.isRequired
      })).isRequired,
      safeStart: PropTypes.bool,
      gameMode: PropTypes.oneOf('normal learning cooperative'.split(' ')),
      nextSafeStart: PropTypes.bool,
      nextGameMode: PropTypes.oneOf('normal learning cooperative'.split(' ')),
      onNewGame: PropTypes.func.isRequired,
      onRevealSafe: PropTypes.func.isRequired,
      onSetNextSafeStart: PropTypes.func.isRequired,
      onSetNextGameMode: PropTypes.func.isRequired
    };
  }

  constructor(){
    super();
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);
  }

  componentDidMount(){
    setTimeout(()=> this.revealIfSafeStart());
  }

  onNewGame(){
    this.props.onNewGame();
    setTimeout(this.revealIfSafeStart.bind(this));
  }

  revealIfSafeStart(){
    ga('send', 'event', 'Game', 'start', location.hash);
    const { onRevealSafe, safeStart } = this.props;

    if (safeStart) onRevealSafe();
  }

  render(){
    const {
      bestHardcore, peerId, reveals, safeStart, gameMode, nextSafeStart, nextGameMode,
      onSetNextSafeStart, onSetNextGameMode
    } = this.props;
    const { count: revealCount } = reveals[peerId];

    const optionsChanged =
      safeStart !== nextSafeStart ||
      gameMode !== nextGameMode;
    let newGame = <small>
      <a onClick={ this.onNewGame.bind(this) }>Start a new game</a>.
    </small>;
    if (optionsChanged){
      newGame = <small>
        To use these settings&nbsp;
        <a onClick={ this.onNewGame.bind(this) }>start a new game</a>
        .
      </small>;
    }
    const gameModes =
    [ { value: 'normal', title: 'Normal', description: 'Play until you hit a mine.' }
    , { value: 'learning', title: 'Learning', description: 'When you hit a mine, you can keep going.' }
    , { value: 'cooperative', title: 'Cooperative', description: 'Work with others to reveal the same map. Once you click a mine, you are out.' }
    ];

    return <div className='info'>
      <RevealSummary revealCount={revealCount} bestHardcore={bestHardcore} />
      { newGame }
      <label className='option'><input type='checkbox' checked={ nextSafeStart } onChange={ onSetNextSafeStart.bind(null, !nextSafeStart) } />Safe start</label>
      <div className="info_gameModes">
        { gameModes.map(({ value, title, description })=>
          <div key={ value }
            className={ value === nextGameMode ? "selected" : "" }
            onClick={ onSetNextGameMode.bind(null, value) }
          >
            <h5>{ title }</h5>
            <blockquote>{ description }</blockquote>
          </div>
        , this) }
      </div>
    </div>;
  }
}
const connectedInfo = connect(
  state => ({
    bestHardcore: state.info.bestHardcore,
    peerId: state.info.peerId,
    reveals: state.info.currentGame.reveals,
    safeStart: state.info.currentGame.safeStart,
    gameMode: state.info.currentGame.gameMode,
    nextSafeStart: state.info.nextGame.safeStart,
    nextGameMode: state.info.nextGame.gameMode
  }),
  dispatch => ({
    onRevealSafe: () => dispatch(revealSafe()),
    onNewGame: () => dispatch(newGame()),
    onSetNextGameMode: gameMode => dispatch(setNextGameMode(gameMode)),
    onSetNextSafeStart: safeStart => dispatch(setNextSafeStart(safeStart))
  })
)(Info);
export default connectedInfo;
