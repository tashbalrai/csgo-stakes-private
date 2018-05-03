import React from 'react';
import Helmet from 'react-helmet';
import axios from 'axios';
import cx from 'classnames';
import get from 'lodash/get';
import { Link } from 'react-router-dom';
import { createToast } from './utils';

import CreateDialog from './Dialogs/CreateTicketDialog';

const STATUS = {
	'1': 'OPEN',
	'0': 'CLOSED',
	'2': 'AWAITING REPLY',
	'3': 'IN PROCESS'
};

const FILTERS = {
	'0': [0],
	'1': [3, 1],
	'2': [2]
};

export default class Support extends React.Component {
	constructor() {
		super();
		this.state = {
			tickets: [],
			showCreate: false,
			filter: 1
		};

		this.onCreate = this.onCreate.bind(this);
	}

	componentWillMount() {
		this.fetchTickets();
	}

	fetchTickets() {
		axios.get('tickets').then(
			resp => {
				const { response, status } = resp.data;
				if(status == 'ok') {
					this.setState({
            tickets: response
					});
				}
			}
		)
	}

	filterTickets(tickets, filter) {
		return tickets.filter(t => {
			return filter.includes(t.status);
		});
	}

  onCreate(data) {
    const formData = new FormData();
    Object.keys(data).forEach(key => formData.append(key, data[key]));

    return axios.post('tickets', formData).then((resp) => {
        const { response, status } = resp.data;
        if(status == 'ok') {
          this.setState({
            showCreate: false
          });
          createToast('info', 'Your ticket has been submitted.');
          this.fetchTickets();
				} else {
          createToast('error', response);
				}
			}).catch(err => {
				const { response } = err;
      	createToast('error', get(response, 'data.response', 'Something went wrong'));
		})
	}

	render() {
		return (
			<div className="inner-container" style={{ maxWidth: 700, margin: '0 auto'}}>
				<Helmet><title>Support</title></Helmet>
				<div style={{marginBottom: 20}}>
					<h2 style={{textAlign: 'center'}}>Support</h2>
				</div>
				<div style={{marginBottom: 20}}>
					<div style={{display: 'flex', alignItems: 'flex-end'}}>
						<div style={{flex: 1, fontSize: 16, fontWeight: 500}}>Your Tickets</div>
						<button onClick={() => this.setState({ showCreate: true })} className="button-base lg">Create ticket</button>
					</div>
					<hr style={{margin: '10px 0'}}/>
					<div>
						<p>{this.state.tickets.length == 0 ? 'You have no tickets yet' : null}</p>
						{this.state.tickets.map(ticket =>
							<div key={ticket.id} className="ticket-list-item">
								<div style={{flex: 1}}>
									<Link to={`/support/tickets/${ticket.id}`}>
										<div className="ticket-list-item__sub">#{ticket.id} / {ticket.subject}</div>
									</Link>
									<p>{ticket.message.substr(0, 100)}</p>
									<div className="ticket-list-item__ts">{new Date(ticket.created_at).toLocaleDateString()}</div>
								</div>
								<div className="label info">
									{STATUS[ticket.status]}
								</div>
							</div>
						)}
					</div>
				</div>
				{this.state.showCreate &&
					<CreateDialog
						onSubmit={this.onCreate}
						onClose={e => this.setState({ showCreate: false })}/>}
			</div>
		);
	}
}
