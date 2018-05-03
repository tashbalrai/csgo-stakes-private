import React from 'react';
import Overdrive from 'react-overdrive';
import TimeAgo from 'react-timeago'
import sortBy from 'lodash/sortBy';
import Avatar from './Avatar';
import GameItem from './GameItem';

const JOIN_RANGE = 0.05;

function formatTime(v, unit, suffix, date) {
	if((date - Date.now())/1000 <= 60) {
		return 'less than a minute';
	}
	return v + ' ' +  (v === 1 ? unit : unit+'s');
}

export default class CoinflipListing extends React.Component {
	constructor(){
		super();
		this.state = {
			showDialog: false
		}
	}

	componentWillUnmount() {
    this.setState({showDialog: false});
	}

	render() {
		const { items, owner, game } = this.props;
		let temp = [];
		const sorted = sortBy(items, 'price.safe_price').reverse();
		for (let i = 0; i < sorted.length; i++) {
			temp.push(
				<GameItem key={i} data={sorted[i]} disableSelection />
			);
		}
		const gameItems = (
			<div>
				{temp}
			</div>
		);
		const totalVal = game.totalValue;
		const minValue = (totalVal - totalVal * JOIN_RANGE).toFixed(2);
		const maxValue = (totalVal + totalVal * JOIN_RANGE).toFixed(2);

		return (
			// TODO: this is prototype quality code, fix it when design final:
			<Overdrive id={'live-room-overdrive-' + this.props.gameId}>
				<div className="coinflip-listing">
					<div className="coinflip-listing-header">
						<div style={{float: 'left', padding: '7px 0 0 10px'}}>
							<Avatar src={owner.avatar} size={30} withBorderEffect steamId={owner.steam_id} />
						</div>
						{/*width: 132, */}
						<div style={{
							position: 'relative',
							float: 'left',
							width: 150,
							margin: '11px 0 0 14px',
							borderRight: '1px solid #4f407c',
							lineHeight: 1.2,
							paddingRight: 14}}>
							<div className="coinflip-listing-header-username">{owner.profile_name}</div>
							<div className="coinflip-listing-header-created-date">Expires in <TimeAgo date={game.expiresAt} formatter={formatTime} /></div>
							<i className="fa fa-info-circle" onClick={e => this.props.onShowHash(game)} />
						</div>
						{/*<div style={{float: 'left', margin: '23px 0 0 30px', paddingRight: 30, borderRight: '1px solid #4f407c', lineHeight: 1.2, minHeight: 35}}>
							<div className="coinflip-listing-header-expiry-date" style={{paddingTop: 10}}>
								<IconTimer width="21" height="22" style={{marginRight: 12, marginTop: -4, display: 'inline-block', verticalAlign: 'middle'}} />
								This game expires in <span>15</span> minutes
							</div>
						</div>*/}
						<div style={{float: 'right'}}>
							<div style={{float: 'left', margin: '8px 0 0 14px', paddingRight: 25, borderRight: '1px solid #4f407c', lineHeight: 1.2}}>
								<div className="coinflip-listing-header-required">{minValue} - {maxValue}</div>
								<div className="coinflip-listing-header-required-label">Required to play</div>
							</div>
							<div style={{float: 'left', margin: '6px 0 0 0', paddingLeft: 25, paddingRight: 11, lineHeight: 1.2}}>
								<button disabled={!this.props.canJoin} className="button-base play-button" type="button" onClick={() => this.props.onPlay()}>
									<span>Play</span>
								</button>
							</div>
						</div>
					</div>
					<div className="coinflip-listing-body">
						<div style={{whiteSpace: 'nowrap', overflowY: 'auto'}} className="custom-scroll">
							{gameItems ? gameItems : '(no items)'}
						</div>
					</div>
				</div>
			</Overdrive>
		);
	}
}
