import React from 'react';
import Overdrive from 'react-overdrive';
import cx from 'classnames';
import concat from 'lodash/concat';
import sortBy from 'lodash/sortBy';
import Avatar from './Avatar';
import GameItem from './GameItem';

import './CoinFlip.css';

export default class FlipHistoryRoom extends React.Component {
  constructor() {
    super();
    this.state = {
      winnerSelected: true,
    };
  }

  renderPlayer(avatar) {
    return (
      <div>
        <Avatar src={avatar} size={80} className={cx({"winner": this.state.winnerSelected})} />
        {this.state.winnerSelected ?
          <div style={{fontSize: 16, marginTop: 15, fontWeight: 500, letterSpacing: '0.03em', color: '#bba6ff', textTransform: 'uppercase'}}>Winner</div>
          : null
        }
      </div>
    )
  }

  render() {
    const { countDown, winnerSelected } = this.state;
    const { game: { winner, other, game_value, id, game_winage } } = this.props;

    return (
      <div style={{marginBottom: 10}}>
        <div className="live-room completed">
          <div className="live-room-inner">
            <div className="live-room-left">
              <div className="live-room-players" style={{padding: 10}}>
                <div style={{display: 'flex', alignItems: 'center'}}>
                  <div style={{flex: 1}}></div>
                  <div className="game-winage">
                    <span>{game_winage}%</span>
                    <i className="fa fa-info-circle"/>
                  </div>
                </div>
                <div style={{width: 300, margin: '15px auto 0 auto', overflow: 'hidden', position: 'relative'}}>
                  <div style={{float: 'left', padding: '11px 0 0 11px', textAlign: 'center', width: 100}}>
                    <Avatar src={winner.avatar} size={70} />
                    <div className="player_name">{winner.profile_name}</div>
                  </div>
                  <div style={{float: 'right', padding: '11px 0 0 11px', textAlign: 'center', width: 100}} className="looser">
                    <Avatar src={other.avatar} size={70} />
                    <div className="player_name">{other.profile_name}</div>
                  </div>
                  <div style={{position: 'absolute', top: 30, left: 136, fontSize: 20, padding: 20, border: '2px solid #6048b2', borderRadius: '50%', padding: 13, boxSizing: 'border-box', lineHeight: '1'}}>
                    vs
                  </div>
                </div>
              </div>
            </div>
            <div className="live-room-right" style={{position: 'relative'}}>
              <div className="live-room-game-info" style={{paddingBottom: 10}}>
                {this.renderPlayer(winner.avatar)}
              </div>
              <div style={{bottom: 25, left: 25, right: 25}}>
                <div style={{lineHeight: '50px', background: 'rgba(0, 0, 0, .3)', textAlign: 'center', color: '#0ced7b', fontSize: 28, fontWeight: 500}}>
                  {game_value.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
