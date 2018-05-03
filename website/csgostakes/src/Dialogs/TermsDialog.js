import React from 'react';
import Modal from 'react-modal';


export default class TermsDialog extends React.Component {
	render() {
		return (
			<Modal
				isOpen={this.props.isOpen}
				onRequestClose={this.props.onRequestClose}
				contentLabel="Terms & Conditions Dialog"
				className="terms-dialog"
				overlayClassName="dialog-base-overlay"
			>
				<div>
					<h2>Terms and Conditions</h2>
					<div>
						<p>By betting your skins on CSGOStakes.com, you hereby agree to the following Terms and Conditions, and you understand you are responsible for compliance with any applicable laws. If you don't agree with these Terms and Conditions, you are not permitted to use CSGOStakes.com.</p>
						
						<h3>Bans</h3>
						<p>CSGOStakes.com reserves the right to remove and/or ban a user's access to this website for any reason. We are not obligated to provide a reason for denial of access to the user.</p>
						
						<h3>Skin Prices</h3>
						<p>We value our skin prices as accurately as possible. However, we cannot guarantee that these prices will always be correct - due to market price fluctuations. We can assure our users that we will do everything we can to stay on top of the current prices of items, to avoid users falling victom of price manipulation. When you deposit into this website, the price is displayed below each skin. By betting a skin you agree you were aware of the current price.</p>
						
						<h3>Rake</h3>
						<p>Here at CSGOStakes.com, we take approximately 4-8% rake/commission from each round. This is to ensure we are able to keep the website running for our users. The exact percentage can vary depending on which items are in the round. We can assure you we will never take above 10%.</p>
						
						<h3>Refunds</h3>
						<p>We are not responsible for the loss of your skins in any case. The only times we permit refunds are under special circumstances, in which the user would have to provide significant evidence.</p>
						
						<h3>Risk</h3>
						<p>Once your bet is placed, it can't be retracted/cancelled. Make sure when betting on CSGOStakes.com you know the risk factor of losing and are willing to lose the skins you bet.</p>
						
						<h3>Media Content</h3>
						<p>We reserve the right to use any content made using our website services.</p>
						
						<h3>Governing Law</h3>
						<p>CSGOStakes.com may revise these Terms of Service at any time without notice/notifcation. By using CSGOStakes.com, you are agreeing to be bound by the current version of these Terms of Service.</p>
						
						<h3>Scammers</h3>
						<p>Here at CSGOStakes.com, we take scamming very seriously. We don't want to see our users get into situations in which could result in someone getting scammed. For this reason we feel it's necessary to make our users aware that our staff will NEVER ask for items from you. Please do not fall victim to imposter accounts which users may create. If you are scammed by an unofficial CSGOStakes.com staff member, or user, we CANNOT refund/replace your skins.</p>
						
						<p>By betting on CSGOStakes.com you agree you are 18 years of age or older.</p>
						
						<p>We are not affiliated with Valve Corporation.</p>
					</div>
					<a
						href="#close"
						className="login-dialog-button"
						onClick={(e) => { e.preventDefault(); this.props.onRequestClose(); }}
					>
						<span>Close</span>
					</a>
				</div>
			</Modal>
		);
	}
}
