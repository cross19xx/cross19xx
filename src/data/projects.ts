export type ProjectStatus = 'In Progress' | 'Shipped' | 'Concept';

export interface Project {
  name: string;
  link: string;
  status: ProjectStatus;
  summary: string;
  details: string[];
  techStack: string[];
  featured: boolean; // Flag to indicated if the project is featured on the homepage
}

export const projects: Project[] = [
  {
    name: 'Kitchen',
    link: 'https://www.github.com/cross19xx/Kitchen-Android',
    status: 'In Progress',
    summary:
      'A collection of throwaway projects tackling complex topics in Native Android, Native iOS, and React Native',
    details: [
      'An ever-expanding collection of projects to ensure that I stay sharp on the latest and greatest in mobile development.',
    ],
    techStack: ['Kotlin', 'Swift', 'React Native'],
    featured: true,
  },
  {
    name: 'Celia',
    link: 'https://www.kwakye-gyamfi.com/celia',
    status: 'Concept',
    summary: 'Make time for the things that actually matter. Screen blocking with accountability',
    details: [
      'A mobile app for blocking distracting apps and websites. It helps you stay focused on the things that actually matter.',
    ],
    techStack: ['Kotlin', 'Swift'],
    featured: true,
  },
  {
    name: 'Howbee',
    link: 'https://www.howbee.app',
    status: 'Shipped',
    summary: 'Cultivate deeper connections. Track friendships. Never miss a chance to catch-up',
    details: [
      'Mobile app for keeping up to date with friends and loved ones. Get reminded to check in on them based on specified cadences',
    ],
    techStack: ['React Native'],
    featured: true,
  },
  {
    name: 'This website',
    link: 'https://www.kwakye-gyamfi.com',
    status: 'Shipped',
    summary: "The site you're reading — an Astro project kept deliberately small:",
    details: [
      "The site you're reading — an Astro project kept deliberately small: markdown posts, typed data files, a handful of components, and no client-side framework. Light and dark themes, a filterable photo archive, and a blog, all statically generated.",
    ],
    techStack: ['Astro', 'Typescript'],
    featured: false,
  },
];
