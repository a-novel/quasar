import React from 'react';
import css from './Layers.module.css';
import {addPropsToChildren} from '@anovel/reactor';

const literals = {
	ERROR_NONVALIDPROP: (prop, propName, expected) => `non valid prop ${propName} of type ${prop.constructor.name} : expected ${expected}`
};

const buildAlignObject = align => {
	if (align === false) {
		return {style: {}, groundStyle: {}};
	}

	if (align === true || align == null) {
		return {
			style: {
				top: '50%',
				left: '50%',
				transformOrigin: 'center',
				transform: 'translate(-50%, -50%)'
			},
			groundStyle: {
				margin: 'auto'
			}
		};
	}

	if (align.constructor.name === 'Object') {
		const transform = ['', ''];
		const {verticalCenter, horizontalCenter} = align;

		if (verticalCenter) {
			transform[1] = '-50%';
		}

		if (horizontalCenter) {
			transform[0] = '-50%';
		}

		const shouldTransform = transform.find(x => x !== '');

		return {
			style: {
				top: verticalCenter ? '50%' : null,
				left: horizontalCenter ? '50%' : null,
				transformOrigin: shouldTransform ? 'center' : null,
				transform: shouldTransform ? `translate(${transform[0]}, ${transform[1]})` : null
			},
			groundStyle: {
				marginTop: verticalCenter ? 'auto' : null,
				marginBottom: verticalCenter ? 'auto' : null,
				marginLeft: horizontalCenter ? 'auto' : null,
				marginRight: horizontalCenter ? 'auto' : null
			}
		};
	}

	throw new Error(literals.ERROR_NONVALIDPROP(align, 'align', 'Object'));
};

const computeOptions = (align, expand) => {
	const {style, groundStyle} = buildAlignObject(align);
	style.position = 'absolute';
	groundStyle.position = 'relative';

	if (expand != null) {
		if (expand === true) {
			style.height = '100%';
			style.width = '100%';
			groundStyle.height = '100%';
			groundStyle.width = '100%';
		} else if (expand === 'horizontal') {
			style.width = '100%';
			groundStyle.width = '100%';
		} else if (expand === 'vertical') {
			style.height = '100%';
			groundStyle.height = '100%';
		} else {
			throw new Error(literals.ERROR_NONVALIDPROP(expand, 'expand', 'Boolean or \'vertical\' or \'horizontal\''));
		}
	}

	return {style, groundStyle};
};

const Layers = ({children, className, align, expand, ...props}) => {
	const {style, groundStyle} = computeOptions(align, expand);

	return (
		<div className={`${css.wrapper} ${className || ''}`} {...props}>
			{
				addPropsToChildren(
					children,
					({style: childStyle, ground, raw, align: childAlign, expand: childExpand, emancipate, ...props}) => {
						const mergeStyle = raw ?
							childStyle :
							Object.assign(
								{},
								emancipate ? {} : (ground ? groundStyle : style),
								(childAlign || childExpand) ? computeOptions(childAlign, childExpand)[ground ? 'groundStyle' : 'style'] : {},
								childStyle || {}
							);

						return {style: mergeStyle, ...props};
					}
				)
			}
		</div>
	);
};

export default Layers;