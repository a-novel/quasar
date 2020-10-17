import React from 'react';
import css from './Layers.module.css';
import {addPropsToChildren} from '@anovel/reactor';

const literals = {
	ERROR_NONVALIDPROP: (prop, propName, expected) => `non valid prop ${propName} of type ${prop.constructor.name} : expected ${expected}`
};

const computeOptions = (align, expand) => {
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
			groundStyle.marginTop = 'auto';
			groundStyle.marginBottom = 'auto';
		}

		if (align.horizontalCenter) {
			style.left = '50%';
			transform[1] = '-50%';
			groundStyle.marginLeft = 'auto';
			groundStyle.marginRight = 'auto';
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
								!emancipate && (align || expand) ? computeOptions(childAlign, childExpand)[ground ? 'groundStyle' : 'style'] : {},
								childStyle
							);

						return {style: mergeStyle, ...props};
					}
				)
			}
		</div>
	);
};

export default Layers;