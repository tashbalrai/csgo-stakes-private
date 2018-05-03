import React from 'react';

import InventoryContainer from './InventoryContainer';


export default class RightPanel extends React.Component {
  refreshInventory() {
  	this.inventoryContainer.fetchItemsData();
	}

	render() {
		return (
			<div className="right-panel">
				<InventoryContainer ref={el => this.inventoryContainer = el} />
			</div>
		);
	}
}
