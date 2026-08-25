// Project Data Architecture - Shivam Grover Portfolio
const PROJECTS_DATA = [
    {
        id: "aevonix",
        number: "01",
        title: "AEVONIX",
        category: "INTERACTIVE 3D WEB EXPERIENCE",
        tagline: "Futuristic 3D controller visualizer & interactive product website",
        description: "Challenge: Deliver an immersive 3D hardware controller showcase without input lag. Solution: Engineered custom WebGL shaders, Three.js inspection, and GSAP camera choreography. Result: Fluid, scroll-driven product exploration with responsive interaction.",
        technologies: ["TypeScript", "Three.js", "WebGL", "GSAP", "TailwindCSS"],
        coverImage: "assets/covers/aevonix.jpg",
        liveUrl: "https://aevonix-controller.vercel.app/",
        githubUrl: "https://github.com/ShivamGrover-05/aevonix-controller",
        featured: true,
        hotspotId: "monitor",
        cameraPosition: { x: 0.12, y: 2.1, z: 2.2 },
        cameraTarget: { x: 0.12, y: 1.95, z: 0.02 },
        highlights: [
            "Scroll-driven 3D product storytelling and real-time material inspection",
            "Cinematic camera choreography triggered via smooth viewport interaction",
            "Modular TypeScript architecture with optimized asset pipelines"
        ]
    },
    {
        id: "collegespathshala",
        number: "02",
        title: "CollegesPathshala",
        category: "HIGHER EDUCATION & COUNSELING PLATFORM",
        tagline: "Comprehensive career counseling & UGC-approved university discovery",
        description: "Challenge: Simplify complex university degree comparisons for students across India. Solution: Built structured degree discovery engines, fee calculators, and SEO-optimized dynamic catalog architecture. Result: Streamlined admissions exploration and automated counseling lead routing.",
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
        description: "Challenge: Present international holiday packages with clarity across mobile devices. Solution: Implemented responsive dynamic itinerary views, instant inquiry workflows, and localized booking engines. Result: Fast, friction-free travel package discovery.",
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
        description: "Challenge: Modernize customized tour discovery for diverse travel itineraries. Solution: Designed a glassmorphism travel interface with filtered package browsing and direct support routing. Result: Accessible holiday exploration with rapid inquiry dispatch.",
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
        description: "Challenge: Eliminate manual data entry and disjointed sales follow-ups. Solution: Orchestrated n8n automation pipelines syncing webhooks, HubSpot CRM, and AI enrichment models. Result: Automated inbound lead qualification and synchronized real-time reporting.",
        technologies: ["n8n", "HubSpot CRM", "Webhooks", "OpenAI API", "Node.js"],
        coverImage: "assets/covers/aiautomation.jpg",
        liveUrl: null,
        githubUrl: null,
        featured: true,
        hotspotId: "terminal",
        cameraPosition: { x: -0.6, y: 1.8, z: 2.4 },
        cameraTarget: { x: -0.3, y: 1.3, z: 0.1 },
        highlights: [
            "End-to-end webhook architecture syncing incoming web inquiries with HubSpot CRM",
            "Automated lead enrichment, classification, and slack notifications via n8n",
            "Zero-latency automated response routing reducing manual touchpoints"
        ]
    }
];

if (typeof window !== 'undefined') {
    window.PROJECTS_DATA = PROJECTS_DATA;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PROJECTS_DATA };
}
