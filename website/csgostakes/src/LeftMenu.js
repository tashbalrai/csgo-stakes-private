import React from 'react';
import { NavLink } from 'react-router-dom';
import get from 'lodash/get';
import Countdown from 'react-cntdwn';
import IconCoins from './icons/IconCoins';
import IconTreasureChest from './icons/IconTreasureChest';
import IconGift from './icons/IconGift';


function hasExpired(date) {
	const now = Date.now();
	const exp = new Date(date).getTime();
	return now > exp;
}


export default class LeftMenu extends React.Component {
	constructor() {
		super();
		this.state = {
			isActive: true
		};

		this.onTimeup = this.onTimeup.bind(this);
	}

	componentWillReceiveProps(nextProps){
		const newexp = get(nextProps.giveaway, 'expires_at');
		const currentExp = get(this.props.giveaway, 'expires_at');
		if(newexp && currentExp != newexp) {
      this.setState({
        isActive: true
      });
		}
	}

	setUpTimer() {
		clearInterval(this.timer)
	}

  onTimeup() {
		this.setState({
      isActive: false
		});
	}

	render() {
		return (
			<div>
				<ul className="left-menu">
					<li>
						<NavLink to="/" exact>
							Coinflip
							<IconCoins />
						</NavLink>
					</li>
					{/*<li>*/}
						{/*<a style={{cursor: 'not-allowed'}}>*/}
							{/*Jackpot <span style={{color: '#dc3c73', textTransform: 'initial', fontSize: 14, fontWeight: 500}}>Coming soon!</span>*/}
							{/*<IconTreasureChest />*/}
						{/*</a>*/}
					{/*</li>*/}
          {/*<li>*/}
          {/*<NavLink to="/giveaway">*/}
          {/*Giveaway*/}
          {/*<IconGift />*/}
          {/*</NavLink>*/}
          {/*</li>*/}
				</ul>
				<div className="giveaway">
          { this.props.giveaway && this.state.isActive ?
						<div className="giveaway-timer">
							<div className="giveaway__title">Chat Giveaway:</div>
							<Countdown targetDate={new Date(this.props.giveaway.expires_at)}
												 timeSeparator={':'}
												 format={{  hour: 'hh',
                           minute: 'mm',
                           second: 'ss'}}
												 leadingZero
												 onFinished={this.onTimeup} />
						</div> : <div className="giveaway-waiting">Giveaway winner will be announced soon</div>
          }
          <div style={{fontSize: 10, fontStyle: 'italics', textAlign: 'center', color: '#999'}}>You need to have csgostakes.com in your Steam name to win.</div>
				</div>
			</div>
		);
	}
}
