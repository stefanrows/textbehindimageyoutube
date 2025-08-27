# Text Behind Image Creator

A powerful web application for creating stunning YouTube thumbnails with text-behind-image effects. Upload any image, automatically remove the background, and place text behind your subject for professional-looking thumbnails.

![Text Behind Image Effect Example](./docs/example-thumbnail.jpg)

## ✨ Features

- 🖼️ **Smart Background Removal**: Automatically remove backgrounds from uploaded images
- 📝 **Text Behind Subject**: Create professional text-behind-image effects
- 🎨 **Rich Text Editing**: Customize fonts, colors, sizes, outlines, and opacity
- 📱 **Intuitive Interface**: Drag-and-drop positioning with click-to-place mode
- 🎬 **YouTube Optimized**: Export in perfect YouTube thumbnail dimensions (1280×720)
- 📐 **Layer Management**: Visual layer system with smart interaction controls
- ↩️ **Undo/Redo Support**: Full history with keyboard shortcuts (Ctrl+Z/Ctrl+Y)
- 💾 **Multiple Export Formats**: PNG, JPEG, and WebP support
- 🔄 **Auto-Scaling**: Intelligent text sizing based on subject size

## 📋 Prerequisites

Before installing, you'll need Node.js on your computer. If you don't have it installed:

### Installing Node.js (Required)

