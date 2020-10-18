import React from 'react';
import css from './Flex.module.css';
import {addPropsToChildren} from '@anovel/reactor';

const Flex = ({className, style, vertical, horizontal, center, start, end, children, ...props}) => {
	const localStyle = {};

	if (vertical) {
		localStyle.flexDirection = 'column';
	} else if (horizontal) {
		localStyle.flexDirection = 'row';
	}

	if (center) {
		localStyle.justifyContent = 'center';
	} else if (start) {
		localStyle.justifyContent = 'flex-start';
	} else if (end) {
		localStyle.justifyContent = 'flex-end';
	}

	return (
		<div className={`${css.container} ${className}`} style={Object.assign(localStyle, style || {})} {...props}>
			{addPropsToChildren(
				children,
				({grow, style: childStyle, ...props}) => ({
					style: grow && !(childStyle || {}).flexGrow ? {flexGrow: 1, ...(childStyle || {})} : childStyle,
					...props
				})
			)}
		</div>
	);
};

export default Flex;