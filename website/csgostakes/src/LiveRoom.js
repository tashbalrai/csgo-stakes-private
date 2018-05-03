import React from 'react';
import Overdrive from 'react-overdrive';
import cx from 'classnames';
import concat from 'lodash/concat';
import sortBy from 'lodash/sortBy';
import Avatar from './Avatar';
import GameItem from './GameItem';

import './CoinFlip.css';

const ownerSpin = ['animation1800', 'animation2160'];
const joineeSpin = ['animation1980', 'animation1980',];

function getSpin(isOwner) {
	const arr = isOwner ? ownerSpin : joineeSpin;
  return arr[Math.floor(Math.random()*arr.length)];
}

export default class LiveRoom extends React.Component {
	constructor() {
		super();
		this.state = {
			countDown: 5,
      winnerSelected: false,
			animation: null
		};

		this.animationEndListener = this.animationEndListener.bind(this);
	}

	componentWillMount() {
    const { owner, joinee, winner } = this.props.game;
    const isOwnerIsWinner = winner == owner.id;

    this.setState({
      winner: isOwnerIsWinner ? owner : joinee,
			animation: getSpin(isOwnerIsWinner)
    });
	}

	componentDidMount() {

		this.interval = setInterval(() => {
			const { soundOn } = this.props;

			if(this.state.countDown <= 0) {
				clearInterval(this.interval);
				this.flipper.addEventListener("animationend", this.animationEndListener);
      }	else {
				if(this.state.countDown === 1) {
          this.countdown.pause();
          this.countdown.currentTime = 0;
          soundOn && this.coinDrop.play();
				} else if(this.state.countDown === 5) {
          soundOn && this.countdown.play();
        }
				this.setState({ countDown: this.state.countDown - 1 });
			}
		}, 1000);
	}


	componentWillUnmount() {
		clearInterval(this.interval);
		this.flipper.removeEventListener('animationend', this.animationEndListener);
	}

	animationEndListener() {
    this.props.game.completed = true;
    this.setState({ winnerSelected: true });
	}

	renderFlip() {
		const { owner, joinee } = this.props.game;

		return (
			<div className="coin-flip-cont">
				<div className={cx('coin', this.state.animation)} ref={el => this.flipper = el}>
					<div className="front">
						{this.renderPlayer(owner.avatar)}
					</div>
					<div className="back">
            {this.renderPlayer(joinee.avatar)}
					</div>
				</div>
			</div>
		)
	}

	renderPlayer(avatar) {
    return (
			<div>
				<Avatar src={avatar} size={125} className={cx({"winner": this.state.winnerSelected})} />
				{this.state.winnerSelected ?
					<div style={{fontSize: 16, marginTop: 15, fontWeight: 500, letterSpacing: '0.03em', color: '#bba6ff', textTransform: 'uppercase'}}>Winner</div>
					: null
				}
			</div>
    )
	}

	renderCountdown() {
		return (
			<div style={{ textAlign: 'center' }}>
				<div style={{fontSize: 20, fontWeight: 500}}>Starting in</div>
				<div style={{ fontSize: 90, marginTop: 0, fontWeight: 500, color: '#0ced7b', textAlign: 'center' }}>
          {this.state.countDown}
				</div>
			</div>
		)
	}

	getWinnage(paid, stake) {
		return ((paid * 100) / stake).toFixed(2);
	}
	
	render() {
		const { countDown, winnerSelected } = this.state;
		const { game: { owner, joinee, totalValue, id, winner, winage }, onShowHash } = this.props;

		let overdriveName = 'live-room-overdrive-' + id;
		const items = concat(owner.items, joinee.items);

		let gameItems = sortBy(items, 'price.safe_price').reverse().map(i => <GameItem disableSelection key={i.id} data={i} />);


		const count = gameItems.length;
    //
		// if(count > 6) {
		// 	gameItems.splice(5);
		// 	gameItems.push(
		// 		<div key="placeholder" className="more-items">
		// 			+{count - gameItems.length} more
		// 		</div>
		// 	)
		// }

		const ownerPC = this.getWinnage(owner.totalValue, totalValue);
		const joineePC = this.getWinnage(joinee.totalValue, totalValue);

		return (
			<div className="inner-container">
				<Overdrive id={overdriveName}>
					<div className={cx("live-room", { completed: winnerSelected })}>
						<div className="live-room-inner">
							<div className="live-room-left">
								<div className="live-room-players">
									<div style={{display: 'flex', alignItems: 'center'}}>
										<div className="sonar-emitter red">
											<div className="sonar-wave red"></div>
										</div>
										<h2 style={{margin: '0 0 0 10px', padding: 0, flex: 1, marginLeft: 31, fontSize: 13, lineHeight: '26px'}}>
											Live Room
										</h2>
										<div className="game-winage">
											<span>{winage}%</span>
											<i className="fa fa-info-circle" onClick={e => onShowHash(this.props.game)} />
										</div>
									</div>
									<div style={{width: 300, margin: '15px auto 0 auto', overflow: 'hidden', position: 'relative'}}>
										<div style={{float: 'left', padding: '11px 0 0 11px', textAlign: 'center', width: 100}}  className={cx({looser: winnerSelected && winner != joinee.id})}>
											<Avatar src={joinee.avatar} size={70} />
											<div className="player_name">{joinee.profile_name}</div>
											<div style={{fontSize: 14, color: '#0ced7b', fontWeight: 500}}>
												{joinee.totalValue.toFixed(2)} <span style={{color: '#009cff'}}>({joineePC}%)</span>
											</div>
										</div>
										<div style={{float: 'right', padding: '11px 0 0 11px', textAlign: 'center', width: 100}} className={cx({looser: winnerSelected && winner != owner.id})} >
											<Avatar src={owner.avatar} size={70} />
											<div className="player_name">{owner.profile_name}</div>
											<div style={{fontSize: 14, color: '#0ced7b', fontWeight: 500}}>
												{owner.totalValue.toFixed(2)} <span style={{color: '#009cff'}}>({ownerPC}%)</span>
											</div>
										</div>
										<div style={{position: 'absolute', top: 30, left: 136, fontSize: 20, padding: 20, border: '2px solid #6048b2', borderRadius: '50%', padding: 13, boxSizing: 'border-box', lineHeight: '1'}}>
											vs
										</div>
									</div>
								</div>
								<div className="live-room-items">
									<div style={{whiteSpace: 'nowrap', overflowY: 'auto'}} className="custom-scroll">
										{gameItems ? gameItems : '(no items)'}
									</div>
								</div>
							</div>
							<div className="live-room-right" style={{position: 'relative'}}>
								<div className="live-room-game-info">
									<div className="close" onClick={this.props.onRemove}>&times;</div>
									{countDown ? this.renderCountdown() : this.renderFlip()}
								</div>
								<div style={{position: 'absolute', bottom: 25, left: 25, right: 25}}>
									<div style={{lineHeight: '50px', background: 'rgba(0, 0, 0, .3)', textAlign: 'center', color: '#0ced7b', fontSize: 28, fontWeight: 500}}>
										{totalValue.toFixed(2)}
									</div>
								</div>
							</div>
						</div>

					</div>
				</Overdrive>
				<audio preload src="/sound/countdown.mp3" ref={el => this.countdown = el} />
				<audio preload src="/sound/coin_drop.mp3" ref={el => this.coinDrop = el} />
			</div>
		);
	}
}
