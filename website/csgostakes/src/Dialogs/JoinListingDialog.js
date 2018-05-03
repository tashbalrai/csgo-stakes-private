import React from 'react';
import Modal from 'react-modal';
import axios from 'axios';
import MDSpinner from 'react-md-spinner';
import { Link } from 'react-router-dom';
import sortBy from 'lodash/sortBy';
import GameItem from '../GameItem';
import { createToast } from '../utils';

const JOIN_RANGE = 0.05;

export default class JoinListingDialog extends React.Component {
	constructor() {
		super();

		this.state = {
      isLoading: false,
      inventory: [],
			selected: {}

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
		const { selected, inventory, isLoading } = this.state;
		const { onClose, onSubmit, game } = this.props;

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

    const totalVal = game.totalValue;
    const minValue = Number((totalVal - totalVal * JOIN_RANGE).toFixed(2));
    const maxValue = Number((totalVal + totalVal * JOIN_RANGE).toFixed(2));

    const isOfferInRange = value >= minValue && value <= maxValue;

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
					<h2>Join Listing</h2>
					<div className="inventory-items custom-scroll" style={{overflow: 'auto', maxHeight: 270, minHeight: 200}}>
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
							<div>Join</div>
						</button>
						<div style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 'bold'}}>
							<div><span style={{color: isOfferInRange ? '#00B762' : '#D6003F'}}>{value.toFixed(2)}</span>&nbsp;<span style={{color: '#544581'}}>{count}/25</span></div>
							<div style={{fontSize: 12, color: '#00B762'}}>Table Amount: {minValue} - {maxValue}</div>
						</div>
						<div style={{display: 'flex'}}>
							<button disabled={!selectedIDs.length || !isOfferInRange} className="button-base" onClick={e => onSubmit(game.id, selectedIDs)}>
								<div style={{color: '#00B762'}}>Join</div>
								<div>Coinflip</div>
							</button>
						</div>
					</div>
				</div>
			</Modal>
		);
	}
}
