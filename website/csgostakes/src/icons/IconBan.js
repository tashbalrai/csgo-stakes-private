import React from 'react';

import SvgIconBase from './SvgIconBase';


export default class IconPlus extends React.PureComponent {
	// https://materialdesignicons.com/icon/plus
	render() {
		return (
			<SvgIconBase {...this.props}>
				<path d="M306,0C136.992,0,0,136.992,0,306c0,168.988,136.992,306,306,306s306-137.012,306-306C612,136.992,475.008,0,306,0z       M306,535.5C179.45,535.5,76.5,432.55,76.5,306c0-49.515,15.912-95.281,42.687-132.804l319.636,319.636      C401.281,519.588,355.515,535.5,306,535.5z M492.832,438.804L173.196,119.187C210.719,92.412,256.485,76.5,306,76.5      c126.55,0,229.5,102.95,229.5,229.5C535.5,355.515,519.588,401.281,492.832,438.804z" fill="#FFFFFF"/>
			</SvgIconBase>
		);
	}
}
