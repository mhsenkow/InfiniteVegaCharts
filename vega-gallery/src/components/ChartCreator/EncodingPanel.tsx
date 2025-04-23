import React, { useEffect, useState } from 'react';
import { Box, FormControl, InputLabel, MenuItem, Select, Typography, styled } from '@mui/material';
import { EncodingChannel, MarkType } from '../../types/vega';
import { DatasetMetadata } from '../../types/dataset';
import { detectDataTypes } from '../../utils/dataUtils';
import { getIconForMarkType } from '../../constants/chartIcons';

export const getRequiredChannelsForMarkType = (markType: MarkType): EncodingChannel[] => {
  switch (markType) {
    case 'bar':
    case 'line':
    case 'area':
    case 'point':
    case 'tick':
    case 'boxplot':
    case 'violin':
      return ['x', 'y'];
    case 'circle':
    case 'square':
      return ['x', 'y'];
    case 'arc':
      return ['theta'];
    case 'text':
      return ['text'];
    default:
      return ['x', 'y'];
  }
};

export const getOptionalChannelsForMarkType = (markType: MarkType): EncodingChannel[] => {
  const commonChannels: EncodingChannel[] = ['color', 'tooltip', 'opacity', 'size'];
  
  switch (markType) {
    case 'bar':
      return [...commonChannels];
    case 'line':
    case 'area':
      return [...commonChannels, 'strokeWidth'];
    case 'point':
    case 'circle':
    case 'square':
      return [...commonChannels, 'strokeWidth', 'shape'];
    case 'text':
      return [...commonChannels, 'x', 'y', 'angle'];
    case 'arc':
      return [...commonChannels, 'radius'];
    case 'boxplot':
      return [...commonChannels];
    case 'violin':
      return [...commonChannels, 'density'];
    default:
      return commonChannels;
  }
};

export const getChannelDisplayName = (channel: EncodingChannel): string => {
  const displayNames: Record<EncodingChannel, string> = {
    x: 'X Axis',
    y: 'Y Axis',
    color: 'Color',
    size: 'Size',
    tooltip: 'Tooltip',
    opacity: 'Opacity',
    strokeWidth: 'Stroke Width',
    shape: 'Shape',
    text: 'Text',
    angle: 'Angle',
    theta: 'Theta',
    radius: 'Radius',
    x2: 'X2',
    y2: 'Y2',
    url: 'URL',
    width: 'Width',
    height: 'Height',
    order: 'Order',
    dimensions: 'Dimensions',
    detail: 'Detail',
    density: 'Density'
  };

  return displayNames[channel] || channel;
}; 