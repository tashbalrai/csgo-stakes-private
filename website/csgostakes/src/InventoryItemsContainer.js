import React from 'react';
import PropTypes from 'prop-types';

import GameItem from './GameItem';


export default class InventoryItemsContainer extends React.Component {
	onSelectionChange = (item, isSelected) => {
		this.props.onSelectionChange(item, isSelected);
	};

	render() {
		const { items, selectedItemsIndexes } = this.props;
		return (
			<div className="inventory-items-container custom-scroll">
				{items.length ? (
					items.map(item => (
						<GameItem
							key={item.id}
							data={item}
							selected={selectedItemsIndexes.includes(item.id)}
							onSelectionChange={this.onSelectionChange}
						/>
					))
				) : (
					<div>no items :(</div>
				)}
			</div>
		);
	}
}

InventoryItemsContainer.PropTypes = {
	items: PropTypes.array.isRequired,
	onSelectionChange: PropTypes.func.isRequired,
};