#### Windows:
1. Go to [nodejs.org](https://nodejs.org/)
2. Download the "LTS" version (recommended for most users)
3. Run the downloaded `.msi` file
4. Follow the installation wizard (accept all default options)
5. Restart your computer after installation

#### Mac:
1. Go to [nodejs.org](https://nodejs.org/)
2. Download the "LTS" version (recommended for most users)
3. Run the downloaded `.pkg` file
4. Follow the installation wizard (accept all default options)
5. Restart your computer after installation

#### Verify Installation:
Open Terminal (Mac) or Command Prompt (Windows) and type:
```bash
node --version
npm --version
```
You should see version numbers for both commands.

## 🚀 Installation

### Option 1: Using npm (comes with Node.js)

#### Windows:
1. Open Command Prompt or PowerShell as Administrator
2. Navigate to where you want to install the project:
   ```bash
   cd C:\Users\YourUsername\Desktop
   ```
3. Clone or download the project files
4. Navigate into the project folder:
   ```bash
   cd textbehindimageyoutube
   ```
5. Install dependencies:
   ```bash
   npm install
   ```
6. Start the application:
   ```bash
   npm run dev
   ```

#### Mac:
1. Open Terminal (press Cmd+Space, type "Terminal", press Enter)
2. Navigate to where you want to install the project:
   ```bash
   cd ~/Desktop
   ```
3. Clone or download the project files
4. Navigate into the project folder:
   ```bash
   cd textbehindimageyoutube
   ```
5. Install dependencies:
   ```bash
   npm install
   ```
6. Start the application:
   ```bash
   npm run dev
   ```

### Option 2: Using pnpm (faster alternative)

First, install pnpm:
```bash
npm install -g pnpm
```

Then follow the same steps as above, but replace `npm` with `pnpm`:
```bash
pnpm install
pnpm run dev
```

## 🎯 How to Use the Application

### Step 1: Launch the Application
After running `npm run dev` (or `pnpm run dev`), you'll see something like:
```
Local:   http://localhost:5173/
Network: http://192.168.1.100:5173/
```

Open your web browser and go to `http://localhost:5173/`

### Step 2: Upload Your Image
1. Click on the "Upload Image" section
2. Click "Choose file" and select your image (JPG, PNG, or GIF)
3. Your image will appear on the canvas

### Step 3: Remove Background (Optional but Recommended)
1. After uploading an image, click the "Remove Background" button
2. Wait for the AI to process your image (this may take a few seconds)
3. Once complete, you'll see a preview showing:
   - **Original Image**: Used as the background layer
   - **Subject**: Your subject with transparent background (top layer)

### Step 4: Add Your Text
1. In the "Text Settings" section, enter your desired text
2. Customize your text:
   - **Font**: Choose from 9 available fonts
   - **Size**: Adjust with the slider (20-100px)
   - **Color**: Click the color picker to choose text color
   - **Outline**: Set outline color and width for better visibility
   - **Opacity**: Make text semi-transparent if needed
   - **Position**: Use X/Y controls or "Click to Place" mode

3. Click "Add Text Behind Subject" (if background was removed) or "Add Text to Canvas"

### Step 5: Fine-tune Your Design
- **Drag Elements**: Click and drag text or images to reposition them
- **Layer Management**: Use the Layers panel to:
  - Select different elements
  - Reorder layers with up/down arrows
  - Delete unwanted elements
- **Undo/Redo**: Use Ctrl+Z/Ctrl+Y or the undo/redo buttons

### Step 6: Export Your Thumbnail
1. In the "Export & Actions" section:
   - Choose your format (PNG recommended for thumbnails)
   - Adjust quality if needed (100% recommended)
2. Click "Export YouTube Thumbnail (1280×720)" for YouTube-optimized thumbnails
3. Or click "Export Full Canvas" to export the entire workspace
4. Your file will be automatically downloaded

## 🎨 Advanced Features

### Layer System
The application uses an intelligent layer system:
- **Background + Subject Group**: Moves as one unit for easy positioning
- **Text Layers**: Move independently behind the subject
- **Visual Effect Layers**: Automatic text-behind-image layering

### Keyboard Shortcuts
- **Ctrl+Z** (Cmd+Z on Mac): Undo last action
- **Ctrl+Y** or **Ctrl+Shift+Z** (Cmd+Y or Cmd+Shift+Z on Mac): Redo last action

### Text Positioning
- **Manual Input**: Enter exact X/Y coordinates
- **Click to Place**: Click anywhere on the canvas to position text
- **Drag and Drop**: Click and drag text elements directly
- **Auto-Scale**: Automatically adjusts text size based on subject size

### Export Options
- **YouTube Thumbnail**: Perfect 1280×720 dimensions for YouTube
- **Full Canvas**: Export the entire 960×540 workspace
- **Multiple Formats**: PNG (best quality), JPEG (smaller files), WebP (modern format)
- **Quality Control**: Adjust compression from 10% to 100%

## 🛠️ Troubleshooting

### Common Issues:

**Application won't start:**
- Make sure Node.js is installed: `node --version`
- Try deleting `node_modules` folder and running `npm install` again
- Check if port 5173 is available (close other development servers)

**Background removal not working:**
- Make sure you have a stable internet connection
- Try with a different image (clear subject works best)
- Supported formats: JPG, PNG, GIF

**Text not appearing:**
- Make sure text content is not empty
- Check if text color matches background (try white text with black outline)
- Verify text opacity is above 0%

**Export not working:**
- Make sure you have uploaded an image first
- Check if your browser allows downloads from this site
- Try a different export format

**Performance issues:**
- Use smaller images (under 5MB recommended)
- Close other browser tabs to free up memory
- Try refreshing the page and starting over

### Browser Compatibility:
- **Recommended**: Chrome, Firefox, Safari, Edge (latest versions)
- **Minimum**: Any browser with ES6 support and HTML5 canvas
- **Note**: Internet Explorer is not supported

### File Size Recommendations:
- **Images**: Under 5MB for best performance
- **Dimensions**: Any size (automatically scaled to fit canvas)
- **Formats**: JPG, PNG, GIF supported for upload

## 🔧 Development Commands

For developers working on the project:

```bash
npm run dev      # Start development server with hot reload
npm run build    # Build production version
npm run lint     # Run ESLint code linting
npm run preview  # Preview production build locally
```

## 📁 Project Structure

```
textbehindimageyoutube/
├── src/
│   ├── components/         # React components
│   │   ├── FabricCanvas.jsx   # Main canvas component
│   │   └── ui/               # UI components
│   ├── hooks/              # Custom React hooks
│   ├── lib/               # Utility functions
│   └── App.jsx           # Main application component
├── public/               # Static assets
├── package.json         # Project dependencies
└── vite.config.js      # Vite build configuration
```

## 🚀 Technology Stack

- **React 19**: Modern React with latest features
- **Vite 7**: Fast build tool and development server
- **Fabric.js**: Powerful HTML5 canvas library
- **Tailwind CSS**: Utility-first CSS framework
- **AI Background Removal**: Automated background removal service

## 📝 License

This project is private and proprietary.

## 🤝 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Make sure all prerequisites are installed correctly
3. Try restarting your computer and the application
4. Contact support with detailed error messages and screenshots

---

**Enjoy creating amazing YouTube thumbnails! 🎬✨**