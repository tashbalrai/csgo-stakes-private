import React from 'react';
import {
  BrowserRouter as Router,
  Route,
  Switch
} from 'react-router-dom';
import Helmet from 'react-helmet';
import {ToastContainer} from 'react-toastify';
import axios from 'axios';
import MDSpinner from 'react-md-spinner';
import IO from 'socket.io-client';

import NoMatch from './NoMatch';
import Coinflip from './Coinflip';
import Jackpot from './Jackpot';
import Giveaway from './Giveaway';
import MyHistory from './MyHistory';
import Support from './Support';
import TicketDetails from './TicketDetails';

import HeaderBar from './HeaderBar';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';
import LoginDialog from './Dialogs/LoginDialog';
import TradeURLDialog from './Dialogs/TradeURLDialog';
import DepositDialog from './Dialogs/DepositDialog';
import {createToast} from './utils';

import 'normalize.css';
import './App.css';
import 'react-toastify/dist/ReactToastify.min.css';

axios.defaults.headers.post['Content-Type'] = 'application/json';
axios.defaults.headers.get['Cache-Control'] = 'no-cache';


if(process.env.NODE_ENV != 'production') {
  window.STAKESAPP = window.STAKESAPP  ||
    (window.location.search ?
        {"token":"ade39087c69e19418f908e18687516bc10c5d715f476e68425ab8ecdf10a02e7","sid":"5"} :
        {"token":"eb5ba7f958266b6eed5dbf875054be65d6de8df2d422b59474114deb54303b02","sid":"7"}
    );
} else {
  window.STAKESAPP = window.STAKESAPP || {};
}

axios.interceptors.request.use(function (config) {
  if (window.STAKESAPP.token && window.STAKESAPP.sid) {
    config.headers['x-access-token'] = window.STAKESAPP.token;
    config.headers['x-user-sid'] = window.STAKESAPP.sid;
    config.headers['content-type'] = 'application/json';
  }
  return config;
}, function (error) {
  return Promise.reject(error);
});

export default class App extends React.Component {
  static childContextTypes = {
    updateClientCount: React.PropTypes.func,
    refreshInventory: React.PropTypes.func
  };

  constructor() {
    super();
    this.state = {
      loading: true,
      isLoggedIn: false,
      user: {
        id: null,
      },
      loginDialogIsOpen: true,
      tradeURLDialogIsOpen: false,
      soundOn: true,
      clientCount: 0,
      games: [],
      joinedGames: [],
      liveHistory: null
    };

    this.updateClientCount = this.updateClientCount.bind(this);
    this.toggleSound = this.toggleSound.bind(this);
    this.removeGame = this.removeGame.bind(this);
    this.onJoin = this.onJoin.bind(this);
  }

  getChildContext() {
    return {
      updateClientCount: this.updateClientCount,
      refreshInventory: () => this.rightPanel.inventoryContainer.refreshInventory()
    };
  }

  componentWillMount() {
    this.getGames();
    this.getGiveaway();
    if (window.STAKESAPP.token && window.STAKESAPP.sid) {
      this.setState({loading: true});

      axios.post(`/user/auth`, {}, {
        headers: {
          'x-access-token': window.STAKESAPP.token,
          'x-user-sid': window.STAKESAPP.sid,
          'content-type': 'application/json'
        }
      }).then(resp => {
        this.setState({
          user: resp.data,
          token: window.STAKESAPP.token,
          isLoggedIn: true,
          loading: false
        }, this.listenSocket);

      }).catch(e => {
        this.setState({loading: false});
      });
    } else {
      this.setState({loading: false});
    }
  }

  listenSocket() {
    if (this.state.isLoggedIn) {
      this.socket = IO('/bn', {
        transportOptions: {
          polling: {
            extraHeaders: {
              'x-access-token': this.state.token,
              'x-user-sid': this.state.user.id
            }
          }
        }
      });

      this.socket.on('game.created', e => {
        const game = e.data.game;
        const games = this.state.games;
        games.push(game);
        this.setState({games: [...games]});
      });

      this.socket.on('game.joined', e => {
        const game = e.data.game;
        const games = this.state.games;
        this.setState({games: games.filter(g => g.id != game.id)});
      });

      this.socket.on('game.expired', e => {
        const game = e.data.game;
        const games = this.state.games;
        this.setState({games: games.filter(g => g.id != game.id)});
      });

      this.socket.on('game.winner', e => {
        const {game, userId} = e.data;
        if (userId == this.state.user.id) {
          const {joinedGames} = this.state;
          joinedGames.push(game);
          this.setState({joinedGames: [...joinedGames]});
        }
      });

      this.socket.on('game.finalized', e => {
        const { game } = e.data;
        const d = {
          "id": game.id,
          "game_winner": game.winner,
          "game_hash": game.hash,
          "game_winage": game.winage,
          "game_value": game.totalValue,
          "game_type": "coinflip",
          "state": game.state,
          "created_at": new Date().toJSON(),
          "updated_at": null,
          "users": [game.joinee, game.owner]
        };

        this.setState({ liveHistory: d });
      });

      this.socket.on('deposit.sent', e => {
        const {data: {offerId}} = e;
        const url = `https://steamcommunity.com/tradeoffer/${offerId}/`;
        createToast('info', <a target="_blank" href={url}>Please click here to
          accept</a>, `Deposit offer #${offerId}`, {autoClose: 15000, onClick: () => window.open(url)})
      });

      this.socket.on('deposit.error', e => {
        const {data: {error}} = e;
        createToast('error', error, 'Deposit error');
      });

      this.socket.on('deposit.canceled', e => {
        const {data: {offerId}} = e;
        createToast('error', `Deposit offer #${offerId} canceled`);

      });

      this.socket.on('deposit.sent.canceled', e => {
        const {data: {offerId}} = e;
        createToast('error', 'Deposit sent canceled');
      });

      this.socket.on('withdraw.canceled', e => {
        const {data: {offerId}} = e;
        createToast('error', `Withdraw offer #${offerId} canceled`);
      });

      this.socket.on('withdraw.sent.canceled', e => {
        const {data: {offerId}} = e;
        createToast('error', 'Withdraw sent canceled');
      });

      this.socket.on('withdraw.sent', e => {
        const {data: {offerId}} = e;
        const url = `https://steamcommunity.com/tradeoffer/${offerId}/`;
        createToast('info', <a target="_blank" href={url}>Please click here to
          accept</a>, `Withdraw offer #${offerId}`, {autoClose: 15000, onClick: () => window.open(url)})

      });

      this.socket.on('withdraw.error', e => {
        const {data: {error}} = e;
        createToast('error', error, 'Withdraw error');
      });

      this.socket.on('withdraw.accepted', e => {
        const {data: {offerId}} = e;
        createToast('info', `Withdraw #${offerId} accepted`);

      });

      this.socket.on('giveaway.created', e => {
        this.getGiveaway();
      });

      this.socket.on('giveaway.announced', e => {
        window.__chat__.emit('chat/messages/recent');
      });

    } else {
      throw new Error('not logged in');
    }
  }

