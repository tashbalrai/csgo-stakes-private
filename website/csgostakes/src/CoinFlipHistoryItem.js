import React from 'react';
import TimeAgo from 'react-timeago';
import cx from 'classnames';
import isArray from 'lodash/isArray';
import { IMG_URL } from './utils';

export default class CoinFlipHistoryItem extends React.Component {
	static propTypes = {
		data: React.PropTypes.object,
		type: React.PropTypes.string
	};

	render() {
		const { data, onShowHash } = this.props;

		let items = data.items;

		const title =  data.expired ? 'Your coinflip has expired' : `You ${data.isWinner ? 'won' : 'lost'} coinflip with a value of ${data.game_value}`;

		return (
			<div className="history-item">
				<div className="history-item-header">
					<div style={{flex: 1}}>
						<div>{title} <strong><TimeAgo date={data.created_at} minPeriod="59" /></strong></div>
					</div>
					<div style={{display: 'flex', alignItems: 'center'}}>
						<div style={{marginRight: 5}}>
							<span style={{color: '#999', marginRight: 5}}>Coinflip ID: {data.id}</span>
							<i className="fa fa-info-circle" onClick={e => onShowHash(data)} />
						</div>
						<div className={cx('label', {
							success: data.isWinner,
							error: !data.isWinner && !data.expired,
              info: data.expired
						})}>{data.expired ? 'Expired' : (data.isWinner ? 'Won' : 'Lost')}</div>
					</div>
				</div>
				<div className="history-item-body">
					{items.map((i,idx) =>
						<img
							style={{width: 70, marginLeft: 10, marginBottom: 10}}
							src={i.image.startsWith('http') ? i.image : `${IMG_URL}${i.image}`}
							key={idx} />)}
				</div>
			</div>
		);
	}
}
