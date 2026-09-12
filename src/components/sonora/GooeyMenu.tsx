'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { ReactNode, useEffect, useId, useRef, useState } from 'react';

type Placement = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

type GooeyMenuProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  children: ReactNode;
  placement?: Placement;
  className?: string;
  label?: string;
};

export function GooeyMenu({ open, onOpenChange, trigger, children, placement = 'bottom-left', className = '', label = 'Menu' }: GooeyMenuProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) onOpenChange(false);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('pointerdown', dismiss, true);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('pointerdown', dismiss, true);
      document.removeEventListener('keydown', key);
    };
  }, [open, onOpenChange]);

  return (
    <div className="gooey-root" ref={rootRef}>
      <div aria-controls={menuId} aria-expanded={open} aria-haspopup="menu" onClick={() => onOpenChange(!open)}>{trigger}</div>
      <AnimatePresence>
        {open ? (
          <motion.div
            id={menuId}
            role="menu"
            aria-label={label}
            className={`gooey-menu ${placement} ${className}`}
            initial={{ opacity: 0, scale: 0.88, y: placement.startsWith('top') ? 10 : -10, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.9, y: placement.startsWith('top') ? 8 : -8, filter: 'blur(8px)' }}
            transition={{ type: 'spring', stiffness: 430, damping: 31, mass: 0.72 }}
          >
            <span className="gooey-blob gooey-blob-a" aria-hidden="true" />
            <span className="gooey-blob gooey-blob-b" aria-hidden="true" />
            <div className="gooey-menu-inner">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

type GooeySelectProps = {
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
  label: string;
};

export function GooeySelect({ value, options, onChange, label }: GooeySelectProps) {
  const [open, setOpen] = useState(false);
  const current = options.find((option) => option.value === value)?.label || label;
  return (
    <GooeyMenu
      open={open}
      onOpenChange={setOpen}
      placement="bottom-right"
      label={label}
      className="gooey-select-menu"
      trigger={<button type="button" className="sonora-select-trigger"><span>{current}</span><ChevronDown size={14} /></button>}
    >
      <div className="sonora-menu-list">
        {options.map((option) => (
          <button key={option.value} type="button" className="sonora-menu-row" onClick={() => { onChange(option.value); setOpen(false); }}>
            <span>{option.label}</span>{value === option.value ? <Check size={14} /> : null}
          </button>
        ))}
      </div>
    </GooeyMenu>
  );
}
