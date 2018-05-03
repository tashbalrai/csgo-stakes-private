import React from 'react';


export default class UsersOnlineCount extends React.Component {
	constructor() {
		super();
		this.state = {
			isWaveActive: true,
		};
	}
	
	toggleWave = () => {
		this.setState({
			isWaveActive: !this.state.isWaveActive,
		});
	}
	
	render() {
		return (
			<div className="users-online" onClick={this.toggleWave}>
				<div className="sonar-emitter">
					<div className={this.state.isWaveActive ? 'sonar-wave' : ''}></div>
				</div>
				<span className="users-online-count">
					Online: <span>{this.props.count}</span>
				</span>
			</div>
		);
	}
}
