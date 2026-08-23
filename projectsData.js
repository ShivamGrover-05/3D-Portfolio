// Project Data Architecture - Shivam Grover Portfolio
const PROJECTS_DATA = [
    {
        id: "aevonix",
        number: "01",
        title: "AEVONIX",
        category: "INTERACTIVE 3D WEB EXPERIENCE",
        tagline: "Futuristic 3D controller visualizer & interactive product website",
        description: "An interactive, GPU-accelerated 3D hardware visualizer and product showcase built with TypeScript, Three.js shaders, and custom GSAP camera choreography. Designed to deliver a high-impact digital showroom with real-time material rendering.",
        technologies: ["TypeScript", "Three.js", "WebGL", "GSAP", "TailwindCSS"],
        coverImage: "assets/covers/aevonix.jpg",
        liveUrl: "https://aevonix-controller.vercel.app/",
        githubUrl: "https://github.com/ShivamGrover-05/aevonix-controller",
        featured: true,
        hotspotId: "monitor",
        cameraPosition: { x: 0.12, y: 2.1, z: 2.2 },
        cameraTarget: { x: 0.12, y: 1.95, z: 0.02 },
        highlights: [
            "Real-time 60fps WebGL model inspection and dynamic shader lighting",
            "Cinematic camera choreography triggered via scroll & interaction",
            "Modular TypeScript architecture with lightweight asset pipelines"
        ]
    },
    {
        id: "collegespathshala",
        number: "02",
        title: "CollegesPathshala",
        category: "HIGHER EDUCATION & COUNSELING PLATFORM",
        tagline: "Comprehensive career counseling & UGC-approved university discovery",
        description: "A large-scale educational guidance and university comparison platform for students across India. Features verified UGC-approved online MBA/MCA degree comparisons, syllabus exploration, fee calculators, and expert counseling intake workflows.",
        technologies: ["Next.js / React", "TailwindCSS", "PHP / MySQL", "Lucide Icons", "REST APIs"],
        coverImage: "assets/covers/collegespathshala.jpg",
        liveUrl: "https://collegespathshala.com/#home",
        githubUrl: null,
        featured: true,
        hotspotId: "laptop",
        cameraPosition: { x: -1.2, y: 2.2, z: 2.6 },
        cameraTarget: { x: -0.9, y: 1.6, z: 0.2 },
        highlights: [
            "Structured degree discovery engine with fee comparisons & syllabus breakdowns",
            "SEO-optimized architecture with dynamic Schema.org structured data",
            "Automated lead capture & counseling workflow integrations"
        ]
    },
    {
        id: "vacationvisits",
        number: "03",
        title: "Vacation Visits",
        category: "INTERNATIONAL TRAVEL & TOURISM PLATFORM",
        tagline: "Curated international holiday packages & visa assistance",
        description: "A premium travel and holiday discovery portal serving travelers with curated destination packages across Dubai, Thailand, Maldives, and domestic getaways. Features dynamic itinerary views, flight routing, inquiry engines, and visa services.",
        technologies: ["React", "TailwindCSS", "FontAwesome", "Form Automations", "SEO"],
        coverImage: "assets/covers/vacationvisits.jpg",
        liveUrl: "https://vacationvisits.in/",
        githubUrl: null,
        featured: true,
        hotspotId: "desk_display",
        cameraPosition: { x: 0.9, y: 2.1, z: 2.8 },
        cameraTarget: { x: 0.6, y: 1.5, z: 0.3 },
        highlights: [
            "Curated destination catalog with dynamic pricing & itinerary breakdowns",
            "Integrated lead capture with instant traveler consultation triggers",
            "High-performance responsive design tailored for mobile bookings"
        ]
    },
    {
        id: "sagaholidays",
        number: "04",
        title: "Saga Holidays",
        category: "CURATED HOLIDAY & EXPEDITION PORTAL",
        tagline: "Custom tour operator experience with glassmorphism UI",
        description: "A modern, vibrant tour operator platform offering tailored travel packages, seasonal holiday tours, and personalized expedition planning. Features glassmorphism UI, destination guides, and seamless customer support connections.",
        technologies: ["JavaScript", "TailwindCSS", "Glassmorphism UI", "Responsive Web"],
        coverImage: "assets/covers/sagaholidays.jpg",
        liveUrl: "https://sagaholidays.in/",
        githubUrl: null,
        featured: true,
        hotspotId: "second_display",
        cameraPosition: { x: 1.4, y: 2.3, z: 3.0 },
        cameraTarget: { x: 0.9, y: 1.6, z: 0.4 },
        highlights: [
            "Tailwind-powered design system with smooth micro-interactions",
            "Filtered search for seasonal holiday deals and family getaways",
            "Direct customer support routing via WhatsApp and web inquiry"
        ]
    },
    {
        id: "aiautomation",
        number: "05",
        title: "AI & Workflow Automation",
        category: "INTELLIGENT SYSTEMS & REVOPS ENGINE",
        tagline: "Automated business workflows, n8n orchestration & CRM sync",
        description: "An enterprise workflow orchestration system integrating n8n automation pipelines, HubSpot CRM, webhooks, and AI language models to automate inbound lead qualification, multi-channel data enrichment, and synchronized reporting.",
        technologies: ["n8n", "HubSpot CRM", "Webhooks", "OpenAI API", "Node.js"],
        coverImage: "assets/covers/aiautomation.jpg",
        liveUrl: null,
        githubUrl: null,
        featured: true,
        hotspotId: "terminal",
        cameraPosition: { x: -0.6, y: 1.8, z: 2.4 },
        cameraTarget: { x: -0.4, y: 1.1, z: 0.1 },
        highlights: [
            "Zero-loss multi-stage webhook pipeline with error retry queues",
            "Automated CRM contact lifecycle staging and enrichment",
            "Real-time alerts and executive summary generation via AI"
        ]
    }
];

if (typeof window !== 'undefined') {
    window.PROJECTS_DATA = PROJECTS_DATA;
}
