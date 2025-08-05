# Reactron

Authored and maintained by [annuraggg](https://github.com/annuraggg).

## Overview

Reactron is an open-source Windows-like desktop environment clone built for the web with React. It emulates a classic desktop experience, running entirely in your browser, and includes a suite of interactive apps for productivity and fun.

## Features

- **Multi-window desktop UI**: Drag, resize, and manage multiple app windows just like a classic operating system.
- **Basic Browser**: Surf the web within the Reactron environment.
- **File Explorer**: Browse and manage virtual files and folders.
- **Media Support**: Play videos and view images directly in dedicated apps.
- **Document Viewer**: Open and read common document formats.
- **Notepad**: Edit and save text files.
- **DOOM**: Play the legendary game DOOM inside Reactron (in a fun and humorous implementation), leveraging WebAssembly for efficient in-browser execution.

## Technical Details

Reactron is built with modern React and TypeScript, utilizing a modular architecture for easy extension and maintenance. Each app is an isolated component, and the window manager ensures smooth multi-tasking and realistic desktop interactions.  
Certain apps, such as DOOM, are powered by WebAssembly to provide native-like performance for demanding experiences directly in the browser.

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/annuraggg/Reactron.git
   ```
2. **Install dependencies**
   ```bash
   cd Reactron
   npm install
   ```
3. **Start the development server**
   ```bash
   npm start
   ```
4. Visit `http://localhost:3000` in your browser to experience Reactron.


Made with ❤️ by [annuraggg](https://github.com/annuraggg)
