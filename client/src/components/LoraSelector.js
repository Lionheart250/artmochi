import React, { useState, useEffect, useRef, useCallback } from 'react';
import './LoraSelector.css';

export const artisticLoras = [
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
        id: 'luminous-shadows-cape',
        name: '🌙 Luminous Shadows',
        defaultWeight: 1.0,
        url: 'civitai:707312@791149'
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
        id: 'animelike-digital-painting',
        name: '🖌️ Digital paint',
        defaultWeight: 1.0,
        url: 'civitai:1050516@1178753'
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
        name: '🏰 Dark Fantasy anime',
        defaultWeight: 1.0,
        url: 'civitai:829155@927327'
    },
    {
        id: 'dark-anime',
        name: '🏰 Dark Anime',
        defaultWeight: 1.0,
        url: 'civitai:851695@952894'
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
        name: '💫 Pastel Dream',
        defaultWeight: 1.0,
        url: 'civitai:709014@793060'
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
        url: 'civitai:902162@1040356'
    },
    {
        id: 'neuro-cyberpunk',
        name: '🤖 Neuro Cyber',
        defaultWeight: 1.0,
        url: 'civitai:903057@1109173'
    },
    {
        id: 'cyberpunk-anime',
        name: '🌆 Cyber Anime',
        defaultWeight: 1.0,
        url: 'civitai:128568@747534'
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
        name: '✏️ Simple and Cute',
        defaultWeight: 1.0,
        url: 'civitai:1007718@1129397'
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
    {
        id: 'glitch-effect',  
        name: '🖌️ glitch effect',
        defaultWeight: 1.0,
        url: 'civitai:764243@854817'
    },
    {
        id: 'sexy-robots',
        name: '🚀 hot robots',
        defaultWeight: 1.0,
        url: 'civitai:812057@908077'
    },
];

