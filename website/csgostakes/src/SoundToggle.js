import React from 'react';

import IconVolumeHigh from './icons/IconVolumeHigh';
import IconVolumeOff from './icons/IconVolumeOff';


export default class SoundToggle extends React.Component {
	constructor() {
		super();
		this.state = {
			isSoundOn: true,
		};
	}
	
	toggleSound = (e) => {
		e.preventDefault();
		this.props.toggleSound();
	}
	
	render() {
		return (
			<a href="#toggle-sound" className="sound-toggle" onClick={this.toggleSound}>
				{this.props.soundOn ? (
					<IconVolumeHigh fill="#fff" />
				) : (
					<IconVolumeOff fill="#fff" />
				)}
			</a>
		);
	}
}
