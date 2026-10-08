/**
 * THIS FILE IS AUTO-GENERATED — DO NOT EDIT.
 * It contains the `editorElement` portion of the manifest, automatically derived from your component's
 * source code, prop types, and CSS rules.
 * Update your source code and run `npx wix build && npx wix generate manifest` to regenerate it.
 * If you need to override specific manifest values (sizing, layout, etc.),
 * you can do so in drop-launch-countdown.extension.ts.
 */

import type { EditorElement } from '@wix/react-component-schema';

export const editorElement = {
  "selector": ".drop-launch-countdown",
  "displayName": "Drop Launch Countdown",
  "data": {
    "direction": {
      "displayName": "Direction",
      "dataType": "direction"
    },
    "productId": {
      "displayName": "Product Id",
      "dataType": "text",
      "text": {}
    },
    "headline": {
      "displayName": "Headline",
      "dataType": "text",
      "text": {}
    }
  },
  "elements": {
    "dropLaunchCountdownHeading": {
      "elementType": "inlineElement",
      "inlineElement": {
        "selector": ".drop-launch-countdown-heading",
        "displayName": "Heading",
        "behaviors": {
          "removable": true,
          "selectable": false
        },
        "cssProperties": {
          "font": {
            "defaultValue": "600 24px/1.25 system-ui,sans-serif"
          },
          "lineHeight": {
            "defaultValue": "1.25"
          },
          "letterSpacing": {},
          "textDecorationLine": {},
          "textTransform": {},
          "textAlign": {},
          "textShadow": {},
          "color": {},
          "marginTop": {
            "defaultValue": "0"
          },
          "marginBottom": {
            "defaultValue": "0"
          },
          "marginInlineStart": {
            "defaultValue": "0"
          },
          "marginInlineEnd": {
            "defaultValue": "0"
          },
          "display": {
            "display": {
              "displayValues": [
                "none",
                "block"
              ]
            }
          },
          "alignSelf": {}
        }
      }
    },
    "dropLaunchCountdownStatus": {
      "elementType": "inlineElement",
      "inlineElement": {
        "selector": ".drop-launch-countdown-status",
        "displayName": "Status",
        "behaviors": {
          "removable": true,
          "selectable": false
        },
        "cssProperties": {
          "font": {
            "defaultValue": "16px/1.5 system-ui,sans-serif"
          },
          "lineHeight": {
            "defaultValue": "1.5"
          },
          "letterSpacing": {},
          "textDecorationLine": {},
          "textTransform": {},
          "textAlign": {},
          "textShadow": {},
          "color": {},
          "marginTop": {
            "defaultValue": "0"
          },
          "marginBottom": {
            "defaultValue": "0"
          },
          "marginInlineStart": {
            "defaultValue": "0"
          },
          "marginInlineEnd": {
            "defaultValue": "0"
          },
          "display": {
            "display": {
              "displayValues": [
                "none",
                "block"
              ]
            }
          },
          "alignSelf": {}
        }
      }
    },
    "dropLaunchCountdownCountdown": {
      "elementType": "inlineElement",
      "inlineElement": {
        "selector": ".drop-launch-countdown-countdown",
        "displayName": "Countdown",
        "behaviors": {
          "removable": true,
          "selectable": false
        },
        "cssProperties": {
          "background": {},
          "borderTop": {},
          "borderBottom": {},
          "borderInlineStart": {},
          "borderInlineEnd": {},
          "paddingTop": {},
          "paddingBottom": {},
          "paddingInlineStart": {},
          "paddingInlineEnd": {},
          "borderStartStartRadius": {},
          "borderStartEndRadius": {},
          "borderEndStartRadius": {},
          "borderEndEndRadius": {},
          "boxShadow": {},
          "width": {},
          "height": {},
          "overflow": {},
          "mixBlendMode": {},
          "display": {
            "display": {
              "displayValues": [
                "none",
                "flex"
              ]
            }
          },
          "marginTop": {},
          "marginBottom": {},
          "marginInlineStart": {},
          "marginInlineEnd": {},
          "gap": {
            "defaultValue": "20px"
          },
          "flexDirection": {},
          "justifyContent": {},
          "alignItems": {},
          "alignSelf": {}
        },
        "elements": {
          "dropLaunchCountdownNumber": {
            "elementType": "inlineElement",
            "inlineElement": {
              "selector": ".drop-launch-countdown-number",
              "displayName": "Number",
              "behaviors": {
                "removable": true,
                "selectable": false
              },
              "cssProperties": {
                "font": {
                  "defaultValue": "700 28.8px/1.2 system-ui,sans-serif"
                },
                "lineHeight": {
                  "defaultValue": "1.2"
                },
                "letterSpacing": {},
                "textDecorationLine": {},
                "textTransform": {},
                "textAlign": {},
                "textShadow": {},
                "color": {},
                "marginInlineStart": {},
                "marginInlineEnd": {},
                "display": {
                  "display": {
                    "displayValues": [
                      "none",
                      "inline"
                    ]
                  }
                },
                "alignSelf": {}
              }
            }
          },
          "dropLaunchCountdownLabel": {
            "elementType": "inlineElement",
            "inlineElement": {
              "selector": ".drop-launch-countdown-label",
              "displayName": "Label",
              "behaviors": {
                "removable": true,
                "selectable": false
              },
              "cssProperties": {
                "font": {
                  "defaultValue": "16px/1.5 system-ui,sans-serif"
                },
                "lineHeight": {
                  "defaultValue": "1.5"
                },
                "letterSpacing": {},
                "textDecorationLine": {},
                "textTransform": {},
                "textAlign": {},
                "textShadow": {},
                "color": {},
                "marginInlineStart": {},
                "marginInlineEnd": {},
                "display": {
                  "display": {
                    "displayValues": [
                      "none",
                      "inline"
                    ]
                  }
                },
                "alignSelf": {}
              }
            }
          }
        }
      }
    }
  },
  "cssProperties": {
    "background": {
      "defaultValue": "#edf5ef"
    },
    "borderTop": {
      "defaultValue": "1px solid #cbded1"
    },
    "borderBottom": {
      "defaultValue": "1px solid #cbded1"
    },
    "borderInlineStart": {
      "defaultValue": "1px solid #cbded1"
    },
    "borderInlineEnd": {
      "defaultValue": "1px solid #cbded1"
    },
    "paddingTop": {
      "defaultValue": "24px"
    },
    "paddingBottom": {
      "defaultValue": "24px"
    },
    "paddingInlineStart": {
      "defaultValue": "24px"
    },
    "paddingInlineEnd": {
      "defaultValue": "24px"
    },
    "borderStartStartRadius": {
      "defaultValue": "12px"
    },
    "borderStartEndRadius": {
      "defaultValue": "12px"
    },
    "borderEndStartRadius": {
      "defaultValue": "12px"
    },
    "borderEndEndRadius": {
      "defaultValue": "12px"
    },
    "boxShadow": {},
    "overflow": {},
    "mixBlendMode": {},
    "gap": {
      "defaultValue": "16px"
    },
    "flexDirection": {
      "defaultValue": "column"
    },
    "justifyContent": {},
    "alignItems": {}
  },
  "cssCustomProperties": {}
} as EditorElement;
