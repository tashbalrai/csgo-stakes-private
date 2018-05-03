import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

export default class Avatar extends React.PureComponent {
	render() {
		const { size, withBorderEffect, className, steamId } = this.props;
		const marginSize = (withBorderEffect ? 3 : 0);
		
		const avatarStyles = {
			width: size,
			height: size,
		};		
		const avatarInnerStyles = {
			width: size - (marginSize * 2),
			height: size - (marginSize * 2),
			backgroundSize: size - (marginSize * 2),
			margin: marginSize || null,
		};
		
		if (steamId) {
			return (
				<a target="__blank" href={"https://steamcommunity.com/profiles/" + steamId}>
					<span
						className={cx('avatar', {'avatar-border' : withBorderEffect}, className)}
						style={avatarStyles}
					>
						<span
							className="avatar-inner"
							style={{...avatarInnerStyles, backgroundImage: "url('" + this.props.src + "')"}}
						></span>
					</span>
				</a>
			);
		} else {
			return (
				<span
					className={cx('avatar', {'avatar-border' : withBorderEffect}, className)}
					style={avatarStyles}
				>
					<span
						className="avatar-inner"
						style={{...avatarInnerStyles, backgroundImage: "url('" + this.props.src + "')"}}
					></span>
				</span>
			);
		}
		
	}
}

Avatar.defaultProps = {
	size: 27,
	withBorderEffect: false,
};

Avatar.propTypes = {
	src: PropTypes.string.isRequired,
	size: PropTypes.number,
	withBorderEffect: PropTypes.bool,
};
