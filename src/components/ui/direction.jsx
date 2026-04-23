import * as React from 'react';
import { Direction } from 'radix-ui';

/**
 * Provides text direction (LTR/RTL) context using Radix UI's Direction primitive.
 */
function DirectionProvider({
  dir,
  children,
}) {
  return (
    <Direction.DirectionProvider dir={dir}>
      {children}
    </Direction.DirectionProvider>
  );
}

const useDirection = Direction.useDirection;

export { DirectionProvider, useDirection };
