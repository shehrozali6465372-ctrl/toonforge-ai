export default {
  nav: {
    docs: 'Documentation',
    openApp: "Ouvrir l'app",
    closeMenu: 'Fermer le menu',
    openMenu: 'Ouvrir le menu',
    themeToggleAria: 'Changer de thème',
    themeLight: 'Thème clair',
    themeDark: 'Thème sombre',
  },
  hero: {
    badge: 'Éditeur de motion design 2D & 3D dans le navigateur',
    headingPrefix: 'Créez des vidéos de',
    headingHighlight: 'motion design',
    headingSuffix: "dignes d'un pro",
    paragraph:
      'ToonForge AI fournit actuellement une base d’éditeur 2D/3D dans le navigateur. La génération automatisée de vidéos à partir d’une histoire est encore en développement.',
    createProject: 'Créer mon premier projet',
    viewDocs: 'Voir la documentation',
    offlineFirst: 'Local-first',
    installablePwa: 'PWA installable',
    videoExport: 'Export vidéo',
  },
  features: {
    heading: 'La base de l’éditeur',
    subheading: 'Une base existante d’éditeur 2D/3D pour créer et animer des scènes.',
    items: {
      edit2d: { title: 'Édition 2D WYSIWYG', desc: 'Formes vectorielles, texte, images — manipulez tout directement sur le canvas.' },
      scenes3d: { title: 'Scènes 3D complètes', desc: 'Primitives, import glTF, lumières, caméras, matériaux PBR — rendu WebGL temps réel.' },
      keyframes: { title: 'Keyframes & Easing', desc: "Moteur d'animation custom avec courbes d'easing, spring et bézier custom." },
      scenesTransitions: { title: 'Scènes et réglages de transition', desc: 'Créez plusieurs scènes et configurez les transitions ; leur rendu n’est pas encore implémenté.' },
      videoExport: { title: 'Export vidéo dans le navigateur', desc: 'Les exports GIF, MP4 (H.264) horodaté et WebM (VP9) utilisent les encodeurs du navigateur ; leur disponibilité dépend de l’appareil. L’export MOV n’est pas implémenté.' },
      offlinePwa: { title: 'PWA installable', desc: 'Le shell et l’éditeur local peuvent fonctionner hors ligne après mise en cache ; les projets restent dans IndexedDB du navigateur.' },
    },
  },
  howItWorks: {
    heading: 'Comment ça marche',
    subheading: 'Découvrez la base de l’éditeur en quatre étapes.',
    step: 'ÉTAPE',
    steps: {
      create: { title: 'Créer', desc: 'Configurez votre projet : mode 2D ou 3D, format, FPS.' },
      animate: { title: 'Animer', desc: 'Ajoutez des objets, keyframes, et réglez les propriétés.' },
      preview: { title: 'Prévisualiser', desc: 'Lancez le visualisateur pour voir le rendu final.' },
      export: { title: 'Exporter', desc: 'Choisissez format et qualité, téléchargez votre vidéo.' },
    },
  },
  showcase: {
    heading: "Galerie d'exemples",
    subheading: "Des projets réels rendus par l'app — cliquez sur une miniature pour la voir s'animer.",
    items: {
      demo2d: 'ToonForge AI — Démo 2D',
      demo3d: 'ToonForge AI — Démo 3D',
      demoGif: 'ToonForge AI — Export GIF animé',
    },
    viewAria: 'Voir {{title}}',
    closeAria: 'Fermer l\'aperçu',
  },
  cta: {
    heading: 'Prêt à créer ?',
    paragraph: 'Lancez votre premier projet en quelques secondes. Aucune installation, aucun compte requis.',
    createProject: 'Créer mon premier projet',
  },
  footer: {
    copyright: 'ToonForge AI © 2026',
    docs: 'Documentation',
    projects: 'Mes projets',
    githubAria: 'GitHub',
  },
};
