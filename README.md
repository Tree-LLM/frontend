# 🌳 TreePaper

**TreePaper** is a lightweight web-based interface that enables users to upload academic papers, view content, and receive AI-powered revision suggestions — all in a clean, intuitive layout inspired by VS Code.

## ✨ Features

### ✅ Current Features

* 📁 **File Upload & Management**
  Upload `.txt` files and manage them via a sidebar. Selected file content is shown in the main editor view.

* 📄 **In-Browser Text Viewer**
  View academic papers directly in the browser with styled formatting. Scroll through and read the full paper on the center panel.

* 🤖 **AI Modification Suggestion**
  A `Modify Suggestion` button triggers AI-based structural and linguistic revision suggestions (functionality placeholder: alert for now).

* 📥 **Download Current File**
  Download the currently selected paper with the `Download Current File` button.

* 🧠 **Clean UI Layout**
  Uses a three-panel layout:

  * **Left**: File upload and list
  * **Center**: Paper viewer
  * **Right**: Placeholder for AI chat suggestions

* 🖼️ **Branding**
  Custom header with a `TreePaper` logo and name.

## 📦 Tech Stack

* **Frontend**: React + TypeScript
* **Styling**: TailwindCSS
* **Bundler**: Vite
* **Routing**: React Router DOM

## 🚀 How to Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Then visit: [http://localhost:5173](http://localhost:5173)
