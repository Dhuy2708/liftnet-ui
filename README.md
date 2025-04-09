<h1 align="center">
  <a href="#"> LIFT NET </a>
</h1>

<h3 align="center">A fitness social network platform built with React and Shadcn UI</h3>

<p align="center">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-brightgreen">
</p>

<h4 align="center"> 
	Status: In Development
</h4>

<p align="center">
 <a href="#about">About</a> •
 <a href="#features">Features</a> •
 <a href="#how-it-works">How it works</a> • 
 <a href="#tech-stack">Tech Stack</a> •
 <a href="#deployment">Deployment</a>
</p>

## About

LiftNet is a social networking platform designed for fitness enthusiasts, personal trainers, and anyone interested in health and wellness. The platform allows users to connect, share workouts, track progress, and receive guidance from certified personal trainers.

---

## Features

- [x] User authentication (login/register)
- [x] Role-based access (User/Personal Trainer)
- [x] Profile management with location details
- [ ] Social feed and interactions
- [ ] Workout tracking and sharing
- [ ] Trainer-client connections
- [ ] Progress tracking

---

## How it works

The project is divided into two parts:

1. Backend (REST API built with .NET)
2. Frontend (React application with Vite)

This repository contains the frontend part of the application.

### Pre-requisites

Before you begin, you will need to have the following tools installed on your machine:
[Git](https://git-scm.com), [Node.js](https://nodejs.org/en/), [Yarn](https://yarnpkg.com/)
In addition, it is good to have an editor to work with the code like [VSCode](https://code.visualstudio.com/)

#### Running the web application (Frontend)

```bash
# Clone this repository
$ git clone <your-repo-url>

# Access the project folder in your terminal
$ cd liftnet-ui

# Install the dependencies
$ yarn

# Run the application in development mode
$ yarn dev

# The application will open on port 5173 - go to http://localhost:5173
```

#### Building and Running with Docker

```bash
# Build the Docker image
$ docker build -t liftnet-ui .

# Run the container
$ docker run -p 8081:8081 liftnet-ui
```

---

## Tech Stack

The following tools were used in the construction of the project:

#### **Frontend** ([React](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/))

- **[React Router Dom](https://reactrouter.com/)**
- **[React Hook Form](https://react-hook-form.com/)**
- **[Zod](https://zod.dev/)** - Schema validation
- **[Zustand](https://zustand-demo.pmnd.rs/)** - State management
- **[Shadcn UI](https://ui.shadcn.com/)** - UI component library
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Lucide React](https://lucide.dev/)** - Icon library
- **[React Toastify](https://fkhadra.github.io/react-toastify/)** - Toast notifications
- **[Framer Motion](https://www.framer.com/motion/)** - Animations

> See the file [package.json](package.json) for all dependencies

---

## Deployment

The application can be deployed using Docker:

1. Build the Docker image: `docker build -t liftnet-ui .`
2. Run the container: `docker run -p 8081:8081 liftnet-ui`
3. Access the application at http://localhost:8081

For production deployments, consider using environment variables for configuration.

---

## License

This project is under the MIT license.

---

## Learn More

To learn more about the technologies used in this project:

- [React Documentation](https://reactjs.org/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Vite Documentation](https://vitejs.dev/guide/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Shadcn UI Documentation](https://ui.shadcn.com/docs)