import React from 'react';
import Helmet from 'react-helmet';
import axios from 'axios';
import sortBy from 'lodash/sortBy';
import MDSpinner from 'react-md-spinner';
import find from 'lodash/find';
import isArray from 'lodash/isArray';
import FlipMove from 'react-flip-move';
import LiveRoom from './FlipHistoryRoom';


export default class CoinflipHistory extends React.Component {
  constructor() {
    super();
    this.state = {
      data: [],
      loading: false
    };
  }

  componentDidMount() {
    this.setState({ loading: true });
    axios.get('/coinflip/history').then(resp => {
      const { data } = resp;
      const games = data.response.map(this.formatData);
      this.setState({ data: games, loading: false });
    })
  }

  formatData(i) {
    const users =  isArray(i.users) ? i.users :  JSON.parse(`[${i.users}]`);
    i.users = users;
    const winner = find(users, { id: i.game_winner });
    const other = find(users, u => u.id != winner.id);
    i.winner = winner;
    i.other = other;
    return i;
  }

  componentWillReceiveProps(nextProps) {
    const { liveHistory } = nextProps;
    if(!liveHistory) return;
    const { data } = this.state;
    if(data.length) {
      const first = data[0];
      if(first.id != liveHistory.id) {
        data.unshift(this.formatData(liveHistory));
        this.setState({ data });
      }
    } else {
      this.setState({
        data: [liveHistory]
      });
    }
  }

  render() {
    return (
      <div>
        <Helmet><title>Coinflip history</title></Helmet>
          { this.state.loading &&
          <div style={{textAlign: 'center'}}>
            <MDSpinner
              singleColor="#6963C0"
              size={24}
            />
          </div>
        }
        <FlipMove
          duration={200}
          appearAnimation="elevator"
          leaveAnimation="elevator"
        >
          {this.state.data.map(game => {
            game.completed = true;
            return (
              <LiveRoom
                key={game.id}
                soundOn={false}
                game={game}
              />
            )
          })}
        </FlipMove>
      </div>
    )
  }
}