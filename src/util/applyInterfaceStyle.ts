import type { InterfaceStyle } from '../types';

const CLASSIC_INTERFACE_CLASS = 'interface-style-classic';

export default function applyInterfaceStyle(interfaceStyle: InterfaceStyle) {
  document.documentElement.classList.toggle(CLASSIC_INTERFACE_CLASS, interfaceStyle === 'classic');
}
