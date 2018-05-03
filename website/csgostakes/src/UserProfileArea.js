import React from 'react';

import UserDropdown from './UserDropdown';
import UsersOnlineCount from './UsersOnlineCount';
import SoundToggle from './SoundToggle';


export default class UserProfileArea extends React.Component {
	render() {
		return (
			<div className="user-profile-area">
				<SoundToggle toggleSound={this.props.toggleSound} soundOn={this.props.soundOn} />
				<UsersOnlineCount count={this.props.clientCount} />
				<UserDropdown user={this.props.user} />
			</div>
		);
	}
}
