import React from 'react';


export default class SvgIconBase extends React.PureComponent {
	// https://materialdesignicons.com/icon/coins
	render() {
		return (
			<svg {...this.props}>
				{this.props.children}
			</svg>
		);
	}
}

SvgIconBase.defaultProps = {
	width: 24,
	height: 24,
	viewBox: '0 0 24 24',
	fill: '#000',
	style: {
		display: 'inline-block',
		verticalAlign: 'middle',
	},
};
