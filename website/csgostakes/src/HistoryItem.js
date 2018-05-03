import React from 'react';
import TimeAgo from 'react-timeago';
import cx from 'classnames';
import isArray from 'lodash/isArray';
import { IMG_URL } from './utils';

export default class HistoryItem extends React.Component {
	static propTypes = {
		data: React.PropTypes.object,
		type: React.PropTypes.string
	};

	render() {
		const { data, type } = this.props;

		let items = [];
		try {
			const json = data.items.replace(/\\/g, "");
      items = JSON.parse(json);
      if(!isArray(items)) {
      	items = [items]
			}
		} catch (e) {
			console.log(e);
		}

		const title = type === 'deposits' ? `You attempted deposit ${items.length} item(s) from your inventory` : `You attempted withdraw ${items.length} item(s) from your inventory`;

		return (
			<div className="history-item">
				<div className="history-item-header">
					<div style={{flex: 1}}>
						<div>{title} <strong><TimeAgo date={data.created_at} minPeriod="59" /></strong>. <a target="_blank" href={`https://steamcommunity.com/tradeoffer/${data.offer_id}/`}>Trade link</a></div>
						<div style={{color: '#999'}}>Offer code: {data.offer_id}</div>
					</div>
					<div>
						<div className={cx('label info', {
							success: ['Accepted'].includes(data.offer_response),
							error: !['Accepted'].includes(data.offer_response)
						})}>{data.offer_response}</div>
					</div>
				</div>
				<div className="history-item-body">
					{items.map(i =>
						<img
							style={{width: 70, marginLeft: 10, marginBottom: 10}}
							src={i.image ? (i.image.startsWith('http') ? i.image : `${IMG_URL}${i.image}`) : `${IMG_URL}${i.icon_url}`}
							key={i.id} />)}
				</div>
			</div>
		);
	}
}
