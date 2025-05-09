# Interactive Portfolio

A modern, interactive portfolio website built with React, TypeScript, and Supabase, featuring GitHub integration, blog functionality, and a clean, responsive design.

## Website Screenshots


![Sanat-s-Portfolio](https://github.com/user-attachments/assets/34edf5e8-a7f0-44f3-8679-fa08eaeaae1d)

![Sanat-s-Portfolio (1)](https://github.com/user-attachments/assets/4bf2dc5f-58df-4271-9c1d-cf7428aea3ba)


## Features

- **Interactive UI**: Smooth animations and transitions using Framer Motion
- **Responsive Design**: Works perfectly on all devices
- **Dark/Light Mode**: Automatic theme switching based on system preferences
- **Blog System**: Create, edit, and publish blog posts
- **GitHub Integration**: Automatically fetches and displays your GitHub projects
- **Contact Form**: Integrated contact form with email notifications
- **Skills & Certifications**: Showcase your skills and professional certifications
- **Admin Dashboard**: Secure admin panel for content management
- **Mobile-Friendly**: Optimized for mobile devices

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **State Management**: React Context API
- **Animations**: Framer Motion
- **Backend**: Supabase (PostgreSQL + Authentication)
- **Markdown**: React Markdown with GFM support
- **Editor**: TinyMCE for rich text editing
- **Authentication**: Supabase Auth
- **API**: GitHub API for project integration

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account
- GitHub account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/interactive-portfolio.git
cd interactive-portfolio
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory with the following variables:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GITHUB_CLIENT_ID=your_github_client_id
VITE_TINYMCE_API_KEY=your_tinymce_api_key
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

## Project Structure

```
src/
├── components/           # Reusable UI components
├── context/             # React context providers
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
└── styles/            # Global styles
```

## Features Overview

### GitHub Integration
- Automatically fetches repositories from your GitHub account
- Displays project details including stars, forks, and topics
- Includes README content and project links
- Responsive project cards with hover effects

### Blog System
- Create and manage blog posts
- Rich text editing with TinyMCE
- Markdown support for content
- Image upload and management
- Public/private post control

### Admin Dashboard
- Secure content management
- Project management
- Blog post management
- Contact message management
- User authentication

### Skills & Certifications
- Interactive skill bubbles
- Certification display
- Experience timeline
- Technology showcase

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.