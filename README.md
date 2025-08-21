
---
## 🌳 TreePaper

**TreePaper** is a lightweight VS Code-style web application that helps users manage academic papers, navigate their structure, and receive AI-powered feedback. It supports full editing, file management, undo/redo history, and dynamic AI suggestions.

<img width="1919" height="1077" alt="image" src="https://github.com/user-attachments/assets/9fef45ec-bf54-4d40-83d2-40ed4467fe64" />

<img width="1919" height="1076" alt="image" src="https://github.com/user-attachments/assets/b765a7ab-85b4-4573-9014-676c637f8f13" />

---

### ✨ Features

#### ✅ 1. File Upload & Management

* 📁 Upload `.txt`, `.md`, or `.json` files (including tree-structured `.tree.json`).
* 📂 Sidebar displays uploaded files.
* 📄 Click a file to view and edit its contents in the center panel.

#### ✅ 2. Structured Content Navigation

* 🧭 Auto-generated **Contents panel** based on section headers.
* Clickable navigation to jump to each section of the paper.
* Tree structure (`tree.json`) is automatically detected and used for logic-based analysis.

#### ✅ 3. Rich Text Viewer & Editor

* 📝 Edit content inline in the main viewer.
* ⏎ Paragraph-aware rendering with `<p>` blocks and dynamic update.
* 🖋️ Auto sync with internal state (`setText`) for clean paragraph management.

#### ✅ 4. AI-Powered Features

* 💬 **AI Chat Assistant** on the right panel for smart interactions (in progress).
* ✨ `Modify Suggestion` button (top-right) triggers LLM-based suggestions (WIP).
* 📤 `Download Current File` to export current text as `.txt`.

#### ✅ 5. Edit History (Undo / Redo)

* ↩️ `Undo` and ↪️ `Redo` buttons under Contents panel.
* Each edit action is pushed into a stack for precise undo/redo operations.

#### ✅ 6. Real-Time State Synchronization

* 🧠 Internal sync between DOM `<div contentEditable>` and state using robust paragraph parsing.
* Fixes layout issues from innerText flattening by preserving `<p>` blocks.

#### ✅ 7. Clean, Intuitive UI

* 🖥️ Three-panel layout:

  * **Left**: File Sidebar & Tree View
  * **Center**: Viewer / Editor with Save + Undo/Redo
  * **Right**: AI Chat (optional)
* ⚙️ Consistent styling using TailwindCSS + minimalistic spacing

---

## 📦 Tech Stack

| Layer        | Technology         |
| ------------ | ------------------ |
| **Frontend** | React + TypeScript |
| **Styling**  | TailwindCSS        |
| **Routing**  | React Router DOM   |
| **Bundler**  | Vite               |

---

## 🚀 How to Run Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open your browser at
http://localhost:5173/
```

---

## 🔜 Planned Features

* ✅ Paragraph-level AI revision suggestions
* ✅ Section-level Tree structure evaluation
* 🔲 AI chat-driven paper editing (right panel)
* 🔲 Tree-based agent analysis for logical errors
* 🔲 Markdown / PDF export

---

## 🙌 Credits

Made with 💡 by AI-assisted paper tools team.

---

필요하시면 **한국어 버전 README**도 제공 가능합니다.
추가적으로 Figma, Prompt 방식 등 정리해 GitHub용 README로 확장도 가능합니다!
좋습니다! 첨부된 최신 구현 화면을 반영하여, `TreePaper`의 기능을 **최신 상태**로 반영한 완성형 `README.md`를 아래에 제공합니다.

---

## 🌳 TreePaper

**TreePaper** is a lightweight VS Code-style web application that helps users manage academic papers, navigate their structure, and receive AI-powered feedback. It supports full editing, file management, undo/redo history, and dynamic AI suggestions.

---

### ✨ Features

#### ✅ 1. File Upload & Management

* 📁 Upload `.txt`, `.md`, or `.json` files (including tree-structured `.tree.json`).
* 📂 Sidebar displays uploaded files.
* 📄 Click a file to view and edit its contents in the center panel.

#### ✅ 2. Structured Content Navigation

* 🧭 Auto-generated **Contents panel** based on section headers.
* Clickable navigation to jump to each section of the paper.
* Tree structure (`tree.json`) is automatically detected and used for logic-based analysis.

#### ✅ 3. Rich Text Viewer & Editor

* 📝 Edit content inline in the main viewer.
* ⏎ Paragraph-aware rendering with `<p>` blocks and dynamic update.
* 🖋️ Auto sync with internal state (`setText`) for clean paragraph management.

#### ✅ 4. AI-Powered Features

* 💬 **AI Chat Assistant** on the right panel for smart interactions (in progress).
* ✨ `Modify Suggestion` button (top-right) triggers LLM-based suggestions (WIP).
* 📤 `Download Current File` to export current text as `.txt`.

#### ✅ 5. Edit History (Undo / Redo)

* ↩️ `Undo` and ↪️ `Redo` buttons under Contents panel.
* Each edit action is pushed into a stack for precise undo/redo operations.

#### ✅ 6. Real-Time State Synchronization

* 🧠 Internal sync between DOM `<div contentEditable>` and state using robust paragraph parsing.
* Fixes layout issues from innerText flattening by preserving `<p>` blocks.

#### ✅ 7. Clean, Intuitive UI

* 🖥️ Three-panel layout:

  * **Left**: File Sidebar & Tree View
  * **Center**: Viewer / Editor with Save + Undo/Redo
  * **Right**: AI Chat (optional)
* ⚙️ Consistent styling using TailwindCSS + minimalistic spacing

---

## 📸 Screenshot

![TreePaper Screenshot](https://github.com/user-attachments/assets/560671fd-07d2-4cce-bc59-cc1ada5d1a8a)

---

## 📦 Tech Stack

| Layer        | Technology         |
| ------------ | ------------------ |
| **Frontend** | React + TypeScript |
| **Styling**  | TailwindCSS        |
| **Routing**  | React Router DOM   |
| **Bundler**  | Vite               |

---

## 🚀 How to Run Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open your browser at
http://localhost:5173/
```
