import React from 'react';
import PropTypes from 'prop-types';
import Ink from 'react-ink';
import get from 'lodash/get';
import { IMG_URL } from './utils';

function getImageUrl(item) {
	const url = item.image || item.icon_url;
	if(url.startsWith('http')) {
		return url;
	}
	return `${IMG_URL}${url}`;
}

export default class GameItem extends React.Component {
	constructor() {
		super();
	}
	
	toggleSelected = (e) => {
		e.preventDefault();
		const isSelected = !this.props.selected;
    if(this.props.disableSelection && isSelected) return;

		this.props.onSelectionChange(this.props.data, isSelected);
	};
	
	render() {
		const { data, selected } = this.props;
		const img = getImageUrl(data);
		const price = get(data, 'price.safe_price', null)
		const style = {};
		if(data.rarity_color) {
			style['borderBottomColor'] = '#'+data.rarity_color;
		} else {
      style['borderBottomColor'] = 'transparent';
		}
		return (
			<div className={'game-item' + (selected ? ' selected' : '')} style={style} onClick={this.toggleSelected} title={`${data.market_hash_name}/${price}`}>
				<Ink />
				<img src={img} height="auto" alt="" style={{verticalAlign: 'top', marginTop: 9, display: 'inline-block'}} />
				<div style={{lineHeight: 1.3, marginTop: -1}}>
					{data.name || data.market_hash_name}
				</div>
				<span className="game-item-name">
					{price}
				</span>
			</div>
		);
	}
}

GameItem.PropTypes = {
	data: PropTypes.object.isRequired,
	onSelectionChange: PropTypes.func.isRequired,
};
