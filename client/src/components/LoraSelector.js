import React, { useState, useEffect } from 'react';
import './LoraSelector.css';

const artisticLoras = [
    {
        id: 'gothic-lines',
        name: '🗡️ Shadow Weaver',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1202162?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'anime-lines',
        name: '✨ Kawaii Master',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1296986?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'dark-energetic-anime',
        name: '⚡ Dark Pulse',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/988430?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'vibrant-energetic-anime',
        name: '🌈 Color Blast',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/989004?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'vintage-pulp',
        name: '📚 Retro Master',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1304212?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'anime-detailed-eyes',
        name: '👁️ Soul Gaze',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/726524?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'luminous-shadows-cape',
        name: '🌙 Luminous Shadows',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/791149?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'faetastic-details',
        name: '🧚 Fae Magic',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/720252?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'storybook-artstyle',
        name: '📖 Page Master',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/723968?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'castlevania-art-style',
        name: '🦇 Gothic Symphony',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/731291?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'retro-anime',
        name: '📺 Nostalgia Wave',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/806265?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'arcane-intro-style',
        name: '⚔️ Arcane Forge',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1089413?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'midjourney-style',
        name: '🎨 Dream Vision',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1249246?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'animelike-digital-painting',
        name: '🖌️ Digital paint',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/778925?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'gothicniji',
        name: '🖤 Gothic Oil Paint',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1189748?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'midjourneyanime',
        name: '✨ Dream Anime',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/837239?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'digital-abyss',
        name: '🌌 Void Explorer',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/945122?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'cyber-graphic',
        name: '🤖 Cyber Matrix',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/843447?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'elden-ring-style',
        name: '⚔️ Dark Souls',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/746484?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'frazetta-style',
        name: '🗡️ Fantasy Legend',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/792756?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'colored-pencil',
        name: '✏️ Master Sketch',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1086297?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'dark-fantasy',
        name: '🏰 Dark Fantasy',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/759880?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'weird-core',
        name: '🌀 Weird Core',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1195582?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'citron-style',
        name: '🍋 Citron Style',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/756390?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'anime-no-line',
        name: '✨ Clean Anime',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1401595?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'anime-digital-matte',
        name: '🎨 Digital Matte',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1424928?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'dream-world',
        name: '💫 Dream World',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1346178?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'anime-furry',
        name: '🦊 Furry Anime',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1413007?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'anime-gloss',
        name: '✨ Glossy Anime',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1318366?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'anime-patootie',
        name: '🎀 Patootie Style',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1405358?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'commodore-64',
        name: '🕹️ Retro Gaming',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/804983?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'arcane-art',
        name: '⚡ Arcane Art',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1274224?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'anime-ink',
        name: '🖋️ Ink Style',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/914935?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'ethereal-dark',
        name: '🌑 Ethereal Dark',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1148373?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'painting-realm',
        name: '🎨 Painting Realm',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1161271?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'impressionist',
        name: '🖼️ Impressionist',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/755598?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'mai-colors',
        name: '🌈 Mai Colors',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1040356?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'neuro-cyberpunk',
        name: '🤖 Neuro Cyber',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1109173?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'cyberpunk-anime',
        name: '🌆 Cyber Anime',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/747534?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'randomaxx-artistry',
        name: '🎨 Random Art',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1075587?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'randommax-animefy',
        name: '✨ Random Anime',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1183977?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'randomax-illustrify',
        name: '🖌️ Random Illust',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1146446?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'anime-niji',
        name: '🌈 Niji Style',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/937875?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'neon-fantasy',
        name: '💫 Neon Fantasy',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/798521?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'anime-shadow-circuit',
        name: '⚡ Shadow Circuit',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1050932?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'details-colored-pencil',
        name: '✏️ Color Pencil Pro',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1299834?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'blender-style',
        name: '🎮 Blender Style',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/911089?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'pixel-art',
        name: '🎮 Pixel Art',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1329685?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'new-future',
        name: '🚀 New Future',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/737325?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
];

const realisticLoras = [
    {
        id: 'dramatic-lighting',
        name: '💫 Light Sorcerer',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1278791?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'image-upgrader',
        name: '🔮 Reality Enhancer',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/984672?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'neon-lighting',
        name: '🌟 Neon Dreams',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1091576?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'turbo-detailer',
        name: '🔍 Detail Master',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1041442?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'analog-grainy',
        name: '📷 Retro Time Capsule',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1276001?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'portrait-style',
        name: '👤 Portrait Style',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/728041?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'realistic-skin',
        name: '✨ Skin Perfectionist',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1081450?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'realistic-horror',
        name: '👻 Nightmare Forge',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/875302?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'ultra-realistic',
        name: '🎭 Hyper Reality',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1026423?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'fantasy-wizards-witches',
        name: '🧙‍♂️ Spellcraft Supreme',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/880134?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'real-anime',
        name: '🎌 Real Anime',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/735703?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'realistic-80s-fantasy',
        name: '🎬 80s Dark Fantasy',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1287297?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'realistic-60s',
        name: '🎥 60s Cinema',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1282338?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'surreal-landscapes',
        name: '🌅 Surreal Lands',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1295995?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'opal-style',
        name: '💎 Opal Dreams',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1329546?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'liminal-space',
        name: '🚪 Liminal Space',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1388658?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'retro-future',
        name: '🚀 Retro Future',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1369314?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'new-fantasy-core',
        name: '✨ Fantasy Core',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1264088?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'randomax-robotics',
        name: '🤖 Robotics',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1115596?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'future-fashion',
        name: '👔 Future Fashion',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1067736?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'epic-details',
        name: '🔍 Epic Details',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/863655?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'impossible-geometry',
        name: '📐 Impossible Space',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/874854?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'vintage-neon',
        name: '💫 Vintage Neon',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/756311?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'semi-realistic',
        name: '🎭 Semi Real',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/978472?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'ultra-style',
        name: '✨ Ultra Style',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1115050?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'gold-leaf',
        name: '🌟 Gold Leaf',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1022295?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'fantasy-scifi',
        name: '🚀 Sci-Fantasy',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/840288?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'neogods',
        name: '👑 Neo Gods',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1051442?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'vintage-abstract',
        name: '🎨 Vintage Abstract',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/804970?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'spooky-vibes',
        name: '👻 Spooky Vibes',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/922827?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'fantasy-enhancer',
        name: '✨ Fantasy Plus',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/926161?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: '2000s-social',
        name: '📱 2000s Social',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1434002?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
    {
        id: 'sony-camera',
        name: '📸 Old Camera',
        defaultWeight: 1.0,
        url: 'https://civitai.com/api/download/models/1321224?type=Model&format=SafeTensor&token=c581b817077f3d10301ca21d33b78186'
    },
];

const loraExamples = {
    'gothic-lines': [
        '/examples/loras/gothic-lines/1.webp',
        '/examples/loras/gothic-lines/2.webp',
        '/examples/loras/gothic-lines/3.webp',
        '/examples/loras/gothic-lines/4.webp'
    ],
    'anime-lines': [
        '/examples/loras/anime-lines/1.webp',
        '/examples/loras/anime-lines/2.webp',
        '/examples/loras/anime-lines/3.webp',
        '/examples/loras/anime-lines/4.webp'
    ],
    'dark-energetic-anime': [
        '/examples/loras/dark-energetic-anime/1.webp',
        '/examples/loras/dark-energetic-anime/2.webp',
        '/examples/loras/dark-energetic-anime/3.webp',
        '/examples/loras/dark-energetic-anime/4.webp'
    ],
    'vibrant-energetic-anime': [
        '/examples/loras/vibrant-energetic-anime/1.webp',
        '/examples/loras/vibrant-energetic-anime/2.webp',
        '/examples/loras/vibrant-energetic-anime/3.webp',
        '/examples/loras/vibrant-energetic-anime/4.webp'
    ],
    'vintage-pulp': [
        '/examples/loras/vintage-pulp/1.webp',
        '/examples/loras/vintage-pulp/2.webp',
        '/examples/loras/vintage-pulp/3.webp',
        '/examples/loras/vintage-pulp/4.webp'
    ],
    'anime-detailed-eyes': [
        '/examples/loras/anime-detailed-eyes/1.webp',
        '/examples/loras/anime-detailed-eyes/2.webp',
        '/examples/loras/anime-detailed-eyes/3.webp',
        '/examples/loras/anime-detailed-eyes/4.webp'
    ],
    'luminous-shadows-cape': [
        '/examples/loras/luminous-shadows-cape/1.webp',
        '/examples/loras/luminous-shadows-cape/2.webp',
        '/examples/loras/luminous-shadows-cape/3.webp',
        '/examples/loras/luminous-shadows-cape/4.webp'
    ],
    'faetastic-details': [
        '/examples/loras/faetastic-details/1.webp',
        '/examples/loras/faetastic-details/2.webp',
        '/examples/loras/faetastic-details/3.webp',
        '/examples/loras/faetastic-details/4.webp'
    ],
    'storybook-artstyle': [
        '/examples/loras/storybook-artstyle/1.webp',
        '/examples/loras/storybook-artstyle/2.webp',
        '/examples/loras/storybook-artstyle/3.webp',
        '/examples/loras/storybook-artstyle/4.webp'
    ],
    'castlevania-art-style': [
        '/examples/loras/castlevania-art-style/1.webp',
        '/examples/loras/castlevania-art-style/2.webp',
        '/examples/loras/castlevania-art-style/3.webp',
        '/examples/loras/castlevania-art-style/4.webp'
    ],
    'retro-anime': [
        '/examples/loras/retro-anime/1.webp',
        '/examples/loras/retro-anime/2.webp',
        '/examples/loras/retro-anime/3.webp',
        '/examples/loras/retro-anime/4.webp'
    ],
    'arcane-intro-style': [
        '/examples/loras/arcane-intro-style/1.webp',
        '/examples/loras/arcane-intro-style/2.webp',
        '/examples/loras/arcane-intro-style/3.webp',
        '/examples/loras/arcane-intro-style/4.webp'
    ],
    'midjourney-style': [
        '/examples/loras/midjourney-style/1.webp',
        '/examples/loras/midjourney-style/2.webp',
        '/examples/loras/midjourney-style/3.webp',
        '/examples/loras/midjourney-style/4.webp'
    ],
    'animelike-digital-painting': [
        '/examples/loras/animelike-digital-painting/1.webp',
        '/examples/loras/animelike-digital-painting/2.webp',
        '/examples/loras/animelike-digital-painting/3.webp',
        '/examples/loras/animelike-digital-painting/4.webp'
    ],
    'gothicniji': [
        '/examples/loras/gothicniji/1.webp',
        '/examples/loras/gothicniji/2.webp',
        '/examples/loras/gothicniji/3.webp',
        '/examples/loras/gothicniji/4.webp'
    ],
    'midjourneyanime': [
        '/examples/loras/midjourneyanime/1.webp',
        '/examples/loras/midjourneyanime/2.webp',
        '/examples/loras/midjourneyanime/3.webp',
        '/examples/loras/midjourneyanime/4.webp'
    ],
    'digital-abyss': [
        '/examples/loras/digital-abyss/1.webp',
        '/examples/loras/digital-abyss/2.webp',
        '/examples/loras/digital-abyss/3.webp',
        '/examples/loras/digital-abyss/4.webp'
    ],
    'cyber-graphic': [
        '/examples/loras/cyber-graphic/1.webp',
        '/examples/loras/cyber-graphic/2.webp',
        '/examples/loras/cyber-graphic/3.webp',
        '/examples/loras/cyber-graphic/4.webp'
    ],
    'elden-ring-style': [
        '/examples/loras/elden-ring-style/1.webp',
        '/examples/loras/elden-ring-style/2.webp',
        '/examples/loras/elden-ring-style/3.webp',
        '/examples/loras/elden-ring-style/4.webp'
    ],
    'frazetta-style': [
        '/examples/loras/frazetta-style/1.webp',
        '/examples/loras/frazetta-style/2.webp',
        '/examples/loras/frazetta-style/3.webp',
        '/examples/loras/frazetta-style/4.webp'
    ],
    'colored-pencil': [
        '/examples/loras/colored-pencil/1.webp',
        '/examples/loras/colored-pencil/2.webp',
        '/examples/loras/colored-pencil/3.webp',
        '/examples/loras/colored-pencil/4.webp'
    ],
    'dark-fantasy': [
        '/examples/loras/dark-fantasy/1.webp',
        '/examples/loras/dark-fantasy/2.webp',
        '/examples/loras/dark-fantasy/3.webp',
        '/examples/loras/dark-fantasy/4.webp'
    ],
    'weird-core': [
        '/examples/loras/weird-core/1.webp',
        '/examples/loras/weird-core/2.webp',
        '/examples/loras/weird-core/3.webp',
        '/examples/loras/weird-core/4.webp'
    ],
    'citron-style': [
        '/examples/loras/citron-style/1.webp',
        '/examples/loras/citron-style/2.webp',
        '/examples/loras/citron-style/3.webp',
        '/examples/loras/citron-style/4.webp'
    ],
    'anime-no-line': [
        '/examples/loras/anime-no-line/1.webp',
        '/examples/loras/anime-no-line/2.webp',
        '/examples/loras/anime-no-line/3.webp',
        '/examples/loras/anime-no-line/4.webp'
    ],
    'anime-digital-matte': [
        '/examples/loras/anime-digital-matte/1.webp',
        '/examples/loras/anime-digital-matte/2.webp',
        '/examples/loras/anime-digital-matte/3.webp',
        '/examples/loras/anime-digital-matte/4.webp'
    ],
    'dream-world': [
        '/examples/loras/dream-world/1.webp',
        '/examples/loras/dream-world/2.webp',
        '/examples/loras/dream-world/3.webp',
        '/examples/loras/dream-world/4.webp'
    ],
    'anime-furry': [
        '/examples/loras/anime-furry/1.webp',
        '/examples/loras/anime-furry/2.webp',
        '/examples/loras/anime-furry/3.webp',
        '/examples/loras/anime-furry/4.webp'
    ],
    'anime-gloss': [
        '/examples/loras/anime-gloss/1.webp',
        '/examples/loras/anime-gloss/2.webp',
        '/examples/loras/anime-gloss/3.webp',
        '/examples/loras/anime-gloss/4.webp'
    ],
    'anime-patootie': [
        '/examples/loras/anime-patootie/1.webp',
        '/examples/loras/anime-patootie/2.webp',
        '/examples/loras/anime-patootie/3.webp',
        '/examples/loras/anime-patootie/4.webp'
    ],
    // ... previous entries ...

    'commodore-64': [
        '/examples/loras/commodore-64/1.webp',
        '/examples/loras/commodore-64/2.webp',
        '/examples/loras/commodore-64/3.webp',
        '/examples/loras/commodore-64/4.webp'
    ],
    'arcane-art': [
        '/examples/loras/arcane-art/1.webp',
        '/examples/loras/arcane-art/2.webp',
        '/examples/loras/arcane-art/3.webp',
        '/examples/loras/arcane-art/4.webp'
    ],
    'anime-ink': [
        '/examples/loras/anime-ink/1.webp',
        '/examples/loras/anime-ink/2.webp',
        '/examples/loras/anime-ink/3.webp',
        '/examples/loras/anime-ink/4.webp'
    ],
    'ethereal-dark': [
        '/examples/loras/ethereal-dark/1.webp',
        '/examples/loras/ethereal-dark/2.webp',
        '/examples/loras/ethereal-dark/3.webp',
        '/examples/loras/ethereal-dark/4.webp'
    ],
    'painting-realm': [
        '/examples/loras/painting-realm/1.webp',
        '/examples/loras/painting-realm/2.webp',
        '/examples/loras/painting-realm/3.webp',
        '/examples/loras/painting-realm/4.webp'
    ],
    'impressionist': [
        '/examples/loras/impressionist/1.webp',
        '/examples/loras/impressionist/2.webp',
        '/examples/loras/impressionist/3.webp',
        '/examples/loras/impressionist/4.webp'
    ],
    'mai-colors': [
        '/examples/loras/mai-colors/1.webp',
        '/examples/loras/mai-colors/2.webp',
        '/examples/loras/mai-colors/3.webp',
        '/examples/loras/mai-colors/4.webp'
    ],
    'neuro-cyberpunk': [
        '/examples/loras/neuro-cyberpunk/1.webp',
        '/examples/loras/neuro-cyberpunk/2.webp',
        '/examples/loras/neuro-cyberpunk/3.webp',
        '/examples/loras/neuro-cyberpunk/4.webp'
    ],
    'cyberpunk-anime': [
        '/examples/loras/cyberpunk-anime/1.webp',
        '/examples/loras/cyberpunk-anime/2.webp',
        '/examples/loras/cyberpunk-anime/3.webp',
        '/examples/loras/cyberpunk-anime/4.webp'
    ],
    'randomaxx-artistry': [
        '/examples/loras/randomaxx-artistry/1.webp',
        '/examples/loras/randomaxx-artistry/2.webp',
        '/examples/loras/randomaxx-artistry/3.webp',
        '/examples/loras/randomaxx-artistry/4.webp'
    ],
    'randommax-animefy': [
        '/examples/loras/randommax-animefy/1.webp',
        '/examples/loras/randommax-animefy/2.webp',
        '/examples/loras/randommax-animefy/3.webp',
        '/examples/loras/randommax-animefy/4.webp'
    ],
    'randomax-illustrify': [
        '/examples/loras/randomax-illustrify/1.webp',
        '/examples/loras/randomax-illustrify/2.webp',
        '/examples/loras/randomax-illustrify/3.webp',
        '/examples/loras/randomax-illustrify/4.webp'
    ],
    'anime-niji': [
        '/examples/loras/anime-niji/1.webp',
        '/examples/loras/anime-niji/2.webp',
        '/examples/loras/anime-niji/3.webp',
        '/examples/loras/anime-niji/4.webp'
    ],
    'neon-fantasy': [
        '/examples/loras/neon-fantasy/1.webp',
        '/examples/loras/neon-fantasy/2.webp',
        '/examples/loras/neon-fantasy/3.webp',
        '/examples/loras/neon-fantasy/4.webp'
    ],
    'anime-shadow-circuit': [
        '/examples/loras/anime-shadow-circuit/1.webp',
        '/examples/loras/anime-shadow-circuit/2.webp',
        '/examples/loras/anime-shadow-circuit/3.webp',
        '/examples/loras/anime-shadow-circuit/4.webp'
    ],
    'details-colored-pencil': [
        '/examples/loras/details-colored-pencil/1.webp',
        '/examples/loras/details-colored-pencil/2.webp',
        '/examples/loras/details-colored-pencil/3.webp',
        '/examples/loras/details-colored-pencil/4.webp'
    ],
    'blender-style': [
        '/examples/loras/blender-style/1.webp',
        '/examples/loras/blender-style/2.webp',
        '/examples/loras/blender-style/3.webp',
        '/examples/loras/blender-style/4.webp'
    ],
    // Realistic LoRAs
    'dramatic-lighting': [
        '/examples/loras/dramatic-lighting/1.webp',
        '/examples/loras/dramatic-lighting/2.webp',
        '/examples/loras/dramatic-lighting/3.webp',
        '/examples/loras/dramatic-lighting/4.webp'
    ],
    'image-upgrader': [
        '/examples/loras/image-upgrader/1.webp',
        '/examples/loras/image-upgrader/2.webp',
        '/examples/loras/image-upgrader/3.webp',
        '/examples/loras/image-upgrader/4.webp'
    ],
    'neon-lighting': [
        '/examples/loras/neon-lighting/1.webp',
        '/examples/loras/neon-lighting/2.webp',
        '/examples/loras/neon-lighting/3.webp',
        '/examples/loras/neon-lighting/4.webp'
    ],
    'turbo-detailer': [
        '/examples/loras/turbo-detailer/1.webp',
        '/examples/loras/turbo-detailer/2.webp',
        '/examples/loras/turbo-detailer/3.webp',
        '/examples/loras/turbo-detailer/4.webp'
    ],
    'analog-grainy': [
        '/examples/loras/analog-grainy/1.webp',
        '/examples/loras/analog-grainy/2.webp',
        '/examples/loras/analog-grainy/3.webp',
        '/examples/loras/analog-grainy/4.webp'
    ],
    'portrait-style': [
        '/examples/loras/portrait-style/1.webp',
        '/examples/loras/portrait-style/2.webp',
        '/examples/loras/portrait-style/3.webp',
        '/examples/loras/portrait-style/4.webp'
    ],
    'realistic-skin': [
        '/examples/loras/realistic-skin/1.webp',
        '/examples/loras/realistic-skin/2.webp',
        '/examples/loras/realistic-skin/3.webp',
        '/examples/loras/realistic-skin/4.webp'
    ],
    'realistic-horror': [
        '/examples/loras/realistic-horror/1.webp',
        '/examples/loras/realistic-horror/2.webp',
        '/examples/loras/realistic-horror/3.webp',
        '/examples/loras/realistic-horror/4.webp'
    ],
    'ultra-realistic': [
        '/examples/loras/ultra-realistic/1.webp',
        '/examples/loras/ultra-realistic/2.webp',
        '/examples/loras/ultra-realistic/3.webp',
        '/examples/loras/ultra-realistic/4.webp'
    ],
    'fantasy-wizards-witches': [
        '/examples/loras/fantasy-wizards-witches/1.webp',
        '/examples/loras/fantasy-wizards-witches/2.webp',
        '/examples/loras/fantasy-wizards-witches/3.webp',
        '/examples/loras/fantasy-wizards-witches/4.webp'
    ],
    'real-anime': [
        '/examples/loras/real-anime/1.webp',
        '/examples/loras/real-anime/2.webp',
        '/examples/loras/real-anime/3.webp',
        '/examples/loras/real-anime/4.webp'
    ],
    'realistic-80s-fantasy': [
        '/examples/loras/realistic-80s-fantasy/1.webp',
        '/examples/loras/realistic-80s-fantasy/2.webp',
        '/examples/loras/realistic-80s-fantasy/3.webp',
        '/examples/loras/realistic-80s-fantasy/4.webp'
    ],
    'realistic-60s': [
        '/examples/loras/realistic-60s/1.webp',
        '/examples/loras/realistic-60s/2.webp',
        '/examples/loras/realistic-60s/3.webp',
        '/examples/loras/realistic-60s/4.webp'
    ],
    'surreal-landscapes': [
        '/examples/loras/surreal-landscapes/1.webp',
        '/examples/loras/surreal-landscapes/2.webp',
        '/examples/loras/surreal-landscapes/3.webp',
        '/examples/loras/surreal-landscapes/4.webp'
    ],
    'opal-style': [
        '/examples/loras/opal-style/1.webp',
        '/examples/loras/opal-style/2.webp',
        '/examples/loras/opal-style/3.webp',
        '/examples/loras/opal-style/4.webp'
    ],
    'liminal-space': [
        '/examples/loras/liminal-space/1.webp',
        '/examples/loras/liminal-space/2.webp',
        '/examples/loras/liminal-space/3.webp',
        '/examples/loras/liminal-space/4.webp'
    ],
    'retro-future': [
        '/examples/loras/retro-future/1.webp',
        '/examples/loras/retro-future/2.webp',
        '/examples/loras/retro-future/3.webp',
        '/examples/loras/retro-future/4.webp'
    ],
    'new-fantasy-core': [
        '/examples/loras/new-fantasy-core/1.webp',
        '/examples/loras/new-fantasy-core/2.webp',
        '/examples/loras/new-fantasy-core/3.webp',
        '/examples/loras/new-fantasy-core/4.webp'
    ],
    'randomax-robotics': [
        '/examples/loras/randomax-robotics/1.webp',
        '/examples/loras/randomax-robotics/2.webp',
        '/examples/loras/randomax-robotics/3.webp',
        '/examples/loras/randomax-robotics/4.webp'
    ],
    'future-fashion': [
        '/examples/loras/future-fashion/1.webp',
        '/examples/loras/future-fashion/2.webp',
        '/examples/loras/future-fashion/3.webp',
        '/examples/loras/future-fashion/4.webp'
    ],
    'epic-details': [
        '/examples/loras/epic-details/1.webp',
        '/examples/loras/epic-details/2.webp',
        '/examples/loras/epic-details/3.webp',
        '/examples/loras/epic-details/4.webp'
    ],
    'impossible-geometry': [
        '/examples/loras/impossible-geometry/1.webp',
        '/examples/loras/impossible-geometry/2.webp',
        '/examples/loras/impossible-geometry/3.webp',
        '/examples/loras/impossible-geometry/4.webp'
    ],
    'vintage-neon': [
        '/examples/loras/vintage-neon/1.webp',
        '/examples/loras/vintage-neon/2.webp',
        '/examples/loras/vintage-neon/3.webp',
        '/examples/loras/vintage-neon/4.webp'
    ],
    'semi-realistic': [
        '/examples/loras/semi-realistic/1.webp',
        '/examples/loras/semi-realistic/2.webp',
        '/examples/loras/semi-realistic/3.webp',
        '/examples/loras/semi-realistic/4.webp'
    ],
    'ultra-style': [
        '/examples/loras/ultra-style/1.webp',
        '/examples/loras/ultra-style/2.webp',
        '/examples/loras/ultra-style/3.webp',
        '/examples/loras/ultra-style/4.webp'
    ],
    'gold-leaf': [
        '/examples/loras/gold-leaf/1.webp',
        '/examples/loras/gold-leaf/2.webp',
        '/examples/loras/gold-leaf/3.webp',
        '/examples/loras/gold-leaf/4.webp'
    ],
    'fantasy-scifi': [
        '/examples/loras/fantasy-scifi/1.webp',
        '/examples/loras/fantasy-scifi/2.webp',
        '/examples/loras/fantasy-scifi/3.webp',
        '/examples/loras/fantasy-scifi/4.webp'
    ],
    'neogods': [
        '/examples/loras/neogods/1.webp',
        '/examples/loras/neogods/2.webp',
        '/examples/loras/neogods/3.webp',
        '/examples/loras/neogods/4.webp'
    ],
    'vintage-abstract': [
        '/examples/loras/vintage-abstract/1.webp',
        '/examples/loras/vintage-abstract/2.webp',
        '/examples/loras/vintage-abstract/3.webp',
        '/examples/loras/vintage-abstract/4.webp'
    ],
    'spooky-vibes': [
        '/examples/loras/spooky-vibes/1.webp',
        '/examples/loras/spooky-vibes/2.webp',
        '/examples/loras/spooky-vibes/3.webp',
        '/examples/loras/spooky-vibes/4.webp'
    ],
    'fantasy-enhancer': [
        '/examples/loras/fantasy-enhancer/1.webp',
        '/examples/loras/fantasy-enhancer/2.webp',
        '/examples/loras/fantasy-enhancer/3.webp',
        '/examples/loras/fantasy-enhancer/4.webp'
    ],
    '2000s-social': [
        '/examples/loras/2000s-social/1.webp',
        '/examples/loras/2000s-social/2.webp',
        '/examples/loras/2000s-social/3.webp',
        '/examples/loras/2000s-social/4.webp'
    ],
    'sony-camera': [
        '/examples/loras/sony-camera/1.webp',
        '/examples/loras/sony-camera/2.webp',
        '/examples/loras/sony-camera/3.webp',
        '/examples/loras/sony-camera/4.webp'
    ]
};

const LoraPreview = ({ examples, isVisible, position }) => {
    if (!isVisible || !examples) return null;

    return (
        <div 
            className="lora-preview" 
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`
            }}
        >
            <div className="preview-images">
                {examples.map((img, index) => (
                    <img 
                        key={index} 
                        src={img} 
                        alt="Style example" 
                        className="preview-image"
                    />
                ))}
            </div>
        </div>
    );
};

const LoraSelector = ({ selectedLoras, setSelectedLoras, isOpen, onClose }) => {
    const [artisticExpanded, setArtisticExpanded] = useState(true);
    const [realisticExpanded, setRealisticExpanded] = useState(true);
    const [previewState, setPreviewState] = useState({
        visible: false,
        loraId: null,
        position: { x: 0, y: 0 }
    });

    const handleMouseEnter = (e, loraId) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setPreviewState({
            visible: true,
            loraId,
            position: {
                x: rect.right + 10,
                y: rect.top
            }
        });
    };

    const handleMouseLeave = () => {
        setPreviewState(prev => ({ ...prev, visible: false }));
    };

    const toggleLora = (loraId, loraArray) => {
        setSelectedLoras(prev => {
            const lora = loraArray.find(l => l.id === loraId);
            if (prev[lora.url]) {
                const { [lora.url]: removed, ...rest } = prev;
                return rest;
            }
            return {
                ...prev,
                [lora.url]: lora.defaultWeight
            };
        });
    };

    const updateWeight = (loraId, weight, loraArray) => {
        const lora = loraArray.find(l => l.id === loraId);
        setSelectedLoras(prev => ({
            ...prev,
            [lora.url]: parseFloat(weight)
        }));
    };

    const handleRemoveAll = () => {
        setSelectedLoras({});
    };

    const handleRandom = () => {
        const allLoras = [...artisticLoras, ...realisticLoras];
        const shuffled = [...allLoras].sort(() => 0.5 - Math.random());
        const randomLoras = shuffled.slice(0, 4).reduce((acc, lora, index) => {
            let weight;
            switch (index) {
                case 0: weight = (Math.random() * 0.5) + 0.5; break;
                case 1: weight = (Math.random() * 0.5) + 0.4; break;
                case 2: weight = (Math.random() * 0.4) + 0.3; break;
                case 3: weight = (Math.random() * 0.3) + 0.3; break;
                default: weight = lora.defaultWeight;
            }
            acc[lora.url] = parseFloat(weight.toFixed(2));
            return acc;
        }, {});
        setSelectedLoras(randomLoras);
    };

    const renderLoraSection = (loras, expanded, setExpanded, title, emoji) => {
        return (
            <>
                <div className="section-header" onClick={() => setExpanded(!expanded)}>
                    <h3>{emoji} {title} {expanded ? '▼' : '▶'}</h3>
                </div>
                {expanded && (
                    <div className="lora-section lora-grid">
                        {loras.map(lora => (
                            <div 
                                key={lora.id} 
                                className="lora-item"
                                onMouseEnter={(e) => handleMouseEnter(e, lora.id)}
                                onMouseLeave={handleMouseLeave}
                            >
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={!!selectedLoras[lora.url]}
                                        onChange={() => toggleLora(lora.id, loras)}
                                    />
                                    {lora.name}
                                </label>
                                {selectedLoras[lora.url] !== undefined && (
                                    <>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.05"
                                            value={selectedLoras[lora.url]}
                                            onChange={(e) => updateWeight(lora.id, e.target.value, loras)}
                                        />
                                        <span>{selectedLoras[lora.url].toFixed(2)}</span>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="lora-overlay" onClick={onClose}>
            <div className="lora-popup" onClick={e => e.stopPropagation()}>
                <div className="lora-popup-header">
                    <h3>✨ Style Presets ✨</h3>
                    <div className="lora-actions">
                        <button type="button" onClick={handleRandom} className="lora-action-btn primary">
                            🎲 Random Mix
                        </button>
                        <button type="button" onClick={handleRemoveAll} className="lora-action-btn">
                            Clear All
                        </button>
                        <button type="button" className="close-button" onClick={onClose}>×</button>
                    </div>
                </div>

                <div className="lora-content">
                    <div className="lora-column">
                        {renderLoraSection(artisticLoras, artisticExpanded, setArtisticExpanded, "Artistic & Anime", "🎨")}
                    </div>
                    <div className="lora-column">
                        {renderLoraSection(realisticLoras, realisticExpanded, setRealisticExpanded, "Realistic & Photo", "📷")}
                    </div>
                </div>
            </div>
            <LoraPreview 
                examples={previewState.loraId ? loraExamples[previewState.loraId] : null}
                isVisible={previewState.visible}
                position={previewState.position}
            />
        </div>
    );
};

export default LoraSelector;