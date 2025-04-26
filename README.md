# ExecHub

<div align="center">
  <!-- Replace with your logo when you have one -->
  <!-- <img src="docs/assets/logo.png" alt="ExecHub Logo" width="200" /> -->
  <h3>Application Profile Manager for Windows</h3>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
</div>

ExecHub is a lightweight desktop application that allows you to create profiles for launching and closing multiple applications together. It's particularly useful for simulation environments like iRacing where you need to run several applications simultaneously.

## ✨ Features

- **Profile Management**: Create custom profiles with descriptive names (e.g., "iRacing", "Work Environment").
- **Application Management**: Add multiple applications to each profile.
- **One-Click Launch**: Start all applications associated with a profile with a single click.
- **Joint Closure**: Easily close all applications associated with a profile.
- **Automatic Updates**: Get notified and seamlessly update to the latest version.
- **Intuitive Interface**: Simple and easy-to-use user interface.
- **Low Resource Consumption**: Designed to be lightweight and consume minimal system resources.

## 📥 Installation

### From Releases

1. Download the latest version from the [releases](https://github.com/emilioh93/ExecHub/releases) section.
2. Run the installer and follow the instructions.
3. Launch ExecHub from the Start menu or desktop shortcut.

### From Source

```bash
# Clone the repository
git clone https://github.com/emilioh93/ExecHub.git

# Navigate into project directory
cd ExecHub

# Install dependencies
npm install

# Start the application
npm start
```

## 🚀 Usage

1. **Create a Profile**:
   - Click "New Profile"
   - Assign a name to the profile
   - Add the applications you want to include in the profile

2. **Launch a Profile**:
   - Select the profile from the side list
   - Click "Launch Profile"

3. **Stop a Profile**:
   - Select the running profile
   - Click "Stop Profile"

4. **Check for Updates**:
   - Click "Settings" in the sidebar
   - Click "Check for Updates"
   - If an update is available, download and install it

## 🔄 Updates

ExecHub includes an automatic update system that:

1. Periodically checks for new versions
2. Notifies you when an update is available
3. Allows you to download and install updates with one click

## 🛠️ Development

### Requirements

- Node.js 16.0 or higher
- npm 8.0 or higher

### Development Commands

```bash
# Run in development mode
npm start

# Build the application for distribution
npm run build
```

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📫 Contact

If you have questions or suggestions, please open an issue in the repository.

---

<div align="center">
  Built with ❤️ for the simulation community.
</div> 