import React, { useState, useRef } from 'react';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
const h = React.createElement;

// Reusable Material UI Split Button (ButtonGroup + upward-friendly Menu).
export function SplitButton({
  children,
  options = [],
  value,
  onConfirm,
  onSelect,
  disabled = false,
  menuLabel = 'Choose option',
  className = '',
  confirmProps = {},
  ...props
}) {
  const [open, setOpen] = useState(false);
  const groupRef = useRef(null);
  const classes = ['ui-split-button', className].filter(Boolean).join(' ');
  return h(
    React.Fragment,
    null,
    h(
      ButtonGroup,
      {
        ...props,
        ref: groupRef,
        variant: 'contained',
        disableElevation: true,
        className: classes
      },
      h(
        Button,
        {
          ...confirmProps,
          className: ['ui-split-button__action', confirmProps.className].filter(Boolean).join(' '),
          disabled,
          onClick: onConfirm
        },
        children
      ),
      h(
        Button,
        {
          type: 'button',
          className: 'ui-split-button__toggle',
          disabled: !options.length,
          'aria-label': menuLabel,
          'aria-haspopup': 'menu',
          'aria-expanded': open ? 'true' : 'false',
          onClick: () => setOpen((prev) => !prev)
        },
        '▾'
      )
    ),
    h(
      Menu,
      {
        anchorEl: groupRef.current,
        open: open && Boolean(groupRef.current),
        onClose: () => setOpen(false),
        anchorOrigin: { vertical: 'top', horizontal: 'right' },
        transformOrigin: { vertical: 'bottom', horizontal: 'right' }
      },
      options.map((opt, index) =>
        h(
          MenuItem,
          {
            key: opt.value ?? index,
            selected: opt.value === value,
            disabled: Boolean(opt.disabled),
            onClick: () => {
              setOpen(false);
              onSelect?.(opt.value, opt);
            }
          },
          opt.label
        )
      )
    )
  );
}
