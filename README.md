# Pixel ripple button

A recreation of the “Get started” button in `pixel-ripple-button.mp4`.

Run `npm run dev` and open http://localhost:5173. The demo uses plain HTML, CSS, and JavaScript, with no dependencies. It also works by opening `index.html` directly.

Move the pointer over the button to illuminate the pixel grid. The highlights follow the pointer and stay still once the hover transition settles. Ripples start only when you click or tap, spreading from the activation point. Enter or Space creates a ripple from the center. The button is a visual demo and has no navigation destination. Reduced-motion preferences disable ripples and tilt.

Tune the animation in the `settings` object at the top of `script.js`. Durations are in milliseconds, `waveSpeed` is button widths per second, `waveWidth` is in grid cells, and `maxTilt` is in degrees. Colors, sizing, and shadows live in `style.css`.
