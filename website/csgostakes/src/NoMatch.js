import React from 'react';


export default class NoMatch extends React.Component {
	render() {
		return (
			<div>
				<h3>No match for <code>{this.props.location.pathname}</code></h3>
			</div>
		);
	}
}
