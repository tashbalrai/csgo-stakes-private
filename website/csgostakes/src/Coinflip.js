import React from 'react';
import Helmet from 'react-helmet';
import axios from 'axios';
import cx from 'classnames';
import sortBy from 'lodash/sortBy';
import FlipMove from 'react-flip-move';
import LiveRoom from './LiveRoom';
import IconPlus from './icons/IconPlus';
import CoinflipListing from './CoinflipListing';
import CreateListingDialog from './Dialogs/CreateListingDialog';
import JoinListingDialog from './Dialogs/JoinListingDialog';
import HashDialog from './Dialogs/HashDialog';
import { createToast } from './utils';
import CoinflipHistory from './CoinflipHistory';

export default class Coinflip extends React.Component {

	static contextTypes = {
    refreshInventory: React.PropTypes.func
	};

	constructor() {
		super();
		this.state = {
			showCreate: false,
			showJoin: false,
      selectedGame: null,
			tab: 1
		};

		this.toggleCreate = this.toggleCreate.bind(this);
		this.createListing = this.createListing.bind(this);
		this.joinListing = this.joinListing.bind(this);
		this.toggleJoin = this.toggleJoin.bind(this);
	}

	toggleCreate() {
		this.setState({ showCreate: !this.state.showCreate });
	}

  toggleJoin(game) {
    this.setState({ showJoin: !this.state.showJoin, selectedGame: game });
	}

  createListing(items, duration) {
    this.toggleCreate();
		return axios.post('/coinflip/create', {
			items,
      expiry_minutes: duration
		}).then(resp => {
      const { data: {response, status } } = resp;
      if(status === 'ok') {
        createToast('success', 'Your coinflip listing was created. Good Luck!');
        this.context.refreshInventory();
			} else {
        createToast('error', response);
			}
		});
	}

  joinListing(gameId, itemIds) {
		axios.post('/coinflip/join', {
			items: itemIds,
      game_id: gameId
		}).then(
			resp => {
        const { data: {response, status } } = resp;
        if (status === 'ok') {
					this.toggleJoin();
					this.props.onJoinGame(response.game);
				} else {
          createToast('error', response);
				}
			},
			err => {
				const { response } = err.response.data;
        createToast('error', response);
			}
		);
	}

	render() {
		return (
			<div className="inner-container">
				<Helmet><title>Coinflip</title></Helmet>
				<FlipMove
					duration={200}
					appearAnimation="elevator"
					leaveAnimation="elevator"
				>
          {this.props.joinedGames.map(game =>
						<LiveRoom
							key={game.id}
							soundOn={this.props.soundOn}
							game={game} onRemove={() => this.props.onRemoveGame(game)}
							onShowHash={(game) => this.setState({showHashDialog: game})}
						/>
          )}
				</FlipMove>
				<div className="coinflip-header" style={{position: 'relative', /*overflow: 'hidden',*/ maxWidth: 700, margin: '0 auto', marginBottom: 18, minWidth: 555}}>
					<button className="button-base" type="button" style={{width: '100%', height: 40, background: '#0365b1', border: 'none'}} onClick={this.toggleCreate}>
						<span>
							<IconPlus fill="#fff" />
							<span style={{display: 'inline-block', verticalAlign: 'middle', marginLeft: 4}}>
								Create Listing
							</span>
						</span>
					</button>
					<div>
						<ul className="tabs">
							<li className={cx("tab", { active: this.state.tab == 1})} onClick={() => this.setState({ tab: 1 })}>LISTINGS ({this.props.games.length})</li>
							<li className={cx("tab", { active: this.state.tab == 2})} onClick={() => this.setState({ tab: 2 })}>HISTORY</li>
						</ul>
					</div>
				</div>
				{ this.state.tab === 1 ? (
					<div>
						<FlipMove
							duration={200}
							appearAnimation="elevator"
							leaveAnimation="elevator"
						>
              {sortBy(this.props.games, 'totalValue').reverse().map(game =>
								<CoinflipListing
									locked
									canJoin={game.owner.id !== this.props.user.id}
									key={game.id}
									game={game}
									items={game.owner.items}
									owner={game.owner}
									gameId={game.id}
									onPlay={() => { this.toggleJoin(game); }}
									onShowHash={(game) => this.setState({showHashDialog: game})}
								/>
              )}
						</FlipMove>
					</div>
				) : <CoinflipHistory liveHistory={this.props.liveHistory} /> }
				{ this.state.showCreate && <CreateListingDialog onClose={this.toggleCreate} onSubmit={this.createListing} /> }
				{ this.state.showJoin && <JoinListingDialog game={this.state.selectedGame} onClose={() => this.toggleJoin()} onSubmit={this.joinListing} /> }
        { this.state.showHashDialog &&
					<HashDialog
						id={this.state.showHashDialog.id}
						hash={this.state.showHashDialog.hash}
						secret={this.state.showHashDialog.secret}
						winage={this.state.showHashDialog.winage}
						completed={this.state.showHashDialog.completed}
						onClose={e => this.setState({showHashDialog: false})} />}
			</div>
		);
	}
}
