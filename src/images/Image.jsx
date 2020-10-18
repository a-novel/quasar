import React from 'react';
import css from './Image.module.css';

const Image = ({src, className, style, ...props}) => (
  <div className={`${css.container} ${className || ''}`} style={Object.assign(style || {}, {backgroundImage: `url(${src})`})} {...props}/>
);

export default Image;