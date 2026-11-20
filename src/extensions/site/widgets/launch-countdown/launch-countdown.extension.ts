import { extensions } from '@wix/astro/builders'

export default extensions.customElement({
  id: 'c4432f69-03ca-4c0e-8899-d7b31700987e',
  name: 'Launch Countdown',
  width: {
    defaultWidth: 450,
    allowStretch: true
  },
  height: {
    defaultHeight: 250
  },
  installation: {
    autoAdd: true
  },
  presets: [
    {
      id: 'eb023ddc-d043-449d-b9b3-fcaf1d219286',
      name: 'default',
      thumbnailUrl: '{{BASE_URL}}/launch-countdown-thumbnail.png',
    },
  ],
  
  tagName: 'launch-countdown',
  element: './extensions/site/widgets/launch-countdown/launch-countdown.tsx',
  settings: './extensions/site/widgets/launch-countdown/launch-countdown.panel.tsx',
});
