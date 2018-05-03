import React from 'react';
import Modal from 'react-modal';
import cx from 'classnames';
import { toast } from 'react-toastify';
import MDSpinner from 'react-md-spinner';
import axios from 'axios';
import find from 'lodash/find';
import GameItem from '../GameItem';
import { createToast } from '../utils';

function sort(inventory, sortDirection) {
  return inventory.sort((a, b)=> {
    const aPrice = Number(a.price.safe_price);
    const bPrice = Number(b.price.safe_price);
    return sortDirection === 1 ? aPrice - bPrice : bPrice - aPrice;
  });
}

export default class DepositDialog extends React.Component {
	constructor() {
		super();

		this.state = {
			inventory: [],
			total: 0,
			isLoading: false,
			sortDirection: -1,
			selected: {},
			isRequesting: false,
      disableSelection: false
		};

		this.onSelectionChange = this.onSelectionChange.bind(this);
		this.onRequestTrade = this.onRequestTrade.bind(this);
	}

	componentWillMount() {
		this.setState({ isLoading: true });

    axios.get(`/user/steam/inventory`).then(resp => {
      const { data: {response, status } } = resp;
      if(status !== 'ok') {
        this.setState({ isLoading: false });
        createToast('error', response);
      } else {
      	const total = response.reduce((memo, i) => {
      		i.rarity_color = find(i.tags, { category: 'Rarity' }).color;
      		memo = memo + Number(i.price.safe_price);
      		return memo;
				},0);

        this.setState({ inventory: sort(response, -1), isLoading: false, total });
      }
    }, error => {
      createToast('error', error.response.data.response);
    });
	}

  toggleSort() {
		const { sortDirection, inventory } = this.state;
		const newDir = sortDirection === 1 ? -1 : 1;
		this.setState({ sortDirection: newDir, inventory: sort(inventory, newDir) });
	}

  onSelectionChange(item, isSelected) {
		const selected = this.state.selected;

		if(Object.keys(selected).length >= 25 && isSelected === true) {
			return this.setState({ disableSelection: true })
		}

		if (isSelected) {
			selected[item.id] = item;
		} else {
			delete selected[item.id];
		}
		this.setState({ selected, disableSelection: false });
	}

	onRequestTrade() {
		const { inventory, selected } = this.state;
		const selectedItems = [];
		Object.keys(selected).map(id => {
			selectedItems.push(selected[id]);
		});

		if(!selectedItems.length) return;

		const data = selectedItems.map(i => ({
      appid: i.appid,
      contextid: i.contextid,
      assetid: i.assetid,
      classid: i.classid,
      market_hash_name: i.market_hash_name,
      rarity_color: find(i.tags, { category: 'Rarity'}).color,
      rarity_tag_name: find(i.tags, { category: 'Rarity'}).localized_tag_name,
      icon_url: i.icon_url
		}));

		this.setState({ isRequesting: true });

		axios.post(`/user/inventory/deposit`, {
      inventory: data
		}).then(
			resp => {
        this.setState({ isRequesting: false });

				const { status, response } = resp.data;
				if(status === 'ok') {
          toast.info(
						<div className="toast-container">
							<i className="fa fa-cog fa-spin fa-2x" />
							<div>
								<span>Your trade is being generated <span className="animated-ellipsis" /></span>
							</div>
						</div>
          );
          this.close();
				} else {
					createToast('error', response.error || response || 'Something went wrong');
				}
			},
			error => {
        this.setState({ isRequesting: false });
				createToast('error', error.response.data.response);
			}
		)
	}

  close() {
    this.props.history.push('/');
  }

	render() {
		const { selected, isLoading, isRequesting, inventory, disableSelection } = this.state;
		const { onClose, onSubmit } = this.props;

		const items = inventory.map(i =>
			<GameItem
				disableSelection={disableSelection}
				selected={selected[i.id]}
				key={i.id}
				data={i}
				onSelectionChange={this.onSelectionChange}/>);

		const selectedIDs = Object.keys(selected);
		const value = selectedIDs.reduce((memo, id) => {
			const item = selected[id];
			memo = memo + Number(item.price.safe_price);
			return memo;
		}, 0);

		return (
			<Modal
				isOpen={true}
				onRequestClose={this.close.bind(this)}
				contentLabel="Create listing"
				shouldCloseOnOverlayClick={true}
				className="dialog-base create-dialog deposit-dialog"
				overlayClassName="dialog-base-overlay"
			>
				<div>
					<span className="close" onClick={() => this.close()}>&times;</span>
					<h2 style={{marginTop: 0}}>Add To Inventory</h2>
					<div className="sort-container">
						<a href="#" onClick={() => this.toggleSort()}>Sort by value <span style={{marginLeft: 5}} className={cx({ upparrow: this.state.sortDirection === 1, downarrow: this.state.sortDirection === -1 })}/></a>
					</div>
					<div className="inventory-items custom-scroll" style={{overflow: 'auto', maxHeight: 270, minHeight: 200}}>
            {isLoading ? (
							<div style={{position: 'absolute', top: '50%', left: '50%', transform: 'translateX(-50%) translateY(-50%)'}}>
								<MDSpinner
									singleColor="#6963C0"
									size={60}
								/>
							</div>
            ) : items}
					</div>
					<div className="deposit-dialog-footer">
						<div style={{display: 'flex', alignItems: 'center', fontSize: 18, width: '100%', marginBottom: 40}}>
							<div style={{flex: 2}}>Total value: {this.state.total.toFixed(2)}</div>
							<div style={{flex: 1}}>Selected Value: {value.toFixed(2)}</div>
							<div><span style={{color: '#D6003F'}}>{selectedIDs.length}</span>/<span style={{color: '#544581'}}>25</span></div>
						</div>
						<div style={{display: 'flex'}}>
							<button disabled={isRequesting} className="button-base" onClick={this.onRequestTrade} style={{width: 300}}>
								<div style={{color: '#00B762'}}>Request Trade Offer</div>
							</button>
						</div>
					</div>
				</div>
			</Modal>
		);
	}
}
