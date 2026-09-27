# SmartPrep

A full-stack web application designed for comprehensive interview preparation and question bank management.

## Features

- **Interview Question Bank**: Access, manage, and search curated interview questions.
- **Admin Dashboard**: Interview bank administration and content management.
- **Search History & Analytics**: Track user activity and search trends.
- **Automated Web Scrapers**: Automated scrapers and schedulers to gather fresh interview questions.
- **Real-Time Communication**: Integrated with Socket.io for live updates.
- **Secure Authentication & Sessions**: Built with Express Session, MongoDB store, CSRF protection, and JWT/Bcrypt security.

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **View Engine**: EJS
- **Frontend & Styling**: Bootstrap 5, Vanilla CSS / JS
- **Realtime**: Socket.IO
- **Scraping**: Puppeteer, Cheerio, Axios

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or newer recommended)
- [MongoDB](https://www.mongodb.com/) running locally or a MongoDB Atlas URI

### Installation

1. Clone the repository:
   ```bash
   git clone <YOUR_REPOSITORY_URL>
   cd SmartPrep
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Create a `.env` file in the root folder based on `.env.example`:
     ```env
     PORT=5000
     MONGO_URI=mongodb://127.0.0.1:27017/SmartPrepManagerDB
     SESSION_SECRET=your_secret_key_here
     ```

4. Start the application:
   ```bash
   # Development mode with Nodemon
   npm run dev

   # Or standard start
   node server.js
   ```

5. Open your browser and navigate to `http://localhost:5000`.
