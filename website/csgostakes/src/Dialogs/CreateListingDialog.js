import React from 'react';
import Modal from 'react-modal';
import axios from 'axios';
import MDSpinner from 'react-md-spinner';
import sortBy from 'lodash/sortBy';
import { Link } from 'react-router-dom';
import { createToast } from '../utils';
import GameItem from '../GameItem';


export default class CreateListingDialog extends React.Component {
	constructor() {
		super();

		this.state = {
			inventory: [],
			duration: '15',
			selected: {},
      isLoading: false

		};
		this.onDurationSelect = this.onDurationSelect.bind(this);
		this.onSelectionChange = this.onSelectionChange.bind(this);
	}

  componentDidMount() {
    this.fetchItemsData();
  }

  fetchItemsData() {
    this.setState({
      isLoading: true,
      inventory: []
    });

    axios.get(`/user/inventory/onsite`).then(resp => {
      const { data: {response, status } } = resp;
      if(status !== 'ok') {
        this.setState({ isLoading: false });
        createToast('error', response);
      } else {
        this.setState({ inventory: sortBy(response, 'price.safe_price').reverse(), isLoading: false });
      }
    }, error => {
      createToast('error', error.response.data.response);
    })
  }

  onDurationSelect(e) {
		const { value } = e.target;
		this.setState({ duration: value });
	}

  onSelectionChange(item, isSelected) {
		const selected = this.state.selected;
		if (isSelected) {
			selected[item.id] = item;
		} else {
			delete selected[item.id];
		}
		this.setState({ selected });
	}

	render() {
		const { duration, selected, inventory, isLoading } = this.state;
		const { onClose, onSubmit } = this.props;

		const items = inventory.map(i => <GameItem key={i.id}
																							 selected={selected[i.id]}
																							 data={i}
																							 onSelectionChange={this.onSelectionChange}/>);
		const selectedIDs = Object.keys(selected);
		const count = selectedIDs.length;
		const value = selectedIDs.reduce((memo, id) => {
			const item = selected[id];
			memo = memo + Number(item.price.safe_price);
			return memo;
		}, 0);

		return (
			<Modal
				isOpen={true}
				onRequestClose={onClose}
				contentLabel="Create listing"
				shouldCloseOnOverlayClick={true}
				className="dialog-base create-dialog"
				overlayClassName="dialog-base-overlay"
			>
				<div>
					<h2>Create Listing</h2>

					<div className="inventory-items custom-scroll" style={{overflow: 'auto', height: 270, minWidth: 500}}>
						{ isLoading ? (
							<div style={{position: 'absolute', top: '50%', left: '50%', transform: 'translateX(-50%) translateY(-50%)'}}>
								<MDSpinner
									singleColor="#6963C0"
									size={60}
								/>
							</div>
						) : (
							items.length ? items : <div>No items. <Link to="/deposit">Deposit items</Link></div>
						) }
					</div>
					<div className="create-listing-footer">
						<button className="button-base" onClick={onClose}>
							<div style={{color: '#009cde'}}>Cancel</div>
							<div>Coinflip</div>
						</button>
						<div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 'bold'}}>
							<span style={{color: '#D6003F'}}>{value.toFixed(2)}</span>&nbsp;<span style={{color: '#544581'}}>{count}/25</span>
						</div>
						<div style={{display: 'flex'}}>
							<div style={{marginRight: 20}}>
								<div>Listing time</div>
								<select value={duration} onChange={this.onDurationSelect}>
									<option value="5">5 minutes</option>
									<option value="10">10 minutes</option>
									<option value="15">15 minutes</option>
									<option value="30">30 minutes</option>
									<option value="60">1 hour</option>
									<option value="120">2 hours</option>
								</select>
							</div>
							<button disabled={!items.length || !selectedIDs.length} className="button-base" onClick={e => onSubmit(selectedIDs, duration)}>
								<div style={{color: '#00B762'}}>Create</div>
								<div>Coinflip</div>
							</button>
						</div>
					</div>
				</div>
			</Modal>
		);
	}
}
