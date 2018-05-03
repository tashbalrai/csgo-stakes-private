import React from 'react';
import { toast } from 'react-toastify';
import isObject from 'lodash/isObject';

export const IMG_URL = 'https://steamcommunity-a.akamaihd.net/economy/image/';
export const INVENTORY_ITEMS_LIMIT = 50;

export function formatItemValue(value) {
    return value.toFixed(2);
}

export function createToast(type, message, title, options) {

  if(arguments.length === 3 && isObject(options)) {
    options = title;
  }

  const onClick = options && options.onClick ? options.onClick : e => e;

  if(type == 'error') {
    toast.error(
      <div className="toast-container" onClick={onClick}>
          <i className="fa fa-times fa-2x" />
          <div>
              <p>{title || 'Error'}</p>
              <span>{message}</span>
          </div>
      </div>,
      options
    );
  } else if(type == 'info') {
    toast.info(
      <div className="toast-container" onClick={onClick}>
        <i className="fa fa-check fa-2x" />
        <div>
          <p>{title}</p>
          <span>{message}</span>
        </div>
      </div>,
      options
    );
  } else {
    toast.success(
      <div className="toast-container" onClick={onClick}>
        <i className="fa fa-check fa-2x" />
        <div>
          <p>{ title || 'Success'}</p>
          <span>{message}</span>
        </div>
      </div>,
      options
    );
  }
}