import { useContext } from 'react';
import { PlatformSettingsContext } from '../store/platformSettingsContext';

export function usePlatformSettings() {
  return useContext(PlatformSettingsContext);
}
