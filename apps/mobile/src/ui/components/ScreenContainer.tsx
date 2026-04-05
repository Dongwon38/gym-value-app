import React, { PropsWithChildren } from 'react';

import { Screen } from '../Screen';

type ScreenContainerProps = PropsWithChildren<{
  description?: string;
  eyebrow: string;
  headerAction?: React.ReactNode;
  scroll?: boolean;
  showEyebrow?: boolean;
  title: string;
}>;

export function ScreenContainer({
  children,
  description,
  headerAction,
  scroll,
  title,
}: ScreenContainerProps) {
  return (
    <Screen
      description={description}
      headerAction={headerAction}
      scroll={scroll}
      title={title}>
      {children}
    </Screen>
  );
}