  getGames() {
    axios.get('coinflip/games').then(
      resp => {
        const {status, response} = resp.data;
        if (status === 'ok') {
          if (response.games) {
            const games = [];
            Object.keys(response.games).forEach(key => {
              games.push(JSON.parse(response.games[key]));
            });
            this.setState({games});
          }
        } else {
          createToast('error', response);
        }
      },
      err => createToast('error', 'Something went wrong.')
    );
  }

  getGiveaway() {
    axios.get('/gaway/active').then(
      resp => {
        const { response, status } = resp.data;
        if(status == 'ok') {
          this.setState({
            giveaway: response
          });
        }
      }
    );
  }

  removeGame(game) {
    const {joinedGames} = this.state;
    const idx = joinedGames.indexOf(game);
    joinedGames.splice(idx, 1);
    this.setState({joinedGames});
  }

  onJoin(game) {
    const {joinedGames} = this.state;
    joinedGames.unshift(game);
    this.setState({joinedGames: [...joinedGames]});
    this.rightPanel.inventoryContainer.refreshInventory();
  }

  isGameInProgress() {
    return this.state.joinedGames.filter(g => g.inprogress);
  }

  loginDialogClose = () => {
    this.setState({
      loginDialogIsOpen: false,
    });
  };

  toggleTradeURL = () => {
    this.setState({
      tradeURLDialogIsOpen: !this.state.tradeURLDialogIsOpen,
    });
  };

  updateClientCount(count) {
    this.setState({
      clientCount: count
    })
  }

  toggleSound() {
    this.setState({soundOn: !this.state.soundOn});
  }

  render() {
    const {
      isLoggedIn,
      loginDialogIsOpen,
      user,
      token,
      giveaway,
      loading
    } = this.state;

    const session = {
      isLoggedIn,
      user,
      token
    };

    if (loading) return <div
      style={{display: 'flex', height: '100vh', margin: 'auto', alignItems: 'center', justifyContent: 'center'}}>
      <MDSpinner/></div>;

    return (
      <Router>
        <div className="App">
          <Helmet
            defaultTitle="csgostakes"
            titleTemplate="%s - csgostakes"
          />
          <LeftPanel {...session} giveaway={giveaway} />
          <RightPanel
            {...session}
            disableRefresh={this.isGameInProgress()}
            ref={el => this.rightPanel = el}/>
          <HeaderBar
            onToggleSound={this.toggleSound}
            toggleTradeURL={this.toggleTradeURL}
            clientCount={this.state.clientCount}
            user={user}
            isLoggedIn={isLoggedIn}
            soundOn={this.state.soundOn}
          />

          <div className="page-container">
            {!isLoggedIn && !loading && (
              <div onClick={() => {
                this.setState({isLoggedIn: true});
              }}>
                <LoginDialog
                  isOpen={loginDialogIsOpen}
                  onRequestClose={this.loginDialogClose}
                />
              </div>
            )}
            <Switch>
              <Route path="/" exact render={(props) =>
                <Coinflip
                  {...props}
                  {...session}
                  games={this.state.games}
                  joinedGames={this.state.joinedGames}
                  liveHistory={this.state.liveHistory}
                  onJoinGame={this.onJoin}
                  onRemoveGame={this.removeGame}
                  soundOn={this.state.soundOn}/>
              }/>
              <Route path="/jackpot" component={Jackpot}/>
              <Route path="/giveaway" component={Giveaway}/>
              <Route path="/my-history" component={MyHistory}/>
              <Route path="/trade-url" component={TradeURLDialog}/>
              <Route path="/deposit" component={DepositDialog}/>
              <Route exact path="/support" component={Support}/>
              <Route exact path="/support/tickets/:id" component={TicketDetails} {...session} />
              <Route component={NoMatch}/>
            </Switch>
          </div>
          <ToastContainer
            position="bottom-right"
            type="success"
            autoClose={5000}
            hideProgressBar={true}
            newestOnTop={false}
            closeOnClick
            pauseOnHover/>
        </div>
      </Router>
    );
  }
}
