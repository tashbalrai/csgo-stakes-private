import React from 'react';

import LeftMenu from './LeftMenu';
import ChatContainer from './ChatContainer';
import SocialButtons from './SocialButtons';


export default class LeftPanel extends React.Component {
	render() {
		return (
			<div className="left-panel">
				<LeftMenu giveaway={this.props.giveaway} />
				<ChatContainer {...this.props} />
				<SocialButtons />
			</div>
		);
	}
}
