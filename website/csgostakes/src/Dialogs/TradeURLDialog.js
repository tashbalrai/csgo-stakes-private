import React from 'react';
import Modal from 'react-modal';
import axios from 'axios';
import { createToast } from '../utils';

export default class TradeURLDialog extends React.Component {
	constructor() {
		super();

		this.state = {
			url: '',
			saving: false,
			saved: false,
			error: false
		};
		this.onChange = this.onChange.bind(this);
		this.onSave = this.onSave.bind(this);
	}

	componentWillMount() {
		axios.get(`/user/tradeurl`, {
      'content-type': 'application/json'
		}).then(resp => {
			this.setState({ url: resp.data.response.trade_url });
		});
	}

	onChange(e) {
		this.setState({ url: e.target.value });
	}

	onSave() {
    axios.post(`/user/tradeurl/save`, {
      trade_url: this.state.url
    }).then(resp => {
    	const { data: { status, response } } = resp;
    	if(status === 'error') {
    		createToast('error', response);
			} else {
        createToast('success', response);
        this.close();
			}
    }).catch(e => {
      this.setState({ saving: false });
      createToast('error', e.response.data.response);
    });
	}

	close() {
    this.props.history.push('/');
	}

	render() {
		return (
			<Modal
				isOpen={true}
				onRequestClose={() => this.close()}
				contentLabel="Create listing"
				shouldCloseOnOverlayClick={true}
				className="dialog-base url-dialog"
				overlayClassName="dialog-base-overlay"
			>
				<div>
					<span className="close" onClick={() => this.close()}>&times;</span>
					<h2>My Trade Url</h2>
					<p>Your steam trade link, required to receive your winnings. It can be found <a href="https://steamcommunity.com/id/me/tradeoffers/privacy#trade_offer_access_url" target="_blank">here</a></p>
					<input value={this.state.url} onChange={this.onChange} className="input lg" style={{width: '100%'}} />
					<button disabled={this.state.saving} className="button-base btn-lg" onClick={this.onSave}>
						<div>Save</div>
					</button>
				</div>
			</Modal>
		);
	}
}
