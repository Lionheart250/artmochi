import React, { useState, useEffect } from 'react';
import './LoraSelector.css';

const artisticLoras = [
    {
        id: 'gothic-lines',
        name: '🗡️ Shadow Weaver',
        defaultWeight: 1.0,
        url: 'civitai:599757@1202162'
    },
    {
        id: 'anime-lines',
        name: '✨ Kawaii Master',
        defaultWeight: 1.0,
        url: 'civitai:599757@1296986'
    },
    {
        id: 'dark-energetic-anime',
        name: '⚡ Dark Pulse',
        defaultWeight: 1.0,
        url: 'civitai:883007@988430'
    },
    {
        id: 'vibrant-energetic-anime',
        name: '🌈 Color Blast',
        defaultWeight: 1.0,
        url: 'civitai:1252726@989004'
    },
    {
        id: 'retro-anime-dark',
        name: '🌙 dark retro anime',
        defaultWeight: 1.0,
        url: 'civitai:1061759@1191560'
    },
    {
        id: 'anime-detailed-eyes',
        name: '👁️ Soul Gaze',
        defaultWeight: 1.0,
        url: 'civitai:649378@726524'
    },
    {
        id: 'luminous-shadows-cape',
        name: '🌙 Luminous Shadows',
        defaultWeight: 1.0,
        url: 'civitai:707312@791149'
    },
    {
        id: 'faetastic-details',
        name: '🧚 Fae Magic',
        defaultWeight: 1.0,
        url: 'civitai:643886@720252'
    },
    {
        id: 'storybook-artstyle',
        name: '📖 Page Master',
        defaultWeight: 1.0,
        url: 'civitai:552804@723968'
    },
    {
        id: 'castlevania-art-style',
        name: '🦇 Gothic Symphony',
        defaultWeight: 1.0,
        url: 'civitai:653658@731291'
    },
    {
        id: 'retro-anime',
        name: '📺 Nostalgia Wave',
        defaultWeight: 1.0,
        url: 'civitai:721039@806265'
    },
    {
        id: 'arcane-intro-style',
        name: '⚔️ Arcane Forge',
        defaultWeight: 1.0,
        url: 'civitai:972886@1089413'
    },
    {
        id: 'midjourney-style',
        name: '🎨 Dream Vision',
        defaultWeight: 1.0,
        url: 'civitai:1268816@1431182'
    },
    {
        id: 'animelike-digital-painting',
        name: '🖌️ Digital paint',
        defaultWeight: 1.0,
        url: 'civitai:1050516@1178753'
    },
    {
        id: 'glitch-effect',
        name: '🖌️ glitch effect',
        defaultWeight: 1.0,
        url: 'civitai:764243@854817'
    },
    {
        id: 'gothicniji',
        name: '🖤 Gothic Oil Paint',
        defaultWeight: 1.0,
        url: 'civitai:910493@1018961'
    },
    {
        id: 'midjourneyanime',
        name: '✨ Dream Anime',
        defaultWeight: 1.0,
        url: 'civitai:640247@837239'
    },
    {
        id: 'digital-abyss',
        name: '🌌 Void Explorer',
        defaultWeight: 1.0,
        url: 'civitai:844787@945122'
    },
    {
        id: 'cyber-graphic',
        name: '🤖 Cyber Matrix',
        defaultWeight: 1.0,
        url: 'civitai:104855@843447'
    },
    {
        id: 'elden-ring-style',
        name: '⚔️ Dark Souls',
        defaultWeight: 1.0,
        url: 'civitai:667004@746484'
    },
    {
        id: 'frazetta-style',
        name: '🗡️ Fantasy Legend',
        defaultWeight: 1.0,
        url: 'civitai:657789@792756'
    },
    {
        id: 'colored-pencil',
        name: '✏️ Master Sketch',
        defaultWeight: 1.0,
        url: 'civitai:970164@1086297'
    },
    {
        id: 'dark-fantasy',
        name: '🏰 Dark Fantasy Anime',
        defaultWeight: 1.0,
        url: 'civitai:987994@1106834'
    },
    {
        id: 'weird-core',
        name: '🌀 Weird Core',
        defaultWeight: 1.0,
        url: 'civitai:651444@728797'
    },
    {
        id: 'citron-style',
        name: '🍋 Citron Style',
        defaultWeight: 1.0,
        url: 'civitai:206975@748278'
    },
    {
        id: 'anime-no-line',
        name: '✨ Clean Anime',
        defaultWeight: 1.0,
        url: 'civitai:610299@1401595'
    },
    {
        id: 'anime-digital-matte',
        name: '😈 Devilish Anime',
        defaultWeight: 1.0,
        url: 'civitai:653658@1091576'
    },
    {
        id: 'dream-world',
        name: '💫 Pastel Dream World',
        defaultWeight: 1.0,
        url: 'civitai:1100297@1235963'
    },
    {
        id: 'anime-furry-anime',
        name: '🦊 Furry Anime',
        defaultWeight: 1.0,
        url: 'civitai:683555@765069'
    },
    {
        id: 'anime-furry',
        name: '🦊 animal people',
        defaultWeight: 1.0,
        url: 'civitai:666530@745927'
    },
    {
        id: 'anime-gloss',
        name: '✨ Anime Abyss',
        defaultWeight: 1.0,
        url: 'civitai:1220524@1375016'
    },
    {
        id: 'anime-patootie',
        name: '🎀 Cute anime',
        defaultWeight: 1.0,
        url: 'civitai:714944@857267'
    },
    {
        id: 'commodore-64',
        name: '🕹️ Retro Gaming',
        defaultWeight: 1.0,
        url: 'civitai:1264020@1425473'
    },
    {
        id: 'ghibliesque',
        name: '⚡ Ghibli Style',
        defaultWeight: 1.0,
        url: 'civitai:433138@755852'
    },
    {
        id: 'anime-ink',
        name: '🖋️ Serial Experiments',
        defaultWeight: 1.0,
        url: 'civitai:131706@997381'
    },
    {
        id: 'ethereal-dark',
        name: '🌑 Ethereal Dark',
        defaultWeight: 1.0,
        url: 'civitai:1024070@1148373'
    },
    {
        id: 'painting-realm',
        name: '🎨 Painting Realm',
        defaultWeight: 1.0,
        url: 'civitai:1035333@1161271'
    },
    {
        id: 'impressionist',
        name: '🖼️ Impressionist',
        defaultWeight: 1.0,
        url: 'civitai:545264@755598'
    },
    {
        id: 'mai-colors',
        name: '🌈 Mai Colors',
        defaultWeight: 1.0,
        url: 'civitai:862902@965491'
    },
    {
        id: 'neuro-cyberpunk',
        name: '🤖 Neuro Cyber',
        defaultWeight: 1.0,
        url: 'civitai:903057@1410611'
    },
    {
        id: 'cyberpunk-anime',
        name: '🌆 Cyber Anime',
        defaultWeight: 1.0,
        url: 'civitai:128568@747534'
    },
    {
        id: 'randomaxx-artistry',
        name: '🎨 Artifyer',
        defaultWeight: 1.0,
        url: 'civitai:960680@1075587'
    },
    {
        id: 'randommax-animefy',
        name: '✨ Animeifyer',
        defaultWeight: 1.0,
        url: 'civitai:1055190@1183977'
    },
    {
        id: 'randomax-illustrify',
        name: '🖌️ Illustifyer',
        defaultWeight: 1.0,
        url: 'civitai:1022387@1146446'
    },
    {
        id: 'anime-niji',
        name: '🌈 Niji Style',
        defaultWeight: 1.0,
        url: 'civitai:838306@937875'
    },
    {
        id: 'neon-fantasy',
        name: '💫 Neon Fantasy',
        defaultWeight: 1.0,
        url: 'civitai:1271843@1434732'
    },
    {
        id: 'anime-shadow-circuit',
        name: '⚡ Shadow Circuit',
        defaultWeight: 1.0,
        url: 'civitai:938811@1050932'
    },
    {
        id: 'details-colored-pencil',
        name: '✏️ Color Pencil Pro',
        defaultWeight: 1.0,
        url: 'civitai:1155749@1405684'
    },
    {
        id: 'blender-style',
        name: '🎮 Blender Style',
        defaultWeight: 1.0,
        url: 'civitai:638052@743692'
    },
    {
        id: 'pixel-art',
        name: '🎮 Pixel Art',
        defaultWeight: 1.0,
        url: 'civitai:834943@934133'
    },
    {
        id: 'new-future',
        name: '🚀 New Future',
        defaultWeight: 1.0,
        url: 'civitai:658958@737325'
    },
];

