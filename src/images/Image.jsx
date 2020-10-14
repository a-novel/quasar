import React from 'react';
import css from './Image.module.css';

const Image = ({src, className, ...props}) => (
  <div className={`${css.container} ${className || ''}`} style={{background: `url(${src})`}} {...props}/>
);

export default Image;