# Cyber Drift
## AAA Frontend Portfolio Project

---

# Overview

Cyber Drift is a modern AAA-style cyberpunk racing game built entirely on the frontend.

The game focuses on smooth gameplay, beautiful visuals, realistic drifting, and replayability.

Everything runs inside the browser.

No backend.

Leaderboard is stored locally.

---

# Tech Stack

## Core

- React 19
- Vite
- TypeScript

## 3D

- Three.js
- React Three Fiber
- Drei

## Animation

- GSAP
- React Spring

## Physics

- Rapier Physics

## Styling

- TailwindCSS

## State Management

- Zustand

## Audio

- Howler.js

## Utilities

- React Router
- Vite PWA
- ESLint
- Prettier

---

# Project Goals

The game should feel like a premium indie racing game.

Everything should be polished.

Animations should be smooth.

The UI should be modern.

Performance should stay above 60 FPS on average hardware.

---

# Folder Structure

src/

    components/
    game/
        world/
        player/
        ai/
        physics/
        effects/
        audio/
        camera/
        ui/
        hooks/
        systems/
        shaders/
        assets/
    pages/
    store/
    utils/

---

# Game Loop

Initialize

↓

Load Assets

↓

Main Menu

↓

Car Selection

↓

Race

↓

Results

↓

Save Progress

↓

Play Again

---

# Main Features

## Driving

- Arcade controls
- Smooth steering
- Drifting
- Nitro
- Handbrake
- Camera shake
- Wheel rotation
- Suspension movement

---

## Drift System

When player drifts

Calculate

- Angle
- Speed
- Drift multiplier

Award

- Points
- Nitro recharge

Spawn

- Tire smoke
- Sparks
- Skid marks

Play

- Tire sounds

---

## Nitro

Hold Shift

Increase

- Speed
- Camera FOV
- Motion blur
- Bloom

Decrease nitro

Recharge by

- Drifting
- Collectables

---

## AI Cars

Different personalities

Easy

Normal

Hard

Professional

Behaviors

- Overtake
- Block
- Recover
- Avoid collisions
- Random mistakes

---

## Dynamic Weather

Sunny

Rain

Storm

Fog

Night

Weather affects

Grip

Visibility

Reflections

Particles

Lighting

---

## Day / Night Cycle

Morning

Sunset

Night

Neon lights become brighter

Buildings change lighting

Sky updates

Street lights turn on automatically

---

## City

Large Cyberpunk City

Districts

Downtown

Industrial

Highway

Bridge

Underground Tunnel

Neon Market

Airport

---

## Traffic

Civilian vehicles

Random lanes

Random speeds

Emergency vehicles

Construction zones

---

## Collectables

Nitro

Coins

Repair

Temporary Shield

Double Score

---

## Progression

Unlock new

Cars

Paints

Wheels

Nitro effects

Trails

HUD themes

---

## Cars

Starter

Sport

Supercar

Hypercar

Electric

Cyber Prototype

Every car has

Top Speed

Acceleration

Grip

Handling

Nitro Capacity

Weight

---

## Customization

Paint

Glow Color

Wheel Color

Window Tint

Underglow

Spoiler

Neon

License Plate

---

## Visual Effects

Bloom

Motion Blur

Depth of Field

SSAO

Fog

Rain

Lens Flare

Glow

Screen Shake

Camera Roll

Chromatic Aberration

Speed Lines

Heat Distortion

Particle Systems

---

## Particles

Rain

Smoke

Fire

Dust

Nitro Flames

Sparks

Explosions

Leaves

Fog

---

## Sound

Engine

Turbo

Nitro

Rain

Skid

Collision

Menu

Music

Ambient City

---

## Camera Modes

Third Person

Close Chase

Far Chase

Hood Camera

Free Camera

Cinematic Camera

---

## HUD

Speedometer

RPM

Mini Map

Lap

Position

Nitro

Drift Combo

FPS Counter

Timer

Leaderboard

---

## Menus

Splash Screen

Loading Screen

Main Menu

Settings

Graphics

Controls

Garage

Pause

Game Over

Results

Credits

---

# Leaderboard

Store locally

Player Name

Score

Fastest Lap

Longest Drift

Highest Speed

Date

Top 20 scores

---

# Save System

localStorage

Save

Unlocked Cars

Settings

Leaderboard

Best Drift

Best Time

Graphics Settings

Control Settings

---

# Controls

W

Accelerate

S

Brake

A/D

Steering

Space

Handbrake

Shift

Nitro

C

Camera

Esc

Pause

---

# Performance

Lazy load assets

Reuse materials

Reuse geometries

Frustum culling

Texture compression

LOD

Object pooling

Particle optimization

Instanced Meshes

Target

60 FPS+

---

# Stretch Goals

Online Multiplayer

Ghost Replay

Track Editor

Photo Mode

Replay System

VR Support

Mobile Support

Gamepad Support

Achievements

Steam-like Statistics

---

# Polish Checklist

- AAA animations
- Responsive UI
- Smooth transitions
- Modern loading screen
- Audio feedback
- Screen effects
- Responsive controls
- No frame drops
- Clean code
- Modular architecture

---

# Future Version 2

Open World

Police Chase

Story Mode

Garage

NPCs

Fuel

Damage System

Car Upgrades

Mission System

Boss Races
