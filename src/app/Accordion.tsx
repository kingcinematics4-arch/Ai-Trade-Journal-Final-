'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface AccordionProps {
  children: React.ReactNode;
}

export default function Accordion({ children }: AccordionProps) {
  const [openItem, setOpenItem] = useState<string | null>(null);

  const toggleItem = (id: string) => {
    setOpenItem(openItem === id ? null : id);
  };

  return (
    <div className="space-y-4">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            isOpen: child.props.id === openItem,
            onToggle: () => toggleItem(child.props.id),
          });
        }
        return child;
      })}
    </div>
  );
}