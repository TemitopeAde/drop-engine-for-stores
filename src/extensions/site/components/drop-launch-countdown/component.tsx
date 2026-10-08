// This file wires your component with its default props and exports it for use by the extension.
// Please do not modify the structure or logic of this file

import { withDefaults } from '@wix/react-component-utils';
import Component from './drop-launch-countdown';
import { defaultProps } from './drop-launch-countdown.props';

const DropLaunchCountdown = withDefaults(
  Component,
  defaultProps
);

export default DropLaunchCountdown;
