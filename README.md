# ColorKey

**ColorKey** is a browser extension I built to make colour-based charts easier to understand for people with **colour vision deficiency**.

A lot of charts use colour as the main way to separate different lines, bars, or sections. This can be difficult for colour-blind users, especially when the colours are very similar.

ColorKey keeps the original colours, but adds **extra visual cues such as different line styles and patterns** so the chart does not depend on colour alone.

Built for **GatewayHacks 2026 — Accessibility & Health**.

## Why I Made It

I wanted to solve a simple accessibility problem: **charts often assume that everyone can easily tell colours apart.**

For example, two lines in a graph may look completely different to one person but almost identical to someone with colour vision deficiency.

Instead of removing colour, ColorKey adds **another way to tell the data apart**.

## My Solution

When ColorKey is enabled, it scans **SVG elements** on a webpage and looks for coloured paths and shapes that may be part of a chart.

It can then add things like:

- **Dashed or dotted line styles**
- **Striped or patterned fills**
- Other **non-colour visual differences**

The main idea is to keep the chart looking familiar while making the important parts easier to distinguish.

## Features

- Runs directly in the browser
- Automatically scans **SVG-based visual content**
- Keeps the **original colours**
- Adds **non-colour visual cues**
- Does not require changes to the original website
- Lightweight and simple to test

## How It Works

1. The extension loads its content script on the webpage.
2. It scans the **SVG elements** on the page.
3. It checks coloured paths and shapes.
4. Matching elements are given different **patterns or line styles**.
5. The original chart is still visible, but **colour is no longer the only cue**.

## Installation

To test ColorKey locally in Chrome:

1. Clone or download this repository.
2. Open `chrome://extensions/`.
3. Turn on **Developer mode**.
4. Click **Load unpacked**.
5. Select the ColorKey project folder.
6. Open a webpage with SVG-based charts or use the included test page.

## Project Files

```text
ColorKey/
├── manifest.json
├── content.js
├── test.html
└── README.md