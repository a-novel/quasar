import React from 'react';
import css from './Layers.module.css';
import {addPropsToChildren} from '@anovel/reactor';

const literals = {
	ERROR_NONVALIDPROP: (prop, propName, expected) => `non valid prop ${propName} of type ${prop.constructor.name} : expected ${expected}`
};

const Layers = ({children, className, align, expand, ...props}) => {
	const style = {position: 'absolute'};
	const groundStyle = {position: 'relative'};
	const transform = ['', ''];

	if (align != null) {
		if (align.constructor.name !== 'Object') {
			throw new Error(literals.ERROR_NONVALIDPROP(align, 'align', 'Object'));
		}

		if (align.verticalCenter) {
			style.top = '50%';
			transform[0] = '-50%';
			groundStyle.marginLeft = 'auto';
			groundStyle.marginRight = 'auto';
		}

		if (align.horizontalCenter) {
			style.left = '50%';
			transform[1] = '-50%';
			groundStyle.marginTop = 'auto';
			groundStyle.marginBottom = 'auto';
		}

		if (align.top && !align.verticalCenter) {
			style.top = align.top;
			groundStyle.top = align.top;
		}

		if (align.bottom && !align.verticalCenter) {
			style.bottom = align.bottom;
			groundStyle.bottom = align.bottom;
		}

		if (align.left && !align.horizontalCenter) {
			style.left = align.left;
			groundStyle.left = align.left;
		}

		if (align.right && !align.horizontalCenter) {
			style.right = align.right;
			groundStyle.right = align.right;
		}

		if (transform.find(x => x !== '')) {
			style.transformOrigin = 'center';
			style.transform = `translate(${transform[0]}, ${transform[1]})`;
		}
	} else {
		style.top = '50%';
		style.left = '50%';
		style.transformOrigin = 'center';
		style.transform = 'translate(-50%, -50%)';
		groundStyle.marginTop = 'auto';
		groundStyle.marginBottom = 'auto';
		groundStyle.marginLeft = 'auto';
		groundStyle.marginRight = 'auto';
	}

	if (expand != null) {
		if (expand === true) {
			style.height = '100%';
			style.width = '100%';
			groundStyle.height = '100%';
			groundStyle.width = '100%';
		} else if (expand === 'vertical') {
			style.width = '100%';
			groundStyle.width = '100%';
		} else if (expand === 'horizontal') {
			style.height = '100%';
			groundStyle.height = '100%';
		} else if (expand.constructor.name === 'Object') {
			if (expand.height) {
				style.height = expand.height;
				groundStyle.height = expand.height;
			}
			if (expand.width) {
				style.width = expand.width;
				groundStyle.width = expand.width;
			}
		} else {
			throw new Error(literals.ERROR_NONVALIDPROP(expand, 'expand', 'Boolean or \'vertical\' or \'horizontal\' or Object'));
		}
	}

	return (
		<div className={`${css.wrapper} ${className || ''}`} {...props}>
			{addPropsToChildren(children, ({style: childStyle, ground, raw, ...props}) => ({
				style: raw ? childStyle : Object.assign({}, ground ? groundStyle : style, childStyle),
				...props
			}))}
		</div>
	);
};

export default Layers;