const realisticLoras = [
    {
        id: 'dramatic-lighting',
        name: '💫 Light Sorcerer',
        defaultWeight: 1.0,
        url: 'civitai:340248@755549'
    },
    {
        id: 'image-upgrader',
        name: '🔮 Reality Enhancer',
        defaultWeight: 1.0,
        url: 'civitai:562866@863991'
    },
    {
        id: 'neon-lighting',
        name: '🌟 Neon Dreams',
        defaultWeight: 1.0,
        url: 'civitai:109613@891865'
    },
    {
        id: 'turbo-detailer',
        name: '🔍 Detail Master',
        defaultWeight: 1.0,
        url: 'civitai:930386@1041442'
    },
    {
        id: 'analog-grainy',
        name: '📷 Retro Time Capsule',
        defaultWeight: 1.0,
        url: 'civitai:1134895@1276001'
    },
    {
        id: 'portrait-style',
        name: '👤 Portrait Style',
        defaultWeight: 1.0,
        url: 'civitai:650743@728041'
    },
    {
        id: 'realistic-skin',
        name: '✨ Skin Perfectionist',
        defaultWeight: 1.0,
        url: 'civitai:580857@1081450'
    },
    {
        id: 'realistic-horror',
        name: '👻 Nightmare Forge',
        defaultWeight: 1.0,
        url: 'civitai:878368@983288'
    },
    {
        id: 'ultra-realistic',
        name: '🎭 Hyper Reality',
        defaultWeight: 1.0,
        url: 'civitai:796382@1026423'
    },
    {
        id: 'fantasy-wizards-witches',
        name: '🧙‍♂️ Spellcraft Supreme',
        defaultWeight: 1.0,
        url: 'civitai:308147@880134'        
    },
    {
        id: 'real-anime',
        name: '🎌 Real Anime',
        defaultWeight: 1.0,
        url: 'civitai:1131779@1272367'
    },
    {
        id: 'realanime ',
        name: '🎌 Real Anime B',
        defaultWeight: 1.0,
        url: 'civitai:1078433@1210699'
    },
    {
        id: 'realistic-80s-fantasy',
        name: '🎬 80s Dark Fantasy',
        defaultWeight: 1.0,
        url: 'civitai:789313@1287297'
    },
    {
        id: 'realistic-60s',
        name: '🎥 60s Cinema',
        defaultWeight: 1.0,
        url: 'civitai:878199@1282338'
    },
    {
        id: 'surreal-landscapes',
        name: '🌅 Surreal Lands',
        defaultWeight: 1.0,
        url: 'civitai:681518@762800'
    },
    {
        id: 'opal-style',
        name: '💎 Opal Dreams',
        defaultWeight: 1.0,
        url: 'civitai:225003@1329546'
    },
    {
        id: 'liminal-space',
        name: '🚪 Liminal Space',
        defaultWeight: 1.0,
        url: 'civitai:658134@898109'
    },
    {
        id: 'retro-future',
        name: '🚀 Retro Future',
        defaultWeight: 1.0,
        url: 'civitai:886913@992798'
    },
    {
        id: 'new-fantasy-core',
        name: '✨ Fantasy Core',
        defaultWeight: 1.0,
        url: 'civitai:810000@1264088'
    },
    {
        id: 'randomax-robotics',
        name: '🤖 Robotics',
        defaultWeight: 1.0,
        url: 'civitai:995599@1115596'
    },
    {
        id: 'future-fashion',
        name: '👔 Future Fashion',
        defaultWeight: 1.0,
        url: 'civitai:746410@1067736'
    },
    {
        id: 'epic-details',
        name: '🔍 Epic Details',
        defaultWeight: 1.0,
        url: 'civitai:736706@863655'
    },
    {
        id: 'impossible-geometry',
        name: '📐 Impossible Space',
        defaultWeight: 1.0,
        url: 'civitai:274425@874854'
    },
    {
        id: 'vintage-neon',
        name: '💫 Vintage Neon',
        defaultWeight: 1.0,
        url: 'civitai:675648@756311'
    },
    {
        id: 'semi-realistic',
        name: '🎭 Semi Real',
        defaultWeight: 1.0,
        url: 'civitai:731933@978472'
    },
    {
        id: 'ultra-style',
        name: '✨ Ultra Style',
        defaultWeight: 1.0,
        url: 'civitai:978314@1413133'
    },
    {
        id: 'gold-leaf',
        name: '🌟 Gold Leaf',
        defaultWeight: 1.0,
        url: 'civitai:311801@1022295'
    },
    {
        id: 'fantasy-scifi',
        name: '🚀 Sci-Fantasy',
        defaultWeight: 1.0,
        url: 'civitai:751420@840288'
    },
    {
        id: 'neogods',
        name: '👑 Alien Vibes',
        defaultWeight: 1.0,
        url: 'civitai:182987@805363'
    },
    {
        id: 'vintage-abstract',
        name: '🎨 Vintage Abstract',
        defaultWeight: 1.0,
        url: 'civitai:719889@804970'
    },
    {
        id: 'spooky-vibes',
        name: '👻 Spooky Vibes',
        defaultWeight: 1.0,
        url: 'civitai:863136@1081646'
    },
    {
        id: 'fantasy-enhancer',
        name: '✨ Fantasy Plus',
        defaultWeight: 1.0,
        url: 'civitai:854554@956116'
    },
    {
        id: '2000s-social',
        name: '📱 VHS',
        defaultWeight: 1.0,
        url: ':civitai:71125@1135830'
    },
    {
        id: 'darkcore',
        name: '🌚 Darkness',
        defaultWeight: 1.0,
        url: 'civitai:667693@747357'
    },
];

