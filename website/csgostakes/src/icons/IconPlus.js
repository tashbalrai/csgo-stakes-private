import React from 'react';

import SvgIconBase from './SvgIconBase';


export default class IconPlus extends React.PureComponent {
	// https://materialdesignicons.com/icon/plus
	render() {
		return (
			<SvgIconBase {...this.props}>
				<path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
			</SvgIconBase>
		);
	}
}
