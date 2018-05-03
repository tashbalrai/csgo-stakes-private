import React from 'react';

import Logo from './Logo';
import UserProfileArea from './UserProfileArea';


export default class HeaderBar extends React.Component {
	render() {
		return (
			<header className="header-bar">
				<Logo />
				<UserProfileArea
					toggleSound={this.props.onToggleSound}
					soundOn={this.props.soundOn}
					user={this.props.user}
					clientCount={this.props.clientCount} />
			</header>
		);
	}
}
