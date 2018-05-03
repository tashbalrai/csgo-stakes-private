import React from 'react';
import { Link } from 'react-router-dom';

import 'react-dd-menu/dist/react-dd-menu.css';
import DropdownMenu from 'react-dd-menu';

import Avatar from './Avatar';
import avatarTemp from './images/avatar.jpg';
import IconChevronDown from './icons/IconChevronDown';


export default class UserDropdown extends React.Component {
	constructor() {
		super();
		this.state = {
			isMenuOpen: false,
		};
	}
	
	toggleMenu = (e) => {
		e.preventDefault();
		this.setState({
			isMenuOpen: !this.state.isMenuOpen,
		});
	}
	
	closeMenu = () => {
		this.setState({
			isMenuOpen: false,
		});
	}
	
	getDropdownParent() {
		const { user } = this.props;
		return (
			<a href="#open-menu" onClick={this.toggleMenu} className="user-profile-dropdown-toggle">
				<Avatar src={user.avatar} size={42} />
				<span>
					{user.profile_name} <IconChevronDown fill="#fff" />
				</span>
			</a>
		);
	}
	
	render() {
		const menuOptions = {
			isOpen: this.state.isMenuOpen,
			close: this.closeMenu,
			toggle: this.getDropdownParent(),
			align: 'right',
			inverse: true,
		};
		return (
			<DropdownMenu {...menuOptions}>
				<li>
					<Link to="/my-history">My history</Link>
				</li>
				<li>
					<Link to="/trade-url">Trade URL</Link>
				</li>
				<li>
					<Link to="/support">Support</Link>
				</li>
				<li role="separator" className="separator" />
				<li>
					<a href="/user/logout">Sign out</a>
				</li>
			</DropdownMenu>
		);
	}
}
