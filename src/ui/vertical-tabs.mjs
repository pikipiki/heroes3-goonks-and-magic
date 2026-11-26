import React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
const h = React.createElement;

// Reusable Material UI vertical tabs with side indicator bar.
export function VerticalTabs({
  value,
  onChange,
  items = [],
  label,
  className = '',
  indicatorSide = 'left',
  ...props
}) {
  const classes = ['ui-vertical-tabs', className].filter(Boolean).join(' ');
  return h(
    Tabs,
    {
      ...props,
      component: 'nav',
      orientation: 'vertical',
      variant: 'standard',
      value,
      onChange,
      className: classes,
      'aria-label': label,
      'data-indicator-side': indicatorSide
    },
    items.map((item, index) =>
      h(Tab, {
        key: item.key ?? item.value ?? index,
        value: item.value ?? index,
        id: item.id,
        disabled: item.disabled,
        'aria-controls': item.controls,
        'data-mui-component': 'Tab',
        label: h(Box, { component: 'span', className: 'ui-tab-label' }, item.label)
      })
    )
  );
}
