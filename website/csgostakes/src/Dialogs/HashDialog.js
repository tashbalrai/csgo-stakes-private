import React from 'react';
import Modal from 'react-modal';

const styles = {
	section: {
		borderBottom: '1px solid rgba(86, 81, 157,.5)',
		marginTop: 15
	},
	code: {
		fontSize: 11
	}
};
export default class HashDialog extends React.Component {

	render() {
		return (
			<Modal
				isOpen={true}
				onRequestClose={this.props.onClose}
				shouldCloseOnOverlayClick={true}
				className="dialog-base url-dialog"
				overlayClassName="dialog-base-overlay"
			>
				<div>
					<span className="close" onClick={this.props.onClose}>&times;</span>
					<h2>CoinFlip #{this.props.id} Info</h2>
					<div style={styles.section}>
						<p  style={{fontSize: 16, fontWeight: 500}}>Game hash</p>
						<p style={styles.code}>
              {this.props.hash}
						</p>
					</div>
					{this.props.completed ? (
						<div>
							<div style={styles.section}>
								<p  style={{fontSize: 16, fontWeight: 500}}>Game secret</p>
								<p style={styles.code}>
                  {this.props.secret}
								</p>
							</div>
							<div style={styles.section}>
								<p  style={{fontSize: 16, fontWeight: 500}}>Game winning percentage</p>
								<p style={styles.code}>
                  {this.props.winage}
								</p>
							</div>
						</div>
					) : null}
				</div>
			</Modal>
		);
	}
}
