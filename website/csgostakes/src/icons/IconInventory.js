import React from 'react';

import SvgIconBase from './SvgIconBase';


export default class IconInventory extends React.PureComponent {
	// from design PSD
	render() {
		return (
			<SvgIconBase {...this.props} viewBox="0 0 21 21">
				<path fillRule="evenodd" fill="#6963C0" d="M18.375 21H2.625C1.175 21 0 19.825 0 18.375L1.312 10.5c.342-1.364 1.176-2.625 2.625-2.625H5.25V5.25C5.25 2.35 7.6 0 10.5 0s5.25 2.35 5.25 5.25v2.625h1.312c1.45 0 2.625 1.175 2.625 2.625L21 18.375C21 19.825 19.825 21 18.375 21zm-5.25-15.75c0-1.45-1.175-2.625-2.625-2.625S7.875 3.8 7.875 5.25v2.625h5.25V5.25zm3.953 5.25H15.75v1.312c0 .725-.588 1.313-1.313 1.313-.724 0-1.312-.588-1.312-1.313V10.5h-5.25v1.312c0 .725-.588 1.313-1.313 1.313-.724 0-1.312-.588-1.312-1.313V10.5H3.922l-1.296 7.875h15.737L17.078 10.5z" />
			</SvgIconBase>
		);
	}
}
