# TUMO Interactive Hub — Project Summary

This project aims to create a structured and modular foundation for building an interactive hub application that students can extend and customize. The system is intentionally designed as a learning scaffold rather than just a functional interface.

The core objective is pedagogical. Students are young learners who must strengthen their understanding of:

- Function calls  
- Function arguments  
- Objects  
- Arrays  
- Conditionals  
- State management  
- Modular file structure  

The project architecture reinforces these concepts through practical use.

## Architecture Overview

The system is divided into two layers.

### 1. Core Layer (Instructor Code)

The core provides a stable abstraction boundary and is not modified by students. It includes:

- Screen management (registration and navigation)
- Alignment-based layout engine (no coordinate system)
- UI component functions:
  - addText
  - addButton
  - addInput
  - addGallery
  - addQuiz
  - addVideo
  - addSoundLevel
- Action handling through predefined string-based action names
- Theme system
- DOM rendering logic

This layer hides implementation complexity and enforces architectural consistency.

### 2. Student Layer (change-me)

Students work only inside the `change-me` folder. They define:

- One file per screen
- A Screen object per file
- Layout configuration using `setLayout()`
- UI composition using `add*` methods
- Action definitions
- Navigation flow between screens
- Theme customization

A central `change-me/app.js` file acts as the orchestration layer where students:

- Import screens
- Register screens
- Define actions
- Define navigation flow
- Control transitions when screens finish

## Layout System

The layout model avoids x/y coordinate positioning. Instead, screens use:

- Horizontal alignment: left | center | right
- Vertical alignment: top | middle | bottom
- Vertical stacking of components
- Configurable gap and maxWidth

This reduces cognitive load and keeps focus on structure and logic.

## Educational Intent

The design encourages:

- Calling functions correctly
- Passing structured objects as arguments
- Working with arrays (quiz options)
- Understanding object properties
- Using conditional logic inside actions
- Managing shared state
- Explicit navigation flow
- Modular thinking across multiple files

The project intentionally avoids heavy frameworks, coordinate math, and unnecessary rendering complexity. The abstraction layer allows students to work with real architectural patterns while maintaining clarity and accessibility.

The hub is not just an interface builder. It is a structured programming environment for practicing core JavaScript concepts through modular, meaningful interactive systems.