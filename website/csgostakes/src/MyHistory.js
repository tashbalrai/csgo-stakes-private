import React from 'react';
import Helmet from 'react-helmet';
import cx from 'classnames';
import { toast } from 'react-toastify';
import axios from 'axios';
import MDSpinner from 'react-md-spinner';
import Waypoint from 'react-waypoint';

import { createToast } from './utils';
import HistoryItem from './HistoryItem';
import CoinFlipHistoryItem from './CoinFlipHistoryItem';
import HashDialog from './Dialogs/HashDialog';

const FILTERS = [
	{label: 'Deposits', value: 'deposits'},
	{label: 'Withdrawals', value: 'withdrawals'},
	{label: 'Coinflips', value: 'coinflips'}
];

export default class MyHistory extends React.Component {
	constructor() {
		super();
		this.state = {
			selectedFilter: 'deposits',
			loading: false,
			items: [],
			page: 0,
			hasMore: true
		};
		this.handleError = this.handleError.bind(this);
		this.handleResponse = this.handleResponse.bind(this);
		this.loadMore = this.loadMore.bind(this);
  }

  componentDidMount(){
    if(window.STAKESAPP.token && window.STAKESAPP.sid){
      this.setFilter('deposits');
    }
	}

	fetchDepositHistory(page) {
    axios.get('/user/history/deposit', { params: {page} }).then(this.handleResponse, this.handleError);
	}

	fetchWithdrawHistory(page) {
    axios.get('/user/history/withdraw',  { params: {page} }).then(this.handleResponse, this.handleError)
	}

  fetchFlipHistory(page) {
    axios.get('/user/history/coinflips',  { params: {page} }).then(this.handleResponse, this.handleError);
  }

  loadMore() {
		const { page, selectedFilter } = this.state;
		const nextPage = page + 1;
    this.setState({ loading: true, page: nextPage });
    if(selectedFilter === 'deposits') {
      this.fetchDepositHistory(nextPage);
    } else if(selectedFilter === 'withdrawals') {
      this.fetchWithdrawHistory(nextPage);
    } else if(selectedFilter === 'coinflips') {
      this.fetchFlipHistory(nextPage);
    }
	}

	renderWaypoint() {
  	if(!this.state.loading && this.state.hasMore) {
      return (
				<div>
					<Waypoint
						bottomOffset={-100}
						onEnter={this.loadMore}
					/>
					<MDSpinner
						singleColor="#6963C0"
						size={24}
					/>
				</div>
      );
		}
	}

	handleResponse(resp) {
    this.setState({ loading: false });
    const { data: {response, status } } = resp;
    if(status !== 'ok') {
      createToast('error', response);
    } else {
      this.setState({ items: [...this.state.items, ...response.reverse()], hasMore: !!response.length });
    }
	}

	handleError(error) {
    this.setState({ loading: false, hasMore: false });
    createToast('error', error.response.data.response);
	}

	setFilter(filter) {
		this.setState({
      selectedFilter: filter,
			items: [],
			page: 1,
			loading: true
		});
		if(filter === 'deposits') {
			this.fetchDepositHistory(1);
		} else if(filter === 'withdrawals') {
			this.fetchWithdrawHistory(1);
		} else if(filter === 'coinflips') {
			this.fetchFlipHistory(1);
		}
	}

	render() {
  	const HistoryClass = this.state.selectedFilter == 'coinflips' ? CoinFlipHistoryItem : HistoryItem;
		return (
			<div className="inner-container my-history">
				<Helmet><title>My History</title></Helmet>
				<div>
					<h2 style={{textAlign: 'center'}}>My History!</h2>
				</div>
				<ul className="my-history-nav">
          {FILTERS.map(f => <li className={cx({ active: f.value === this.state.selectedFilter})}
																key={f.value}
																onClick={() => this.setFilter(f.value)}>{f.label}</li>)}
				</ul>
				<div>
          {this.state.items.map(i => <HistoryClass
						key={i.id}
						data={i}
						type={this.state.selectedFilter}
						onShowHash={g  => this.setState({ selected: g })} />)}
					<div style={{margin: 'auto', width: 60}}>
            {this.renderWaypoint()}
					</div>
				</div>
				{this.state.selected && <HashDialog
					id={this.state.selected.id}
					hash={this.state.selected.game_hash}
					secret={this.state.selected.game_secret}
					winage={this.state.selected.game_winage}
					completed={true}
					onClose={e => this.setState({ selected: null })}/>}
			</div>
		);
	}
}