export const realisticLoras = [
    {
        id: 'midjourney-style',
        name: '🎨 Dream Vision',
        defaultWeight: 1.0,
        url: 'civitai:1268816@1431182'
    },
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
        id: 'ethereal-dark',
        name: '🌑 Ethereal Dark',
        defaultWeight: 1.0,
        url: 'civitai:1024070@1148373'
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
        id: 'anime-detailed-eyes',
        name: '👁️ Soul Gaze',
        defaultWeight: 1.0,
        url: 'civitai:649378@726524'
    },
    {
        id: 'real-anime',
        name: '🎌 Real Anime',
        defaultWeight: 1.0,
        url: 'civitai:1131779@1272367'
    },
    {
        id: 'real-bimbo',
        name: '🎌 fishlips',
        defaultWeight: 1.0,
        url: 'civitai:1078433@1210699'
    },
    {
        id: 'realistic-80s-fantasy',
        name: '🎬 80s Dark Fantasy',
        defaultWeight: 1.0,
        url: 'civitai:836014@935339'
    },
    {
        id: 'realistic-60s',
        name: '🎥 60s Cinema',
        defaultWeight: 1.0,
        url: 'civitai:878199@983116'
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
        id: 'faetastic-details',
        name: '🧚 Fae Magic',
        defaultWeight: 1.0,
        url: 'civitai:643886@720252'
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
        url: 'civitai:810000@1067495'
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
        id: 'boring-reality',
        name: '✨ Boring Reality',
        defaultWeight: 1.0,
        url: 'civitai:639937@810340'
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
        name: '👻 emo style',
        defaultWeight: 1.0,
        url: 'civitai:687015@768888'
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
        url: 'civitai:71125@1135830'
    },
    {
        id: 'darkcore',
        name: '🌚 Darkness',
        defaultWeight: 1.0,
        url: 'civitai:667693@747357'
    },
    {
        id: 'anime-makeup',
        name: '🌚 animakeup',
        defaultWeight: 1.0,
        url: 'civitai:946363@1059557'
    },
    {
        id: 'fangs',
        name: '🌚 fangs',
        defaultWeight: 1.0,
        url: 'civitai:690505@772807'
    },
    {
        id: 'tiktoker-style',
        name: '🌚 tiktoker',
        defaultWeight: 1.0,
        url: 'civitai:660973@739661'
    },
    {
        id: 'kbeauty-style',
        name: '🌚 k beauty',
        defaultWeight: 1.0,
        url: 'civitai:690545@772853'
    },
    {
        id: 'jpop-style',
        name: '🌚 jpop idol',
        defaultWeight: 1.0,
        url: 'civitai:730402@831457'
    },
    {
        id: 'kpop-style',
        name: '🌚 kpop idol',
        defaultWeight: 1.0,
        url: 'civitai:650848@728154'
    },
    {
        id: 'biotacean',
        name: '🌚 exoskelly',
        defaultWeight: 1.0,
        url: 'civitai:718932@803900'
    },
    {
        id: 'nightmare-thin',
        name: '🌚 Nightmare Skinny',
        defaultWeight: 1.0,
        url: 'civitai:1164450@1309935'
    },
    {
        id: 'nightmare-cyber',
        name: '🌚 Nightmare cyber',
        defaultWeight: 1.0,
        url: 'civitai:1132814@1273566'
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
    'luminous-shadows-cape': [
        '/examples/loras/luminous-shadows-cape/luminous-shadows-cape1.webp',
        '/examples/loras/luminous-shadows-cape/luminous-shadows-cape2.webp',
        '/examples/loras/luminous-shadows-cape/luminous-shadows-cape3.webp',
        '/examples/loras/luminous-shadows-cape/luminous-shadows-cape4.webp'
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
    'animelike-digital-painting': [
        '/examples/loras/animelike-digital-painting/animelike-digital-painting1.webp',
        '/examples/loras/animelike-digital-painting/animelike-digital-painting2.webp',
        '/examples/loras/animelike-digital-painting/animelike-digital-painting3.webp',
        '/examples/loras/animelike-digital-painting/animelike-digital-painting4.webp'
    ],
    'gothicniji': [
        '/examples/loras/gothicniji/gothicniji1.webp',
        '/examples/loras/gothicniji/gothicniji2.webp',
        '/examples/loras/gothicniji/gothicniji3.webp',
        '/examples/loras/gothicniji/gothicniji4.webp'
    ],
    'midjourneyanime': [
        '/examples/loras/midjourneyanime/midjourneyanime1.webp',
        '/examples/loras/midjourneyanime/midjourneyanime2.webp',
        '/examples/loras/midjourneyanime/midjourneyanime3.webp',
        '/examples/loras/midjourneyanime/midjourneyanime4.webp'
    ],
    'digital-abyss': [
        '/examples/loras/digital-abyss/digital-abyss1.webp',
        '/examples/loras/digital-abyss/digital-abyss2.webp',
        '/examples/loras/digital-abyss/digital-abyss3.webp',
        '/examples/loras/digital-abyss/digital-abyss4.webp'
    ],
    'frazetta-style': [
        '/examples/loras/frazetta-style/frazetta-style1.webp',
        '/examples/loras/frazetta-style/frazetta-style2.webp',
        '/examples/loras/frazetta-style/frazetta-style3.webp',
        '/examples/loras/frazetta-style/frazetta-style4.webp'
    ],
    'colored-pencil': [
        '/examples/loras/colored-pencil/colored-pencil1.webp',
        '/examples/loras/colored-pencil/colored-pencil2.webp',
        '/examples/loras/colored-pencil/colored-pencil3.webp',
        '/examples/loras/colored-pencil/colored-pencil4.webp'
    ],
    'dark-fantasy': [
        '/examples/loras/dark-fantasy/dark-fantasy1.webp',
        '/examples/loras/dark-fantasy/dark-fantasy2.webp',
        '/examples/loras/dark-fantasy/dark-fantasy3.webp',
        '/examples/loras/dark-fantasy/dark-fantasy4.webp'
    ],
    'dark-anime': [
        '/examples/loras/dark-anime/dark-anime1.webp',
        '/examples/loras/dark-anime/dark-anime2.webp',
        '/examples/loras/dark-anime/dark-anime3.webp',
        '/examples/loras/dark-anime/dark-anime4.webp'
    ],
    'weird-core': [
        '/examples/loras/weird-core/weird-core1.webp',
        '/examples/loras/weird-core/weird-core2.webp',
        '/examples/loras/weird-core/weird-core3.webp',
        '/examples/loras/weird-core/weird-core4.webp'
    ],
    'citron-style': [
        '/examples/loras/citron-style/citron-style1.webp',
        '/examples/loras/citron-style/citron-style2.webp',
        '/examples/loras/citron-style/citron-style3.webp',
        '/examples/loras/citron-style/citron-style4.webp'
    ],
    'anime-no-line': [
        '/examples/loras/anime-no-line/anime-no-line1.webp',
        '/examples/loras/anime-no-line/anime-no-line2.webp',
        '/examples/loras/anime-no-line/anime-no-line3.webp',
        '/examples/loras/anime-no-line/anime-no-line4.webp'
    ],
    'anime-digital-matte': [
        '/examples/loras/anime-digital-matte/anime-digital-matte1.webp',
        '/examples/loras/anime-digital-matte/anime-digital-matte2.webp',
        '/examples/loras/anime-digital-matte/anime-digital-matte3.webp',
        '/examples/loras/anime-digital-matte/anime-digital-matte4.webp'
    ],
    'dream-world': [
        '/examples/loras/dream-world/dream-world1.webp',
        '/examples/loras/dream-world/dream-world2.webp',
        '/examples/loras/dream-world/dream-world3.webp',
        '/examples/loras/dream-world/dream-world4.webp'
    ],
    'anime-gloss': [
        '/examples/loras/anime-gloss/anime-gloss1.webp',
        '/examples/loras/anime-gloss/anime-gloss2.webp',
        '/examples/loras/anime-gloss/anime-gloss3.webp',
        '/examples/loras/anime-gloss/anime-gloss4.webp'
    ],
    'anime-patootie': [
        '/examples/loras/anime-patootie/anime-patootie1.webp',
        '/examples/loras/anime-patootie/anime-patootie2.webp',
        '/examples/loras/anime-patootie/anime-patootie3.webp',
        '/examples/loras/anime-patootie/anime-patootie4.webp'
    ],
    'ghibliesque': [
        '/examples/loras/ghibliesque/ghibliesque1.webp',
        '/examples/loras/ghibliesque/ghibliesque2.webp',
        '/examples/loras/ghibliesque/ghibliesque3.webp',
        '/examples/loras/ghibliesque/ghibliesque4.webp'
    ],
    'anime-ink': [
        '/examples/loras/anime-ink/anime-ink1.webp',
        '/examples/loras/anime-ink/anime-ink2.webp',
        '/examples/loras/anime-ink/anime-ink3.webp',
        '/examples/loras/anime-ink/anime-ink4.webp'
    ],
    'painting-realm': [
        '/examples/loras/painting-realm/painting-realm1.webp',
        '/examples/loras/painting-realm/painting-realm2.webp',
        '/examples/loras/painting-realm/painting-realm3.webp',
        '/examples/loras/painting-realm/painting-realm4.webp'
    ],
    'impressionist': [
        '/examples/loras/impressionist/impressionist1.webp',
        '/examples/loras/impressionist/impressionist2.webp',
        '/examples/loras/impressionist/impressionist3.webp',
        '/examples/loras/impressionist/impressionist4.webp'
    ],
    'mai-colors': [
        '/examples/loras/mai-colors/mai-colors1.webp',
        '/examples/loras/mai-colors/mai-colors2.webp',
        '/examples/loras/mai-colors/mai-colors3.webp',
        '/examples/loras/mai-colors/mai-colors4.webp'
    ],
    'neuro-cyberpunk': [
        '/examples/loras/neuro-cyberpunk/neuro-cyberpunk1.webp',
        '/examples/loras/neuro-cyberpunk/neuro-cyberpunk2.webp',
        '/examples/loras/neuro-cyberpunk/neuro-cyberpunk3.webp',
        '/examples/loras/neuro-cyberpunk/neuro-cyberpunk4.webp'
    ],
    'cyberpunk-anime': [
        '/examples/loras/cyberpunk-anime/cyberpunk-anime1.webp',
        '/examples/loras/cyberpunk-anime/cyberpunk-anime2.webp',
        '/examples/loras/cyberpunk-anime/cyberpunk-anime3.webp',
        '/examples/loras/cyberpunk-anime/cyberpunk-anime4.webp'
    ],
    'anime-niji': [
        '/examples/loras/anime-niji/anime-niji1.webp',
        '/examples/loras/anime-niji/anime-niji2.webp',
        '/examples/loras/anime-niji/anime-niji3.webp',
        '/examples/loras/anime-niji/anime-niji4.webp'
    ],
    'neon-fantasy': [
        '/examples/loras/neon-fantasy/neon-fantasy1.webp',
        '/examples/loras/neon-fantasy/neon-fantasy2.webp',
        '/examples/loras/neon-fantasy/neon-fantasy3.webp',
        '/examples/loras/neon-fantasy/neon-fantasy4.webp'
    ],
    'anime-shadow-circuit': [
        '/examples/loras/anime-shadow-circuit/anime-shadow-circuit1.webp',
        '/examples/loras/anime-shadow-circuit/anime-shadow-circuit2.webp',
        '/examples/loras/anime-shadow-circuit/anime-shadow-circuit3.webp',
        '/examples/loras/anime-shadow-circuit/anime-shadow-circuit4.webp'
    ],
    'details-colored-pencil': [
        '/examples/loras/details-colored-pencil/details-colored-pencil1.webp',
        '/examples/loras/details-colored-pencil/details-colored-pencil2.webp',
        '/examples/loras/details-colored-pencil/details-colored-pencil3.webp',
        '/examples/loras/details-colored-pencil/details-colored-pencil4.webp'
    ],
    'blender-style': [
        '/examples/loras/blender-style/blender-style1.webp',
        '/examples/loras/blender-style/blender-style2.webp',
        '/examples/loras/blender-style/blender-style3.webp',
        '/examples/loras/blender-style/blender-style4.webp'
    ],
    'pixel-art': [
        '/examples/loras/pixel-art/pixel-art1.webp',
        '/examples/loras/pixel-art/pixel-art2.webp',
        '/examples/loras/pixel-art/pixel-art3.webp',
        '/examples/loras/pixel-art/pixel-art4.webp'
    ],
    'new-future': [
        '/examples/loras/new-future/new-future1.webp',
        '/examples/loras/new-future/new-future2.webp',
        '/examples/loras/new-future/new-future3.webp',
        '/examples/loras/new-future/new-future4.webp'
    ],
    'glitch-effect': [
        '/examples/loras/glitch-effect/glitch-effect1.webp',
        '/examples/loras/glitch-effect/glitch-effect2.webp',
        '/examples/loras/glitch-effect/glitch-effect3.webp',
        '/examples/loras/glitch-effect/glitch-effect4.webp'
    ],
    'sexy-robots': [
        '/examples/loras/sexy-robots/sexy-robots1.webp',
        '/examples/loras/sexy-robots/sexy-robots2.webp',
        '/examples/loras/sexy-robots/sexy-robots3.webp',
        '/examples/loras/sexy-robots/sexy-robots4.webp'
    ],
    // Realistic LoRAs
    'midjourney-style': [
        '/examples/loras/midjourney-style/midjourney-style1.webp',
        '/examples/loras/midjourney-style/midjourney-style2.webp',
        '/examples/loras/midjourney-style/midjourney-style3.webp',
        '/examples/loras/midjourney-style/midjourney-style4.webp'
    ],
    'dramatic-lighting': [
        '/examples/loras/dramatic-lighting/dramatic-lighting1.webp',
        '/examples/loras/dramatic-lighting/dramatic-lighting2.webp',
        '/examples/loras/dramatic-lighting/dramatic-lighting3.webp',
        '/examples/loras/dramatic-lighting/dramatic-lighting4.webp'
    ],
    'image-upgrader': [
        '/examples/loras/image-upgrader/image-upgrader1.webp',
        '/examples/loras/image-upgrader/image-upgrader2.webp',
        '/examples/loras/image-upgrader/image-upgrader3.webp',
        '/examples/loras/image-upgrader/image-upgrader4.webp'
    ],
    'ethereal-dark': [
        '/examples/loras/ethereal-dark/ethereal-dark1.webp',
        '/examples/loras/ethereal-dark/ethereal-dark2.webp',
        '/examples/loras/ethereal-dark/ethereal-dark3.webp',
        '/examples/loras/ethereal-dark/ethereal-dark4.webp'
    ],
    'cyber-graphic': [
        '/examples/loras/cyber-graphic/cyber-graphic1.webp',
        '/examples/loras/cyber-graphic/cyber-graphic2.webp',
        '/examples/loras/cyber-graphic/cyber-graphic3.webp',
        '/examples/loras/cyber-graphic/cyber-graphic4.webp'
    ],
    'elden-ring-style': [
        '/examples/loras/elden-ring-style/elden-ring-style1.webp',
        '/examples/loras/elden-ring-style/elden-ring-style2.webp',
        '/examples/loras/elden-ring-style/elden-ring-style3.webp',
        '/examples/loras/elden-ring-style/elden-ring-style4.webp'
    ],
    'neon-lighting': [
        '/examples/loras/neon-lighting/neon-lighting1.webp',
        '/examples/loras/neon-lighting/neon-lighting2.webp',
        '/examples/loras/neon-lighting/neon-lighting3.webp',
        '/examples/loras/neon-lighting/neon-lighting4.webp'
    ],
    'turbo-detailer': [
        '/examples/loras/turbo-detailer/turbo-detailer1.webp',
        '/examples/loras/turbo-detailer/turbo-detailer2.webp',
        '/examples/loras/turbo-detailer/turbo-detailer3.webp',
        '/examples/loras/turbo-detailer/turbo-detailer4.webp'
    ],
    'analog-grainy': [
        '/examples/loras/analog-grainy/analog-grainy1.webp',
        '/examples/loras/analog-grainy/analog-grainy2.webp',
        '/examples/loras/analog-grainy/analog-grainy3.webp',
        '/examples/loras/analog-grainy/analog-grainy4.webp'
    ],
    'portrait-style': [
        '/examples/loras/portrait-style/portrait-style1.webp',
        '/examples/loras/portrait-style/portrait-style2.webp',
        '/examples/loras/portrait-style/portrait-style3.webp',
        '/examples/loras/portrait-style/portrait-style4.webp'
    ],
    'realistic-skin': [
        '/examples/loras/realistic-skin/realistic-skin1.webp',
        '/examples/loras/realistic-skin/realistic-skin2.webp',
        '/examples/loras/realistic-skin/realistic-skin3.webp',
        '/examples/loras/realistic-skin/realistic-skin4.webp'
    ],
    'realistic-horror': [
        '/examples/loras/realistic-horror/realistic-horror1.webp',
        '/examples/loras/realistic-horror/realistic-horror2.webp',
        '/examples/loras/realistic-horror/realistic-horror3.webp',
        '/examples/loras/realistic-horror/realistic-horror4.webp'
    ],
    'ultra-realistic': [
        '/examples/loras/ultra-realistic/ultra-realistic1.webp',
        '/examples/loras/ultra-realistic/ultra-realistic2.webp',
        '/examples/loras/ultra-realistic/ultra-realistic3.webp',
        '/examples/loras/ultra-realistic/ultra-realistic4.webp'
    ], 
    'fantasy-wizards-witches': [
        '/examples/loras/fantasy-wizards-witches/fantasy-wizards-witches1.webp',
        '/examples/loras/fantasy-wizards-witches/fantasy-wizards-witches2.webp',
        '/examples/loras/fantasy-wizards-witches/fantasy-wizards-witches3.webp',
        '/examples/loras/fantasy-wizards-witches/fantasy-wizards-witches4.webp'
    ],
    'anime-detailed-eyes': [
        '/examples/loras/anime-detailed-eyes/anime-detailed-eyes1.webp',
        '/examples/loras/anime-detailed-eyes/anime-detailed-eyes2.webp',
        '/examples/loras/anime-detailed-eyes/anime-detailed-eyes3.webp',
        '/examples/loras/anime-detailed-eyes/anime-detailed-eyes4.webp'
    ],
    'real-anime': [
        '/examples/loras/real-anime/real-anime1.webp',
        '/examples/loras/real-anime/real-anime2.webp',
        '/examples/loras/real-anime/real-anime3.webp',
        '/examples/loras/real-anime/real-anime4.webp'
    ],
    'real-bimbo': [
        '/examples/loras/real-bimbo/real-bimbo1.webp',
        '/examples/loras/real-bimbo/real-bimbo2.webp',
        '/examples/loras/real-bimbo/real-bimbo3.webp',
        '/examples/loras/real-bimbo/real-bimbo4.webp'
    ],
    'realistic-80s-fantasy': [
        '/examples/loras/realistic-80s-fantasy/realistic-80s-fantasy1.webp',
        '/examples/loras/realistic-80s-fantasy/realistic-80s-fantasy2.webp',
        '/examples/loras/realistic-80s-fantasy/realistic-80s-fantasy3.webp',
        '/examples/loras/realistic-80s-fantasy/realistic-80s-fantasy4.webp'
    ],
    'realistic-60s': [
        '/examples/loras/realistic-60s/realistic-60s1.webp',
        '/examples/loras/realistic-60s/realistic-60s2.webp',
        '/examples/loras/realistic-60s/realistic-60s3.webp',
        '/examples/loras/realistic-60s/realistic-60s4.webp'
    ],
    'surreal-landscapes': [
        '/examples/loras/surreal-landscapes/surreal-landscapes1.webp',
        '/examples/loras/surreal-landscapes/surreal-landscapes2.webp',
        '/examples/loras/surreal-landscapes/surreal-landscapes3.webp',
        '/examples/loras/surreal-landscapes/surreal-landscapes4.webp'
    ],
    'opal-style': [
        '/examples/loras/opal-style/opal-style1.webp',
        '/examples/loras/opal-style/opal-style2.webp',
        '/examples/loras/opal-style/opal-style3.webp',
        '/examples/loras/opal-style/opal-style4.webp'
    ],
    'faetastic-details': [
        '/examples/loras/faetastic-details/faetastic-details1.webp',
        '/examples/loras/faetastic-details/faetastic-details2.webp',
        '/examples/loras/faetastic-details/faetastic-details3.webp',
        '/examples/loras/faetastic-details/faetastic-details4.webp'
    ],
    'liminal-space': [
        '/examples/loras/liminal-space/liminal-space1.webp',
        '/examples/loras/liminal-space/liminal-space2.webp',
        '/examples/loras/liminal-space/liminal-space3.webp',
        '/examples/loras/liminal-space/liminal-space4.webp'
    ],
    'retro-future': [
        '/examples/loras/retro-future/retro-future1.webp',
        '/examples/loras/retro-future/retro-future2.webp',
        '/examples/loras/retro-future/retro-future3.webp',
        '/examples/loras/retro-future/retro-future4.webp'
    ],
    'new-fantasy-core': [
        '/examples/loras/new-fantasy-core/new-fantasy-core1.webp',
        '/examples/loras/new-fantasy-core/new-fantasy-core2.webp',
        '/examples/loras/new-fantasy-core/new-fantasy-core3.webp',
        '/examples/loras/new-fantasy-core/new-fantasy-core4.webp'
    ],
    /////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////
    'future-fashion': [ //////////////////////////////////////////////////////////////////////////////////
        '/examples/loras/future-fashion/future-fashion1.webp',
        '/examples/loras/future-fashion/future-fashion2.webp',
        '/examples/loras/future-fashion/future-fashion3.webp',
        '/examples/loras/future-fashion/future-fashion4.webp'
    ],
    'epic-details': [
        '/examples/loras/epic-details/epic-details1.webp',
        '/examples/loras/epic-details/epic-details2.webp',
        '/examples/loras/epic-details/epic-details3.webp',
        '/examples/loras/epic-details/epic-details4.webp'
    ],
    'impossible-geometry': [
        '/examples/loras/impossible-geometry/impossible-geometry1.webp',
        '/examples/loras/impossible-geometry/impossible-geometry2.webp',
        '/examples/loras/impossible-geometry/impossible-geometry3.webp',
        '/examples/loras/impossible-geometry/impossible-geometry4.webp'
    ],
    'vintage-neon': [
        '/examples/loras/vintage-neon/vintage-neon1.webp',
        '/examples/loras/vintage-neon/vintage-neon2.webp',
        '/examples/loras/vintage-neon/vintage-neon3.webp',
        '/examples/loras/vintage-neon/vintage-neon4.webp'
    ],
    'semi-realistic': [
        '/examples/loras/semi-realistic/semi-realistic1.webp',
        '/examples/loras/semi-realistic/semi-realistic2.webp',
        '/examples/loras/semi-realistic/semi-realistic3.webp',
        '/examples/loras/semi-realistic/semi-realistic4.webp'
    ],
    'boring-reality': [
        '/examples/loras/boring-reality/boring-reality1.webp',
        '/examples/loras/boring-reality/boring-reality2.webp',
        '/examples/loras/boring-reality/boring-reality3.webp',
        '/examples/loras/boring-reality/boring-reality4.webp'
    ],
    'gold-leaf': [
        '/examples/loras/gold-leaf/gold-leaf1.webp',
        '/examples/loras/gold-leaf/gold-leaf2.webp',
        '/examples/loras/gold-leaf/gold-leaf3.webp',
        '/examples/loras/gold-leaf/gold-leaf4.webp'
    ],
    'fantasy-scifi': [
        '/examples/loras/fantasy-scifi/fantasy-scifi1.webp',
        '/examples/loras/fantasy-scifi/fantasy-scifi2.webp',
        '/examples/loras/fantasy-scifi/fantasy-scifi3.webp',
        '/examples/loras/fantasy-scifi/fantasy-scifi4.webp'
    ],
    'neogods': [
        '/examples/loras/neogods/neogods1.webp',
        '/examples/loras/neogods/neogods2.webp',
        '/examples/loras/neogods/neogods3.webp',
        '/examples/loras/neogods/neogods4.webp'
    ],
    'vintage-abstract': [
        '/examples/loras/vintage-abstract/vintage-abstract1.webp',
        '/examples/loras/vintage-abstract/vintage-abstract2.webp',
        '/examples/loras/vintage-abstract/vintage-abstract3.webp',
        '/examples/loras/vintage-abstract/vintage-abstract4.webp'
    ],
    'spooky-vibes': [
        '/examples/loras/spooky-vibes/spooky-vibes1.webp',
        '/examples/loras/spooky-vibes/spooky-vibes2.webp',
        '/examples/loras/spooky-vibes/spooky-vibes3.webp',
        '/examples/loras/spooky-vibes/spooky-vibes4.webp'
    ],
    'fantasy-enhancer': [
        '/examples/loras/fantasy-enhancer/fantasy-enhancer1.webp',
        '/examples/loras/fantasy-enhancer/fantasy-enhancer2.webp',
        '/examples/loras/fantasy-enhancer/fantasy-enhancer3.webp',
        '/examples/loras/fantasy-enhancer/fantasy-enhancer4.webp'
    ],
    '2000s-social': [
        '/examples/loras/2000s-social/2000s-social1.webp',
        '/examples/loras/2000s-social/2000s-social2.webp',
        '/examples/loras/2000s-social/2000s-social3.webp',
        '/examples/loras/2000s-social/2000s-social4.webp'
    ],
    'darkcore': [
        '/examples/loras/darkcore/darkcore1.webp',
        '/examples/loras/darkcore/darkcore2.webp',
        '/examples/loras/darkcore/darkcore3.webp',
        '/examples/loras/darkcore/darkcore4.webp'
    ],
    'anime-makeup': [   
        '/examples/loras/anime-makeup/anime-makeup1.webp',
        '/examples/loras/anime-makeup/anime-makeup2.webp',
        '/examples/loras/anime-makeup/anime-makeup3.webp',
        '/examples/loras/anime-makeup/anime-makeup4.webp'
    ],
    'fangs': [   
        '/examples/loras/fangs/fangs1.webp',
        '/examples/loras/fangs/fangs2.webp',
        '/examples/loras/fangs/fangs3.webp',
        '/examples/loras/fangs/fangs4.webp'
    ],
    'tiktoker-style': [
        '/examples/loras/tiktoker-style/tiktoker-style1.webp',  
        '/examples/loras/tiktoker-style/tiktoker-style2.webp',
        '/examples/loras/tiktoker-style/tiktoker-style3.webp',
        '/examples/loras/tiktoker-style/tiktoker-style4.webp'
    ],
    'kbeauty-style': [
        '/examples/loras/kbeauty-style/kbeauty-style1.webp',
        '/examples/loras/kbeauty-style/kbeauty-style2.webp',
        '/examples/loras/kbeauty-style/kbeauty-style3.webp',
        '/examples/loras/kbeauty-style/kbeauty-style4.webp'
    ],
    'jpop-style': [
        '/examples/loras/jpop-style/jpop-style1.webp',
        '/examples/loras/jpop-style/jpop-style2.webp',
        '/examples/loras/jpop-style/jpop-style3.webp',
        '/examples/loras/jpop-style/jpop-style4.webp'
    ],
    'kpop-style': [
        '/examples/loras/kpop-style/kpop-style1.webp',
        '/examples/loras/kpop-style/kpop-style2.webp',
        '/examples/loras/kpop-style/kpop-style3.webp',
        '/examples/loras/kpop-style/kpop-style4.webp'
    ],
    'biotacean': [
        '/examples/loras/biotacean/biotacean1.webp',
        '/examples/loras/biotacean/biotacean2.webp',
        '/examples/loras/biotacean/biotacean3.webp',
        '/examples/loras/biotacean/biotacean4.webp'
    ],
    'nightmare-thin': [
        '/examples/loras/nightmare-thin/nightmare-thin1.webp',
        '/examples/loras/nightmare-thin/nightmare-thin2.webp',
        '/examples/loras/nightmare-thin/nightmare-thin3.webp',
        '/examples/loras/nightmare-thin/nightmare-thin4.webp'
    ],
    'nightmare-cyber': [
        '/examples/loras/nightmare-cyber/nightmare-cyber1.webp',
        '/examples/loras/nightmare-cyber/nightmare-cyber2.webp',
        '/examples/loras/nightmare-cyber/nightmare-cyber3.webp',
        '/examples/loras/nightmare-cyber/nightmare-cyber4.webp'
    ],
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
    const handleClick = (e) => {
        // Don't toggle if clicking on controls or thumbnails
        if (
            e.target.type === 'range' || 
            e.target.className === 'mini-thumbnail' ||
            e.target.className.includes('lora-controls')
        ) {
            return;
        }
        onToggle();
    };

    const handleWeightChange = (e) => {
        e.stopPropagation(); // Prevent item click when adjusting slider
        const newWeight = parseFloat(e.target.value);
        onWeightChange(lora.url, newWeight);
    };

    return (
        <div 
            className={`lora-item ${isSelected ? 'selected' : ''}`}
            onClick={handleClick}
            role="button"
            tabIndex={0}
        >
            <div className="lora-item-header">
                <label onClick={e => e.stopPropagation()}>
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={onToggle}
                    />
                    {lora.name}
                </label>
            </div>
            {isSelected && (
                <div className="lora-controls" onClick={e => e.stopPropagation()}>
                    <input
                        type="range"
                        min="0.05"
                        max="1"
                        step="0.05"
                        value={weight || 0}
                        onChange={handleWeightChange}
                    />
                    <span>{(weight || 0).toFixed(2)}</span>
                </div>
            )}
            <div className="thumbnail-strip" onClick={e => e.stopPropagation()}>
                {loraExamples[lora.id]?.map((img, idx) => (
                    <img 
                        key={idx}
                        src={img}
                        alt="Thumbnail"
                        className="mini-thumbnail"
                        onClick={(e) => {
                            e.stopPropagation();
                            onPreviewClick(lora.id, lora.name, idx);
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

// Update main LoraSelector component
const LoraSelector = ({ selectedLoras, setSelectedLoras, isOpen, onClose }) => {
    const [previewModal, setPreviewModal] = useState({
        isOpen: false,
        loraId: null,
        loraName: '',
        initialImage: 0
    });

    const [artisticExpanded, setArtisticExpanded] = useState(true);
    const [realisticExpanded, setRealisticExpanded] = useState(true);
    
    // Refs for scroll positions
    const artisticColumnRef = useRef(null);
    const realisticColumnRef = useRef(null);
    const lastScrollPosition = useRef({ artistic: 0, realistic: 0 });

    // Save scroll position when scrolling
    const handleScroll = (type) => {
        const position = type === 'artistic' ? 
            artisticColumnRef.current?.scrollTop : 
            realisticColumnRef.current?.scrollTop;
            
        lastScrollPosition.current[type] = position;
    };

    // Add scroll event listeners
    useEffect(() => {
        if (isOpen) {
            const artistic = artisticColumnRef.current;
            const realistic = realisticColumnRef.current;

            if (artistic) {
                artistic.scrollTop = lastScrollPosition.current.artistic;
                artistic.addEventListener('scroll', () => handleScroll('artistic'));
            }
            if (realistic) {
                realistic.scrollTop = lastScrollPosition.current.realistic;
                realistic.addEventListener('scroll', () => handleScroll('realistic'));
            }

            return () => {
                artistic?.removeEventListener('scroll', () => handleScroll('artistic'));
                realistic?.removeEventListener('scroll', () => handleScroll('realistic'));
            };
        }
    }, [isOpen]);

    // Helper function moved inside component scope
    const formatLorasForRunware = (loras) => {
        return Object.entries(loras)
            .filter(([_, weight]) => weight > 0 && weight !== null && weight !== undefined)
            .map(([model, weight]) => ({
                model,
                weight: parseFloat(weight)
            }));
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

    // Update renderLoraSection to use refs
    const renderLoraSectionWithRef = (loras, expanded, setExpanded, title, emoji, columnRef) => {
        return (
            <>
                <div className="section-header" onClick={() => setExpanded(!expanded)}>
                    <h3>{emoji} {title} {expanded ? '▼' : '▶'}</h3>
                </div>
                {expanded && (
                    <div className="lora-section lora-grid" ref={columnRef}>
                        {loras.map(lora => (
                            <LoraItem
                                key={lora.id}
                                lora={lora}
                                isSelected={!!selectedLoras[lora.url]}
                                onToggle={() => toggleLora(lora.id, loras)}
                                onWeightChange={(url, weight) => updateWeight(lora.id, weight, loras)}
                                weight={selectedLoras[lora.url] || lora.defaultWeight}
                                onPreviewClick={handlePreviewClick}
                            />
                        ))}
                    </div>
                )}
            </>
        );
    };

    return (
        <div className="lora-overlay" onClick={handleOverlayClick}>
            <div className="loraselector-popup" onClick={e => e.stopPropagation()}>
                <div className="loraselector-popup-header">
                    <div className="lora-actions">
                        <h3>✨ Style Presets ✨</h3>
                        <div className="lora-action-buttons">
                            <button type="button" onClick={handleRandom} className="lora-action-btn primary">
                                🎲 Random Mix
                            </button>
                            <button type="button" onClick={handleRemoveAll} className="lora-action-btn">
                                Clear All
                            </button>
                            <button type="button" className="loraselector-close-button" onClick={onClose}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>

                <div className="lora-content">
                    <div className="lora-column" ref={artisticColumnRef}>
                        {renderLoraSection(artisticLoras, artisticExpanded, setArtisticExpanded, "Artistic & Anime", "🎨")}
                    </div>
                    <div className="lora-column" ref={realisticColumnRef}>
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