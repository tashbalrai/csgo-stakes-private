import React from 'react';
import Modal from 'react-modal';
import cx from 'classnames';

import TermsDialog from './TermsDialog';
import logo from './../images/logo.svg';


export default class LoginDialog extends React.Component {
	constructor() {
		super();

		this.state = {
			tosAccepted: false,
			termsDialogIsOpen: false,
			animate: false
		};

		this.toggleTOS = this.toggleTOS.bind(this);
		this.onLogin = this.onLogin.bind(this);
	}

	termsDialogOpen = () => {
		this.setState({
			termsDialogIsOpen: true,
		});
	}

	termsDialogClose = () => {
		this.setState({
			termsDialogIsOpen: false,
		});
	};

  toggleTOS() {
  	this.setState({
      tosAccepted: !this.state.tosAccepted
		});
	}

	onLogin(e) {
    e.preventDefault();
    if(!this.state.tosAccepted) {
			this.setState({animate: true});
			setTimeout(() => this.setState({animate: false}), 200);
		} else {
      this.props.onRequestClose();
     	window.location = '/slbp/login';
		}
	}

	render() {
		const { termsDialogIsOpen, tosAccepted, animate } = this.state;
		return (
			<Modal
				isOpen={this.props.isOpen}
				onRequestClose={this.props.onRequestClose}
				contentLabel="Login Dialog"
				shouldCloseOnOverlayClick={false}
				className={cx("dialog-base login-dialog", {shake: animate})}
				overlayClassName="dialog-base-overlay"
			>
				<div>
					<img src={logo} height={46} alt="CSGOStakes" />
					<p className="login-dialog-tagline">Have you got what it <span>takes</span>?</p>
					<a
						href="#steam-login-link"
						className="login-dialog-button"
						onClick={this.onLogin}
					>
						<span>Sign in</span>
					</a>
					<div className="login-dialog-age-check">
						<label>
							<input type="checkbox" checked={tosAccepted} onChange={this.toggleTOS} />
							I am at least 18 years old and have read the
							{' '}
							<a
								href="#terms-and-conditions"
								onClick={(e) => { e.preventDefault(); this.termsDialogOpen(); }}
							>
								Terms & Conditions
							</a>
						</label>
					</div>
					<TermsDialog
						isOpen={termsDialogIsOpen}
						onRequestClose={this.termsDialogClose}
					/>
				</div>
			</Modal>
		);
	}
}
