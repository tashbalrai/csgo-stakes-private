import React from 'react';

import SvgIconBase from './SvgIconBase';


export default class IconChevronDown extends React.PureComponent {
	// https://materialdesignicons.com/icon/chevron-down
	render() {
		return (
			<SvgIconBase {...this.props}>
				<path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z" />
			</SvgIconBase>
		);
	}
}
