import React from 'react';
import Modal from 'react-modal';
import axios from 'axios';
import MDSpinner from 'react-md-spinner';
import { Link } from 'react-router-dom';
import { createToast } from '../utils';
import GameItem from '../GameItem';


export default class CreateTicketDialog extends React.Component {
	constructor() {
		super();
		this.state = {
			subject: '',
			department: '',
			message: '',
			file: null
		};
		this.onChange = this.onChange.bind(this);
		this.onFileSelect = this.onFileSelect.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
	}

	onChange(e) {
		const { name, value } = e.target;
		this.setState({
			[name]: value
		});
	}

	onFileSelect(e) {
		const { files } = e.target;
		this.setState({
			file: files[0]
		});
	}

	onSubmit() {
    const { subject, message, department, file } = this.state;
    if(subject && message && department) {
    	this.setState({submitting: true});
    	this.props.onSubmit({
    		subject,
				message,
				department,
				attachment: file
			}).then(() => {
        this.setState({submitting: false});
			}).catch(() => this.setState({submitting: false}));
		}
	}

	render() {

		const { onClose } = this.props;
		const { subject, message, department, file } = this.state;

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
					<h2>New Ticket</h2>
					<div>
						<input name="subject" value={subject} onChange={this.onChange} type="text" className="form-control" placeholder="Subject"/>
						<select name="department" className="form-control" value={department} onChange={this.onChange}>
							<option value="" disabled hidden>Select department</option>
							<option value="Support">Support</option>
						</select>
						<textarea name="message" value={message} onChange={this.onChange} className="form-control" placeholder="Message" rows="5"/>
						<div className="file-input">
							<input type="file" onChange={this.onFileSelect} />
							<div>{file ? 'File selected': 'UPLOAD SCREENSHOT'}</div>
						</div>
					</div>
					<div className="create-ticket-footer">
						<button className="button-base" onClick={onClose}>
							<div style={{color: '#009cde'}}>Cancel</div>
						</button>
						<button disabled={this.state.submitting} className="button-base" onClick={this.onSubmit}>
							<div style={{color: '#00B762'}}>Create ticket</div>
						</button>
					</div>
				</div>
			</Modal>
		);
	}
}
