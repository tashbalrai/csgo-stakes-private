import React from 'react';
import sumBy from 'lodash/sumBy';
import sortBy from 'lodash/sortBy';
import MDSpinner from 'react-md-spinner';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { createToast } from './utils';

import InventoryItemsContainer from './InventoryItemsContainer';

import {
	INVENTORY_ITEMS_LIMIT,
	formatItemValue,
} from './utils';
import IconInventory from './icons/IconInventory';
import IconRefresh from './icons/IconRefresh';

import gun from './images/gun.png';


export default class InventoryContainer extends React.Component {
	constructor() {
		super();
		this.state = {
			isLoading: true,
			items: [],
			selectedItemsIndexes: [],
		};
	}

	componentDidMount() {
		if(window.STAKESAPP.token && window.STAKESAPP.sid){
      this.fetchItemsData();
		}
	}
	
	fetchItemsData() {
		this.setState({
			isLoading: true,
			items: [],
			selectedItemsIndexes: [],
		});

		axios.get(`/user/inventory/onsite`).then(resp => {
			const { data: {response, status } } = resp;
			if(status !== 'ok') {
				this.setState({ isLoading: false });
        createToast('error', response);
			} else {
				this.setState({ items: sortBy(response, 'price.safe_price').reverse(), isLoading: false });
			}
		}, error => {
      this.setState({ isLoading: false });
      createToast('error', error.response.data.response);
		})
	}

	refreshInventory = () => {
		this.fetchItemsData();
	};

	onSelectionChange = (item, isSelected) => {
		const { selectedItemsIndexes } = this.state;
		let newSelectedItemsIndexes = [...selectedItemsIndexes];
		if (isSelected) {
			newSelectedItemsIndexes.push(+item.id);
		} else {
			const index = newSelectedItemsIndexes.indexOf(+item.id);
			newSelectedItemsIndexes.splice(index, 1);
		}
		this.setState({
			selectedItemsIndexes: newSelectedItemsIndexes,
		});
	};

	onWithdraw() {
		const { selectedItemsIndexes, items } = this.state;
		if(!selectedItemsIndexes.length) return createToast('error', 'Please select items from your inventory to withdraw');

		this.setState({ withdrawing: true });

		axios.post('/user/inventory/withdraw', {
			items: selectedItemsIndexes
		}).then(
			resp => {
        const { data: {response, status } } = resp;
        if(status === 'ok') {
          this.setState({ withdrawing: false });
          createToast('info', 'Withdrawal request received');
          this.fetchItemsData();
        } else {
          this.setState({ withdrawing: false });
          createToast('error', response.error || response);
        }
			},
			error => {
        this.setState({ withdrawing: false });
        createToast('error', error.response.data.response);
			}
		)

	}

	getItemStats() {
		const { items } = this.state;
		const total = items.reduce((memo, i) => {
			memo = memo + Number(i.price.safe_price);
			return memo;
		}, 0);
		return (
			<span>
				<span className="inventory-stats-count">
					<span>{items.length}</span>/{INVENTORY_ITEMS_LIMIT} items:
				</span>{' '}
				<span className="inventory-stats-value">
					{formatItemValue(total)}
				</span>
			</span>
		);
	}

	getSelectedItemStats() {
		const { items, selectedItemsIndexes } = this.state;
		const selectedItemsValue = items.reduce((sum, item) => {
			if (selectedItemsIndexes.indexOf(item.id) !== -1) {
				return sum + Number(item.price.safe_price);
			}
			return sum;
		}, 0);
		return (
			<span>
				<span className="inventory-stats-selected-count">
					<span>{selectedItemsIndexes.length}</span> item{selectedItemsIndexes.length === 1 ? '' : 's'} selected:
				</span>{' '}
				<span className="inventory-stats-selected-value">
					{formatItemValue(selectedItemsValue)}
				</span>
			</span>
		);
	}

	render() {
		const { items, selectedItemsIndexes, isLoading } = this.state;
		return (
			<div className="inventory-container">
				<div className="inventory-title">
					<IconInventory width={21} height={21} style={{display: 'inline-block', verticalAlign: 'top', marginRight: 10}} />
					My Inventory
				</div>
				{isLoading ? (
					<div style={{position: 'absolute', top: '50%', left: '50%', transform: 'translateX(-50%) translateY(-50%)'}}>
						<MDSpinner
							singleColor="#6963C0"
							size={60}
						/>
					</div>
				) : (
					<div>
						<div className="inventory-stats">
							{this.getItemStats()}
							<span
								className="inventory-refresh"
								onClick={this.refreshInventory}
							>
								<IconRefresh fill="#7c76d2" width={30} height={30} style={{display: 'inline-block', verticalAlign: 'top'}} />
							</span>
						</div>
						<InventoryItemsContainer
							items={items}
							selectedItemsIndexes={selectedItemsIndexes}
							onSelectionChange={this.onSelectionChange}
						/>
						<div className="inventory-stats-selected">
							{this.getSelectedItemStats()}
						</div>
						<div className="inventory-action-buttons">
							<Link to="/deposit">
								<button className="button-base inventory-button-add" type="button">
									<span>Deposit <span>Skins</span></span>
								</button>
							</Link>
							<button
								disabled={this.state.withdrawing}
								className="button-base inventory-button-remove"
								type="button"
								onClick={() => this.onWithdraw()}>
								<span>Withdraw <span>Skins</span></span>
							</button>
						</div>
					</div>
				)}
			</div>
		);
	}
}
