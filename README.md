# Lumina Quotes

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=flat&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)

**Lumina Quotes** is a premium, AI-powered quote image generator designed for social media content creators, influencers, and brands. Create stunning, high-resolution quote cards in bulk with minimal effort.

## ✨ Features

- **Bulk Creation**: Generate dozens of quotes at once. Paste your list or let AI generate them for you.
- **Premium Typography**: Curated selection of high-end fonts (Serif, Sans, Luxury, Modern, Display).
- **Minimal Aesthetics**: 6 professionally designed themes (Dark, Light, Nature, Abstract, Minimal, Luxury).
- **AI Integration**: Powered by Google Gemini to generate inspiring, relevant quotes on demand.
- **Social Media Ready**:
  - **1:1 Square** (Instagram Posts)
  - **4:5 Portrait** (Instagram/Facebook Feed)
  - **9:16 Vertical** (Stories/Reels/TikTok)
- **4K Quality Export**: Download crystal-clear images (up to 2160px width) individually or as a ZIP archive.
- **Smart Backgrounds**: Automatically fetches high-quality, thematic background images.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Google Gemini API Key (for AI generation features)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/lumina-quotes.git
    cd lumina-quotes
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment**
    Create a `.env` file in the root directory and add your Gemini API key:
    ```env
    GEMINI_API_KEY=your_api_key_here
    ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, Motion (Framer Motion)
- **AI**: Google Gemini API (`@google/genai`)
- **Image Processing**: `html-to-image`, `jszip`, `file-saver`
- **Icons**: Lucide React

## 💎 Commercial Use

This project is released under the MIT License, making it free for both personal and commercial use. You can:
- Use it to generate content for your own social media channels.
- Use it to generate content for clients.
- Modify the code to build your own SaaS product.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

*Built with ❤️ by the Lumina Team*
