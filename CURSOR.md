# TUMO Interactive Hub --- Architecture Rules

## Purpose

This document defines the mandatory architectural constraints and coding
patterns for this project. All generated or modified code must follow
these rules.

------------------------------------------------------------------------

## 1. Layer Separation

The project is divided into two layers:

### Core (`src/`)

-   Contains `ScreenManager`, `Screen` class, UI system, layout engine,
    DOM logic.
-   Must not be modified by students.
-   May be modified only intentionally by instructor.

### Student Layer (`change-me/`)

-   Contains screens, app configuration, actions, and theme.
-   All student work happens here.

Never mix responsibilities across layers.

------------------------------------------------------------------------

## 2. Screen Architecture

-   Each screen must live in its own file.
-   Each screen exports a single `Screen` object.
-   Screens are registered in `change-me/app.js`.
-   Navigation is performed using string-based action names.

Example structure:

    change-me/
      app.js
      theme.js
      screens/
        home.screen.js
        gallery.screen.js
        quiz.screen.js

------------------------------------------------------------------------

## 3. Layout Rules

Coordinates are forbidden.

Do not use: - `x` / `y` - Pixel positioning - Absolute layout in student
code

Screens must use:

``` js
setLayout({
  hAlign: "left" | "center" | "right",
  vAlign: "top" | "middle" | "bottom",
  gap: number,
  maxWidth: number
})
```

Default alignment is `center` + `middle`.

Components are vertically stacked.

------------------------------------------------------------------------

## 4. Component Usage

Students may only build UI using:

-   `addText()`
-   `addButton()`
-   `addInput()`
-   `addGallery()`
-   `addQuiz()`
-   `addVideo()`
-   `addSoundLevel()`

Components must receive arguments as objects.

Example:

``` js
addButton({
  label: "Start",
  action: "goHome"
});
```

------------------------------------------------------------------------

## 5. Actions

-   Actions are strings.
-   No inline callbacks.
-   All actions are defined in `change-me/app.js`.
-   Actions receive a context object: `{ goTo, ui, state, payload }`

Flow logic must be defined explicitly in action functions.

------------------------------------------------------------------------

## 6. Flow Management

Navigation between screens must happen via:

``` js
goTo("screenName");
```

Flow decisions (conditional branching) must be implemented inside action
functions.

Example:

``` js
if (payload.isCorrect) {
  goTo("success");
} else {
  goTo("retry");
}
```

------------------------------------------------------------------------

## 7. Theme System

Students may customize appearance only via `theme.js`.

No hardcoded colors inside screens.

Use theme tokens and variants where available.

------------------------------------------------------------------------

## 8. Educational Priorities

The architecture exists to reinforce:

-   Function calls
-   Structured arguments
-   Object manipulation
-   Arrays
-   Conditional logic
-   Modular file structure
-   Separation of concerns

Generated code must prioritize clarity over cleverness.

Avoid: - Over-engineering - Hidden logic - Magic behavior - Complex
abstractions beyond the defined system

------------------------------------------------------------------------

## 9. Complexity Control

This is a teaching tool, not a production framework.

Any extension must: - Preserve simplicity - Maintain separation between
core and student layer - Avoid introducing new conceptual layers unless
necessary

All future additions must respect this abstraction boundary.
