import React from 'react';
import Helmet from 'react-helmet';
import axios from 'axios';
import cx from 'classnames';
import Avatar from './Avatar';
import { Link } from 'react-router-dom';
import { createToast } from './utils';

import tmpAvatar from './images/avatar.jpg';

const STATUS = {
  '1': 'OPEN',
  '0': 'CLOSED',
  '2': 'AWAITING REPLY',
  '3': 'IN PROCESS'
};

export default class TicketDetails extends React.Component {
  constructor() {
    super();
    this.state = {};

    this.onFileSelect = this.onFileSelect.bind(this);
    this.submit = this.submit.bind(this);
    this.onClose = this.onClose.bind(this);
  }

  componentWillMount() {
    this.fetchDetails();
  }

  fetchDetails() {
    axios.get(`/tickets/${this.props.match.params.id}`).then(resp => {
      const { response, status } = resp.data;
      if(status == 'ok') {
        this.setState({
          ticket: response
        });
      }
    });
  }

  onFileSelect(e) {
    this.setState({file: e.target.files[0]});
  }

  submit() {
    const { message, file } = this.state;
    const formData = new FormData();
    formData.append('message', message);
    formData.append('attachment', file);

    axios.put(`/tickets/${this.props.match.params.id}`, formData).then((resp) => {
      const { response, status } = resp.data;
      if(status ==='ok') {
        createToast('info', 'Your ticket has been submitted.');
        this.fetchDetails();

        this.setState({ message: '', file: null });
      }
    });
  }

  onClose(e) {
    e.preventDefault();
    axios.delete(`/tickets/${this.props.match.params.id}`).then(
      () => {
        this.fetchDetails();
      }
    )
  }

  render() {
    const { ticket } = this.state;
    if(!ticket) return null;

    return (
      <div className="ticket-details-container">
        <Helmet><title>Support</title></Helmet>
        <div className="ticket-details-id">#ID: {ticket.id}</div>
        <div className="ticket-details-title">
          <span className="ticket-details-subject">{ticket.subject}</span>
          <span className="ticket-details-date">Date: {new Date(ticket.created_at).toLocaleDateString()}</span>
          </div>
        <div style={{padding: '10px 20px'}}>
          <p className="ticket-details-desc">
            {ticket.message}
          </p>
          { ticket.attachment &&
          <p className="ticket-details-attachment">
            <span>Attached File: <a href={`/tickets/files/${ticket.attachment}`} target="_blank">Open attachment</a></span>
          </p>
          }
        </div>
        <hr/>
        <div>
          {ticket.replies.map(r => (
            <div key={r.id} className={cx("ticket-details-reply", { me: ticket.user_id == r.user_id})}>
              <div style={{display: 'flex', alignItems: 'center'}}>
                <Avatar size={48} src={r.avatar ? r.avatar : tmpAvatar }/>
                <div>
                  <div style={{fontWeight: 500, fontSize: 16}}>{r.profile_name || 'John'}</div>
                  <div style={{fontSize: 10, opacity: .8}}>{ticket.user_id == r.user_id ? 'You' : 'Customer Support'}</div>
                </div>
              </div>
              <div style={{textAlign: 'right', opacity: .8, fontSize: 13}}>{new Date(r.created_at).toLocaleDateString()}</div>
              <p>{r.message}</p>
              { r.attachment &&
                <p className="ticket-details-attachment">
                  <span>Attached File: <a href={`/tickets/files/${r.attachment}`} target="_blank">Open attachment</a></span>
                </p>
              }
            </div>
          ))}
        </div>
        {ticket.status != 0 ? (
          <div style={{padding: '10px 20px'}}>
            <div style={{display: 'flex'}}>
              <h3 style={{flex: 1}}>Update ticket</h3>
              <a href="#" onClick={this.onClose}>Close ticket</a>
            </div>
            <textarea
              rows="5"
              placeholder="Type your message"
              className="form-control"
              value={this.state.message}
              onChange={e => this.setState({ message: e.target.value })}/>
            <div style={{display: 'flex'}}>
              <div className="file-input">
                <input type="file" onChange={this.onFileSelect} />
                <div>{this.state.file ? 'File selected' : 'UPLOAD SCREENSHOT'}</div>
              </div>
              <div style={{flex: 1, textAlign: 'right'}}>
                <button style={{padding: 15, backgroundColor: '#009cde'}} className="button-base lg" onClick={this.submit}>Submit</button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    )
  }
}