import React from 'react';

//import IconFacebookBox from './icons/IconFacebookBox';
import IconTwitterBox from './icons/IconTwitterBox';
import IconSteamBox from './icons/IconSteamBox';


export default class SocialButtons extends React.Component {
	render() {
		return (
			<div className="social-buttons">
				<a href="https://twitter.com/csgo_stakes" target="_blank" rel="noopener noreferrer">
					<IconTwitterBox />
				</a>
				<a href="http://steamcommunity.com/groups/CSGOSTAKESOFFICIAL" target="_blank" rel="noopener noreferrer">
					<IconSteamBox />
				</a>
			</div>
		);
	}
}
