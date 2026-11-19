export default {
  nav: {
    docs: 'Documentation',
    openApp: 'Open the app',
    closeMenu: 'Close menu',
    openMenu: 'Open menu',
    themeToggleAria: 'Toggle theme',
    themeLight: 'Light theme',
    themeDark: 'Dark theme',
  },
  hero: {
    badge: '2D & 3D motion design editor in your browser',
    headingPrefix: 'Create',
    headingHighlight: 'motion design',
    headingSuffix: 'videos worthy of a pro',
    paragraph:
      'ToonForge AI currently provides a browser-based 2D/3D editor foundation. Automated story-to-video generation is still under development.',
    createProject: 'Create my first project',
    viewDocs: 'View documentation',
    offlineFirst: 'Local-first',
    installablePwa: 'Installable PWA',
    videoExport: 'Video export',
  },
  features: {
    heading: 'The editor foundation',
    subheading: 'An existing 2D/3D editor foundation for scene creation and animation.',
    items: {
      edit2d: { title: 'WYSIWYG 2D editing', desc: 'Vector shapes, text, images — manipulate everything directly on the canvas.' },
      scenes3d: { title: 'Full 3D scenes', desc: 'Primitives, glTF import, lights, cameras, PBR materials — real-time WebGL rendering.' },
      keyframes: { title: 'Keyframes & Easing', desc: 'Custom animation engine with easing, spring, and custom bézier curves.' },
      scenesTransitions: { title: 'Scenes & transition settings', desc: 'Create multiple scenes and configure transition settings; transition rendering is not implemented yet.' },
      videoExport: { title: 'Browser export UI', desc: 'GIF encoding is available; video MIME support depends on the browser and has not been verified. MOV conversion is not implemented.' },
      offlinePwa: { title: 'Installable PWA', desc: 'The app shell and local editor can work offline after caching; projects are stored in browser-local IndexedDB.' },
    },
  },
  howItWorks: {
    heading: 'How it works',
    subheading: 'Explore the editor foundation in four steps.',
    step: 'STEP',
    steps: {
      create: { title: 'Create', desc: 'Configure your project: 2D or 3D mode, format, FPS.' },
      animate: { title: 'Animate', desc: 'Add objects, keyframes, and adjust properties.' },
      preview: { title: 'Preview', desc: 'Launch the viewer to see the final render.' },
      export: { title: 'Export', desc: 'Choose format and quality, download your video.' },
    },
  },
  showcase: {
    heading: 'Example gallery',
    subheading: "Real projects rendered by the app — click a thumbnail to see it in motion.",
    items: {
      demo2d: 'ToonForge AI — 2D Demo',
      demo3d: 'ToonForge AI — 3D Demo',
      demoGif: 'ToonForge AI — Animated GIF export',
    },
    viewAria: 'View {{title}}',
    closeAria: 'Close preview',
  },
  cta: {
    heading: 'Ready to create?',
    paragraph: 'Launch your first project in seconds. No installation, no account required.',
    createProject: 'Create my first project',
  },
  footer: {
    copyright: 'ToonForge AI © 2026',
    docs: 'Documentation',
    projects: 'My projects',
    githubAria: 'GitHub',
  },
};