const loraExamples = {
    'gothic-lines': [
        '/examples/loras/gothic-lines/gothic-lines1.webp',
        '/examples/loras/gothic-lines/gothic-lines2.webp',
        '/examples/loras/gothic-lines/gothic-lines3.webp',
        '/examples/loras/gothic-lines/gothic-lines4.webp'
    ],
    'anime-lines': [
        '/examples/loras/anime-lines/anime-lines1.webp',
        '/examples/loras/anime-lines/anime-lines2.webp',
        '/examples/loras/anime-lines/anime-lines3.webp',
        '/examples/loras/anime-lines/anime-lines4.webp'
    ],
    'dark-energetic-anime': [
        '/examples/loras/dark-energetic-anime/dark-energetic-anime1.webp',
        '/examples/loras/dark-energetic-anime/dark-energetic-anime2.webp',
        '/examples/loras/dark-energetic-anime/dark-energetic-anime3.webp',
        '/examples/loras/dark-energetic-anime/dark-energetic-anime4.webp'
    ],
    'vibrant-energetic-anime': [
        '/examples/loras/vibrant-energetic-anime/vibrant-energetic-anime1.webp',
        '/examples/loras/vibrant-energetic-anime/vibrant-energetic-anime2.webp',
        '/examples/loras/vibrant-energetic-anime/vibrant-energetic-anime3.webp',
        '/examples/loras/vibrant-energetic-anime/vibrant-energetic-anime4.webp'
    ],
    'retro-anime-dark': [
        '/examples/loras/retro-anime-dark/retro-anime-dark1.webp',
        '/examples/loras/retro-anime-dark/retro-anime-dark2.webp',
        '/examples/loras/retro-anime-dark/retro-anime-dark3.webp',
        '/examples/loras/retro-anime-dark/retro-anime-dark4.webp'
    ],
    'anime-detailed-eyes': [
        '/examples/loras/anime-detailed-eyes/anime-detailed-eyes1.webp',
        '/examples/loras/anime-detailed-eyes/anime-detailed-eyes2.webp',
        '/examples/loras/anime-detailed-eyes/anime-detailed-eyes3.webp',
        '/examples/loras/anime-detailed-eyes/anime-detailed-eyes4.webp'
    ],
    'luminous-shadows-cape': [
        '/examples/loras/luminous-shadows-cape/luminous-shadows-cape1.webp',
        '/examples/loras/luminous-shadows-cape/luminous-shadows-cape2.webp',
        '/examples/loras/luminous-shadows-cape/luminous-shadows-cape3.webp',
        '/examples/loras/luminous-shadows-cape/luminous-shadows-cape4.webp'
    ],
    'faetastic-details': [
        '/examples/loras/faetastic-details/faetastic-details1.webp',
        '/examples/loras/faetastic-details/faetastic-details2.webp',
        '/examples/loras/faetastic-details/faetastic-details3.webp',
        '/examples/loras/faetastic-details/faetastic-details4.webp'
    ],
    'storybook-artstyle': [
        '/examples/loras/storybook-artstyle/storybook-artstyle1.webp',
        '/examples/loras/storybook-artstyle/storybook-artstyle2.webp',
        '/examples/loras/storybook-artstyle/storybook-artstyle3.webp',
        '/examples/loras/storybook-artstyle/storybook-artstyle4.webp'
    ],
    'castlevania-art-style': [
        '/examples/loras/castlevania-art-style/castlevania-art-style1.webp',
        '/examples/loras/castlevania-art-style/castlevania-art-style2.webp',
        '/examples/loras/castlevania-art-style/castlevania-art-style3.webp',
        '/examples/loras/castlevania-art-style/castlevania-art-style4.webp'
    ],
    'retro-anime': [
        '/examples/loras/retro-anime/retro-anime1.webp',
        '/examples/loras/retro-anime/retro-anime2.webp',
        '/examples/loras/retro-anime/retro-anime3.webp',
        '/examples/loras/retro-anime/retro-anime4.webp'
    ],
    'arcane-intro-style': [
        '/examples/loras/arcane-intro-style/arcane-intro-style1.webp',
        '/examples/loras/arcane-intro-style/arcane-intro-style2.webp',
        '/examples/loras/arcane-intro-style/arcane-intro-style3.webp',
        '/examples/loras/arcane-intro-style/arcane-intro-style4.webp'
    ],
    'midjourney-style': [
        '/examples/loras/midjourney-style/midjourney-style1.webp',
        '/examples/loras/midjourney-style/midjourney-style2.webp',
        '/examples/loras/midjourney-style/midjourney-style3.webp',
        '/examples/loras/midjourney-style/midjourney-style4.webp'
    ],
    'animelike-digital-painting': [
        '/examples/loras/animelike-digital-painting/animelike-digital-painting1.webp',
        '/examples/loras/animelike-digital-painting/animelike-digital-painting2.webp',
        '/examples/loras/animelike-digital-painting/animelike-digital-painting3.webp',
        '/examples/loras/animelike-digital-painting/animelike-digital-painting4.webp'
    ],
    'glitch-effect': [
        '/examples/loras/glitch-effect/glitch-effect1.webp',
        '/examples/loras/glitch-effect/glitch-effect2.webp',
        '/examples/loras/glitch-effect/glitch-effect3.webp',
        '/examples/loras/glitch-effect/glitch-effect4.webp'
    ],
    'gothicniji': [
        '/examples/loras/gothicniji/gothicniji1.webp',
        '/examples/loras/gothicniji/gothicniji2.webp',
        '/examples/loras/gothicniji/gothicniji3.webp',
        '/examples/loras/gothicniji/gothicniji4.webp'
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
    'commodore-64': [
        '/examples/loras/commodore-64/1.webp',
        '/examples/loras/commodore-64/2.webp',
        '/examples/loras/commodore-64/3.webp',
        '/examples/loras/commodore-64/4.webp'
    ],
    'ghibliesque': [
        '/examples/loras/ghibliesque/1.webp',
        '/examples/loras/ghibliesque/2.webp',
        '/examples/loras/ghibliesque/3.webp',
        '/examples/loras/ghibliesque/4.webp'
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
        '/examples/loras/blender-style/blender-style1.webp',
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
    'darkcore': [
        '/examples/loras/darkcore/1.webp',
        '/examples/loras/darkcore/2.webp',
        '/examples/loras/darkcore/3.webp',
        '/examples/loras/darkcore/4.webp'
    ]
};

// component for preview modal
const PreviewModal = ({ examples, isOpen, onClose, loraName, initialImage }) => {
    const [currentImage, setCurrentImage] = useState(initialImage);

    // Reset currentImage when modal opens with new initialImage
    useEffect(() => {
        if (isOpen) {
            setCurrentImage(initialImage);
        }
    }, [isOpen, initialImage]);

    if (!isOpen || !examples) return null;

    return (
        <div className="preview-modal-overlay" onClick={onClose}>
            <div className="preview-modal" onClick={e => e.stopPropagation()}>
                <h4>{loraName}</h4>
                <div className="preview-modal-content">
                    <div className="preview-main-image">
                        <img src={examples[currentImage]} alt="Style example" />
                    </div>
                    <div className="preview-thumbnails">
                        {examples.map((img, idx) => (
                            <img 
                                key={idx}
                                src={img}
                                alt={`Thumbnail ${idx + 1}`}
                                className={currentImage === idx ? 'active' : ''}
                                onClick={() => setCurrentImage(idx)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Update LoraItem component to pass the clicked image index
const LoraItem = ({ lora, isSelected, onToggle, onWeightChange, weight, onPreviewClick }) => {
    const handleWeightChange = (e) => {
        const newWeight = parseFloat(e.target.value);
        onWeightChange(lora.url, newWeight); // Pass lora.url and the new weight value
    };

    return (
        <div className="lora-item">
            <div className="lora-item-header">
                <label>
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={onToggle}
                    />
                    {lora.name}
                </label>
            </div>
            {isSelected && (
                <div className="lora-controls">
                    <input
                        type="range"
                        min="0.05"
                        max="1"
                        step="0.05"
                        value={weight || 0} // Ensure there's always a value
                        onChange={handleWeightChange}
                    />
                    <span>{(weight || 0).toFixed(2)}</span>
                </div>
            )}
            <div className="thumbnail-strip">
                {loraExamples[lora.id]?.map((img, idx) => (
                    <img 
                        key={idx}
                        src={img}
                        alt="Thumbnail"
                        className="mini-thumbnail"
                        onClick={() => onPreviewClick(lora.id, lora.name, idx)} // Pass the index
                    />
                ))}
            </div>
        </div>
    );
};

// Update main LoraSelector component
const LoraSelector = ({ selectedLoras, setSelectedLoras, isOpen, onClose }) => {
    // Helper function moved inside component scope
    const formatLorasForRunware = (loras) => {
        return Object.entries(loras)
            .filter(([_, weight]) => weight > 0 && weight !== null && weight !== undefined)
            .map(([model, weight]) => ({
                model,
                weight: parseFloat(weight)
            }));
    };

    const [previewModal, setPreviewModal] = useState({
        isOpen: false,
        loraId: null,
        loraName: '',
        initialImage: 0 // Add this to track initial image
    });

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
            const newState = { ...prev };
            
            if (prev[lora.url]) {
                // Remove the lora completely instead of setting to 0
                delete newState[lora.url];
            } else {
                // Add new lora with default weight
                newState[lora.url] = lora.defaultWeight;
            }
            
            return newState;
        });
    };

    const updateWeight = (loraId, weight, loraArray) => {
        const lora = loraArray.find(l => l.id === loraId);
        setSelectedLoras(prev => ({
            ...prev,
            [lora.url]: parseFloat(weight) // Keep it even when weight is 0
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

    const handlePreviewClick = (loraId, loraName, imageIndex = 0) => {
        setPreviewModal({
            isOpen: true,
            loraId,
            loraName,
            initialImage: imageIndex // Set the initial image index
        });
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
                            <LoraItem
                                key={lora.id}
                                lora={lora}
                                isSelected={!!selectedLoras[lora.url]}
                                onToggle={() => toggleLora(lora.id, loras)}
                                onWeightChange={(url, weight) => updateWeight(lora.id, weight, loras)} // Fix here
                                weight={selectedLoras[lora.url] || lora.defaultWeight}
                                onPreviewClick={handlePreviewClick}
                            />
                        ))}
                    </div>
                )}
            </>
        );
    };

    // Add this handler for the overlay click
    const handleOverlayClick = (e) => {
        if (previewModal.isOpen) {
            // If preview modal is open, don't close the LoraSelector
            e.stopPropagation();
        } else {
            // If preview modal is closed, allow LoraSelector to close
            onClose();
        }
    };

    if (!isOpen) return null;

    // Now we can use formatLorasForRunware with selectedLoras inside component
    const formattedLoras = formatLorasForRunware(selectedLoras);

    return (
        <div className="lora-overlay" onClick={handleOverlayClick}>
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
            <PreviewModal
                examples={previewModal.loraId ? loraExamples[previewModal.loraId] : null}
                isOpen={previewModal.isOpen}
                onClose={() => setPreviewModal(prev => ({ ...prev, isOpen: false }))}
                loraName={previewModal.loraName}
                initialImage={previewModal.initialImage} // Pass the initial image index
            />
        </div>
    );
};

export default LoraSelector;