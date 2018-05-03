import React from 'react';
import Message from './Message';
import IconChatSend from './icons/IconChatSend';
import IO from 'socket.io-client';
import uuid from 'uuid';

let lastMessage = '';

export default class ChatContainer extends React.Component {

	static contextTypes = {
    updateClientCount: React.PropTypes.func
	};

	constructor(props) {
		super(props);

		this.socket = IO('/user', {
			transportOptions: {
				polling: {
					extraHeaders: {
						'x-access-token': this.props.token,
						'x-user-sid': this.props.user.id
					}
				}
			}
		});

		window.__chat__ = this.socket;

		this.state = {
			messages: [],
			message: '',
			socketLoggedIn: false,
			isBanned: false
		};

		this._id = 0;
		this.onChange = this.onChange.bind(this);
		this.sendMessage = this.sendMessage.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.banUser = this.banUser.bind(this);
	}

	componentWillMount() {
		this.setState({
			isBanned: this.props.user.is_chat_banned
		});
	}
	
	componentDidMount() {
    this.socket.on('connect', () => {
      console.log('connected');

      this.socket.emit('chat/messages/recent');
		});
		
		this.socket.on('error', (error) => {
			// console.log(error);
		});

    this.socket.on('auth/success', (data) => {
			// console.log('success', data);
    	this.setState({ socketLoggedIn: true });
		});

    this.socket.on('chat/messages', data => {
    	this.setState( { messages: (data || []).reverse() }, this.scrollToBottom);
		});

    this.socket.on('chat/messages/received', data => {
			const messages = this.state.messages;
      //kep only latest 50 messages
      if(messages.length > 50) {
        messages.shift();
      }
    	messages.push(data);
    	this.setState({ messages }, this.scrollToBottom);
		});

    this.socket.on('chat/messages/send/error', data => {
      const messages = this.state.messages;
      messages.push({
        id: uuid(),
        message: data.error,
        system: true
      });
      this.setState( {messages, message: lastMessage}, this.scrollToBottom);
		});

    this.socket.on('chat/broadcasts/banned', data => {
      const messages = this.state.messages;
      let text = `${data.profile_name} is banned`;

      if(data.user_id == this.props.user.id) {
      	text = `You're banned from chat`;
      	this.setState({
      		isBanned: true
				});
			}

      messages.push({
      	id: uuid(),
      	message: text,
				target: data.user_id,
				system: true
			});
      this.setState( {messages}, this.scrollToBottom);
		});

    this.socket.on('chat/commands/error', data => {
    	alert(data.error);
		});

    this.socket.on('clientCount', this.context.updateClientCount);
	}

	componentWillReceiveProps(nextProps) {
		if (!this.props.isLoggedIn && nextProps.isLoggedIn) {
			this.socket.emit('auth', { token: nextProps.token});
		}
	}

  onChange(e) {
    const { value } = e.target;
    this.setState({ message: value });
	}

  onKeyDown(e) {
    if(e.which === 13 && !e.shiftKey) {
    	e.preventDefault();
      this.sendMessage();
    }
	}

  sendMessage() {
		if(!this.state.message) return;

		this.socket.emit('chat/messages/send', {
			message: this.state.message
		});

		lastMessage = this.state.message;

		this.setState({ message: '' });
	}

	scrollToBottom() {
    const div = document.getElementById("message-container");
    div.scrollTop = div.scrollHeight;
	}

  banUser(user_id) {
		this.socket.emit('chat/commands/ban', { user_id });
	}
	
	render() {
		const { messages, message, socketLoggedIn } = this.state;
		return (
			<div className="chat-container">
				<div id="message-container" className="chat-messages-container custom-scroll">
					{messages.map(message => (
						message.system ? (
							<div className="message-system" key={message.id}>{message.message}</div>
						): (<Message isAdmin={this.props.user.role_id == 2} key={message.id} message={message} onBanUserClick={this.banUser} />)
					))}
				</div>
				<div className="chat-form">
					<div className="chat-input-container">
						<textarea
							disabled={!socketLoggedIn || this.state.isBanned}
							className="chat-input"
							placeholder="Type your message..."
							value={message}
							onChange={this.onChange}
							onKeyDown={this.onKeyDown} />
					</div>
					<div className="chat-send-container">
						<button disabled={!socketLoggedIn || this.state.isBanned} type="button" className="chat-send" onClick={this.sendMessage}>
							<IconChatSend width={19} height={19} />
						</button>
					</div>
				</div>
			</div>
		);
	}
}
