import React, { PropsWithChildren, createContext, useContext } from 'react';

import type { PlatformServices } from './PlatformServices';
import { createNoopPlatformServices } from './createNoopPlatformServices';

const defaultPlatformServices = createNoopPlatformServices();

const PlatformServicesContext =
  createContext<PlatformServices>(defaultPlatformServices);

export interface PlatformServicesProviderProps {
  services?: PlatformServices;
}

export function PlatformServicesProvider({
  children,
  services = defaultPlatformServices,
}: PropsWithChildren<PlatformServicesProviderProps>) {
  return (
    <PlatformServicesContext.Provider value={services}>
      {children}
    </PlatformServicesContext.Provider>
  );
}

export function usePlatformServices() {
  return useContext(PlatformServicesContext);
}
