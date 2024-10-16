# ElanePark

## Development Environment Setup Guide

This guide will help you set up your development environment to build and run an Android app using React Native with Expo. Follow these steps to get started:

### 1. Install Visual Studio Code (VSCode)

VSCode is a lightweight but powerful source code editor.

1. Download VSCode from: https://code.visualstudio.com/download
2. Run the installer and follow the installation wizard.

### 2. Install Node.js and npm

Node.js is required to run JavaScript on your computer, and npm (Node Package Manager) is used to install dependencies.

1. Download Node.js from: https://nodejs.org/en/download/
2. Run the installer and follow the installation wizard.
3. Verify the installation by opening a terminal and running:
   ```
   node --version
   npm --version
   ```

### 3. Install Expo CLI

Expo is a framework and platform for universal React applications.

1. Open a terminal and run:
   ```
   npm install -g expo-cli
   ```
2. Verify the installation by running:
   ```
   expo --version
   ```

### 4. Install Android Studio

Android Studio provides the Android SDK and emulator needed for Android app development.

1. Download Android Studio from: https://developer.android.com/studio
2. Run the installer and follow the installation wizard.
3. During installation, make sure to select:
   - Android SDK
   - Android SDK Platform
   - Android Virtual Device (AVD)

### 5. Set up Android SDK

1. Open Android Studio.
2. Go to Tools > SDK Manager.
3. In the SDK Platforms tab, select the latest Android version.
4. In the SDK Tools tab, select:
   - Android SDK Build-Tools
   - Android Emulator
   - Android SDK Platform-Tools
5. Click "Apply" to install the selected components.

### 6. Set up Android Emulator

1. In Android Studio, go to Tools > AVD Manager.
2. Click "Create Virtual Device".
3. Select a device definition (e.g., Pixel 4) and click "Next".
4. Select a system image (e.g., the latest release) and click "Next".
5. Name your AVD and click "Finish".

### 7. Install Git

Git is a version control system that helps you manage your code.

1. Download Git from: https://git-scm.com/downloads
2. Run the installer and follow the installation wizard.
3. Verify the installation by opening a terminal and running:
   ```
   git --version
   ```

### 8. Clone the Project Repository

1. Open a terminal and navigate to your desired project directory.
2. Run the following command to clone the repository:
   ```
   git clone https://github.com/NeilBvungidzire/ElanePark.git
   ```

### 9. Install Project Dependencies

1. Navigate to the project directory:
   ```
   cd ElanePark
   ```
2. Install the project dependencies:
   ```
   npm install
   ```

### 10. Run the App

1. Start the development server:
   ```
   expo start
   ```
2. Press 'a' in the terminal to run the app on the Android emulator.

Congratulations! You've now set up your development environment and can start working on the ElanePark Android app.
