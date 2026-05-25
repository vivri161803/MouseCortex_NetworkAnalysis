# Tech Stack

## Core Paradigms
- **Component-Based Architecture**: Modular UI with Astro and React.
- **Declarative Programming**: UI state is declarative.
- **Static Site Generation (SSG)**: Pre-rendering for maximum performance. JavaScript is loaded strictly only for the React Three Fiber island (`client:only="react"`).

## Technologies
- **Framework**: [Astro](https://astro.build/) (Static Site Generation, Routing, Layouts)
- **3D Rendering**: [React](https://reactjs.org/) + [React Three Fiber (R3F)](https://docs.pmnd.rs/react-three-fiber/) + `@react-three/drei`
- **Animations**: [GSAP (GreenSock Animation Platform)](https://greensock.com/gsap/) with `ScrollTrigger`
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: Browser Native Custom Events (simplest approach for Astro to React communication)
- **Deployment**: [Vercel](https://vercel.com/)
- **Data Processing**: Custom script (Node/Python) to process `.graphml`, `.csv`, and `.pdf` files into JSON and web assets.
