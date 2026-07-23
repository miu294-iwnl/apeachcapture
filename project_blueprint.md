# Project Blueprint: Apeach Photobooth 🍑

This blueprint outlines the design, architecture, and specifications for a cute, client-side photobooth web application themed around the character Apeach with a sweet pastel-pink aesthetic.

---

## 1. Product Concept & Scoping

- **Core Value**: Provide a lightweight, fun, and secure browser-based photobooth where users can capture photos, apply cute retro/pink filters, and download a custom 4-cut vertical photo strip.
- **Target Audience**: Desktop/laptop users wanting a cute, nostalgic photo-strip capturing experience.
- **Privacy & Security**: 100% client-side. No images are uploaded to any server or cloud database; images are processed in-browser via HTML5 Canvas and can be downloaded directly.
- **Non-Goals**: No user accounts/login, no cloud image hosting, no online QR-code sharing, no keyboard shortcut control (purely click-driven).

---

## 2. Information Architecture & UX Flow

- **Layout**: Balanced split-screen layout (`display: grid` with two main panels).
  - **Left Panel (Live Booth)**: Contains the live video camera feed inside a soft, thick-bordered frame. Below the video are the peach-shaped **Capture** button and circular filter selector icons.
  - **Right Panel (Collage Strip)**: Displays a live-updating preview of the vertical photo strip containing 4 empty frames. Once all 4 slots are filled, a prominent **Download** button appears.
- **User Flow**:
  1. User grants camera permission -> video stream starts.
  2. User selects a color filter (Normal, Retro, Pink, B&W).
  3. User clicks the **Capture** button -> 3, 2, 1 countdown overlay animates on top of the camera feed.
  4. Photo is taken with a flash animation effect.
  5. The image is drawn and slides smoothly into the current slot on the right panel.
  6. The loop repeats (with a 1.5s delay for posing) until 4 photos are collected.
  7. User clicks the **Download** button to save the finalized PNG strip.

---

## 3. Styling & Aesthetics (Design System)

- **Aesthetic**: Playful, cartoonish, and cozy (Toy-like).
- **Typography**: Google Fonts **Fredoka** (soft, thick, rounded fonts matching Kakao Friends aesthetics).
- **Color Palette (HSL Variables)**:
  - Primary Pink (Apeach pink): `hsl(350, 100%, 87%)`
  - Deep Pink (Borders, Text): `hsl(343, 85%, 63%)`
  - Pale Background: `hsl(350, 100%, 95%)`
  - Peach Accent: `hsl(20, 100%, 75%)`
  - Text Color: `hsl(343, 40%, 25%)`
- **Animations**:
  - `flash-effect`: Quick fade-in/fade-out white mask overlay to simulate a camera flash.
  - `slide-in`: Transition animation pushing newly captured photo into its photo-strip slot.
  - `peach-hover`: Scaling and light wiggle effect for the capture button on hover.

---

## 4. Technical Architecture

- **Frontend**: Vanilla HTML5, CSS3, and ES6 JavaScript. No framework overhead.
- **APIs**: Native browser WebRTC API (`navigator.mediaDevices.getUserMedia`) for video stream.
- **Image Processing**: HTML5 `<canvas>` API for filtering, cropping, and compositing the final photo strip.
- **Responsive Fallback**: CSS Flexbox rules inside media queries (`@media (max-width: 768px)`) to stack the panels vertically on mobile screens.

---

## 5. Decision Log

1. **Tech Stack**: Vanilla HTML/CSS/JS.
   - *Alternatives*: React/Vite.
   - *Reason*: Avoids dependency bloat, loads instantly, and runs easily anywhere without installation steps.
2. **Page Layout**: Split-screen design.
   - *Alternatives*: Wizard/Step-by-step panel.
   - *Reason*: Keeps camera feed and the resulting photo strip visible side-by-side in real-time, improving interactivity.
3. **Color System**: Tailorable HSL variables.
   - *Alternatives*: Static hex codes.
   - *Reason*: Allows developers/users to easily tweak pink hue saturation or brightness to perfectly match official Apeach styling.
4. **Typography**: Google Fonts "Fredoka".
   - *Alternatives*: System sans-serif.
   - *Reason*: Rounded, playful style matches Kakao Friends' cartoon aesthetic.
5. **Photo collage**: Draw onto a single `600x1800` canvas.
   - *Alternatives*: DOM screenshotting libraries (e.g. `html2canvas`).
   - *Reason*: Drawing directly via Canvas context is much more reliable, performant, and exports native high-resolution images.
6. **Filters**: CSS filters synchronized with Canvas filters.
   - *Alternatives*: Custom canvas pixel shaders.
   - *Reason*: Native CSS filter property handles sepia, grayscale, and brightness adjustments efficiently in real-time.
7. **Error handling**: Inline styled dialog boxes.
   - *Alternatives*: Default browser `alert()` popups.
   - *Reason*: Preserves visual continuity and does not interrupt user engagement.
8. **Responsive Stack**: Flexbox stack column fallback.
   - *Alternatives*: Disallowing mobile access.
   - *Reason*: Ensures mobile users can still enjoy the app even if optimal layout is landscape.
