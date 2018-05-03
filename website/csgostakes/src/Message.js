import React from 'react';
import TimeAgo from 'react-timeago';
import cx from 'classnames';
import Avatar from './Avatar';
import IconBan from './images/forbidden-sign-icon.svg';

function formatFn(value, unit, suffix) {
	if(value < 60 && unit =='second') {
		if(value < 5) {
			return 'Just now';
		}
		return 'few seconds ago';
	}
	return `${value} ${unit} ${suffix}`;
}

export default class Message extends React.PureComponent {

	banUser(id) {
    if(confirm(`ban ${this.props.message.profile_name}?`)) this.props.onBanUserClick(id); //eslint-disable-line
	}

	render() {
		const { message, onBanUserClick, isAdmin } = this.props;
		return (
			<div className={cx("chat-message", { admin: message.role_id === 2, bot: message.role_id === 4 })}>
				<div className="chat-message-header">
					<Avatar src={message.avatar} size={32} steamId={message.steam_id} />
					<div style={{display: 'flex', flex: 1}}>
						<span className="chat-message-username">{message.profile_name}</span>
						{message.role_id === 2 && <span className="badge">MOD</span>}
						{message.role_id === 4 && <span className="badge">BOT</span>}
					</div>
					<div className="chat-actions">
						{isAdmin && ![2, 4].includes(message.role_id) &&  <img src={IconBan} title="Ban user" onClick={() => this.banUser(message.user_id)} />}
					</div>
				</div>
				<div className="chat-message-body">
					{message.message}
				</div>
				<div className="chat-message-time">
						<TimeAgo date={message.created_at} formatter={formatFn} />
					</div>
			</div>
		);
	}
}