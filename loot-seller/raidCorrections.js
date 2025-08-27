// Centralized raid corrections and custom raids

const raidOverrides = {
    // Example: Override firstMessage for a specific raid
    '/view/durawiki/raids/thais-raids/mintwallin-heros': {
        firstMessage: 'Tales of Soohan\'s beauty have been shared throughout the ranks of men... They travel en masse to the islandwalks past Mintwallin in search of this fabled woman.',
        secondMessage: 'The suitors are too late... She has left these lands and with her absence the men turn forlorn and lonely.. dark womanly spirits come from across the ghostly lake seeking to rob them of their warmth.'
    },
    '/view/durawiki/raids/edron-raids/edron-orcs-worship': {
        secondMessage: 'Her wretched eggs burst! Longlegged horrors spill outward... The infestation has begun!'
    },
    "/view/durawiki/raids/thais-raids/fibula-dragon-lords": {
        firstMessage: 'The Dragons of Fibula are stirred from their slumbers by the hammers of the day and revelries of night, the minotaurs flee...',
        secondMessage: "The noise of shields only rankles them further.",
        bossMessage: `A lord of the dragon tears out of the earth....
		or
		A lord of the dragon swirls his tail in lava....`
    },
    "/view/durawiki/raids/abdendriel-raids/dwarven-underground-tunnels": {
        firstMessage: "WALLACE: DWARVES HAVE BEEN BUILDING SECRET UNDERGROUND TUNNELS UKNOWNST TO ALL! THEY MOVE NOW AFTER THE TREASURE OF THE AB'DENDRIEL ELVES!"
    },
    "/view/durawiki/raids/venore-raids/wolves-come-out": {
        firstMessage: "WALLACE: WOLVES COME OUT OF THE FOREST TO THE PLAINS!",
    },
    "/view/durawiki/raids/kazordoon-raids/army-of-orcs": {
        firstMessage: "An army of orcs cut across the midlands. Orcs don't go round hills, they go through them!"
    },
    "/view/durawiki/raids/carlin-raids/studious-minds": {
        secondMessage: "The Maze of Lost Souls presents an ideal destination. Beholder kin of both copper and ashen complexion migrate there hoping to mentally spar."
    },
    "/view/durawiki/raids/thais-raids/minotaurs-reveal-themselves": {
        firstMessage: "The Minotaurs reveal themselves from the torch-lit depths along with the evils that share their dwelling; the ancient caverns run with horned hordes."
    },
    "/view/durawiki/raids/ankrahmun-raids/khepresh-tortured-souls": {
        firstMessage: "Tortured souls cannot escape the Kepresh even in death.. Centuries of burning and branding imbue the sands and soil with an energy of pure vengeance."
    },
    "/view/durawiki/raids/edron-raids/orcs-bridged-to-edron": {
        firstMessage: "Orcs have bridged the sea between their homeland and Edron! Who can be safe while the orcs hazard our waters?"
    },
    "/view/durawiki/raids/thais-raids/beholders-mating": {
        firstMessage: "Beholders are gathering for their mating season along the cliffs of Mt Sternum. Their intelligence is matched by their orneriness at this time."
    },
    "/view/durawiki/raids/edron-raids/dragon-lords-in-cyclopolis": {
        firstMessage: "The Dragon Lords convene with the Behemoths; cunning with strength ...the air shrieks with fire and the ground rumbles with the steps of giants."
    },
    "/view/durawiki/raids/ankrahmun-raids/khazeel-djinns": {
        firstMessage: "With the Orcs failing their task, the Efreet of Mal'ouquah and the Marid of Ashta'daramai marshall their soldiers to pour out of their tall fortresses amidst the sky down into the high mountains of Kha'zeel..."
    },
    "/view/durawiki/raids/edron-raids/game-of-edron-grow-fattened": {
        firstMessage: "The game of Edron grow fattened and so the wolves follow. Amateur bandits emerge from their hideouts, eager to fill their bellies."
    },
    "/view/durawiki/raids/ankrahmun-raids/monks-into-the-tomb": {
        firstMessage: "Order from the Isle of Kings has dispatched warrior monks on crusade to purge the blasphemous tombs of the ancient kingdom; their spiritual fervor has ensnared the faith of many a bedouin."
    },
    "/view/durawiki/raids/venore-raids/blood-will-stain-the-plain": {
        firstMessage: "The Amazons cannot abide an all male society, they think it the epitome of chauvinism. The Men beg to differ! Male and Female blood will equally stain the plain."
    },
    "/view/durawiki/raids/edron-raids/hero-cave-tar-oozes": {
        firstMessage: "The only thing fouler than demons is the molten pits of evil from which they spawn..."
    },
    "/view/durawiki/raids/kazordoon-raids/depths-of-the-prison": {
        firstMessage: "Up from the depths of the prison colossal monsters threaten every smith with death who does not make a Giant's weapon."
    },
    "/view/durawiki/raids/ankrahmun-raids/khepresh-tortured-souls": {
        firstMessage: "Tortured souls cannot escape the Khepresh even in death.. Centuries of burning and branding imbue the sands and soil with an energy of pure vengeance."
    },
    "/view/durawiki/raids/edron-raids/edron-goblins": {
        firstMessage: "WALLACE: THE GOBLIN TRIBES MEET WITH THE CAVE TROLLS TO RAID THE CITIZENS OF EDRON FOR TASTY MAN FLESH!"
    },
    "/view/durawiki/raids/edron-raids/hives-honey": {
        firstMessage: "WALLACE:  THE HIVE'S HONEY YIELD IS RIPE FOR HARVEST IN CORMAYA. THE BEARS AWAKEN AND SEEK TO SATISFY THEIR SNOUTS!"
    },
    "/view/durawiki/raids/ankrahmun-raids/khazeel-tar-oozes": {
        firstMessage: "Kha'zeel is old and its sediments with it. The magic of Dragon and Djinn alike has seeped into the rocky ground over millenia. Spawned from within its mountain and caves come mindless and interminable horrors. To them rock and flesh are but the same; the bones of each victim become possessed by their trail."
    },
    "/view/durawiki/raids/venore-raids/poh-giant-spiders": {
        firstMessage: "It is mating season for the spiders of the plains. Their numbers are about to multiply... beware",
    },
    "/view/durawiki/raids/abdendriel-raids/draconia-dragons":
    {
        firstMessage: "The numbers are returning to Draconia, the city is wreathed not in carcasses but wing and flame once again...",
        secondMessage: "Red hides walk the shores... the sea breezes have let the dragons live into deep age.",
        bossMessage: "The shores seem once again rich enough to deserve his presence."
    },
    "/view/durawiki/raids/edron-raids/dragon-lords-in-cyclopolis":
    {
        firstMessage: "The Dragon Lords convene with the Behemoths; cunning with strength. ...the air shrieks with fire and the ground rumbles with the steps of giants.",
        bossMessage: "A monster reveals itself that gives terror to even the Lords of the Dragons..."
    }
};

const customRaids = [
    {
        href: "Kepresh Slime Oozes",
        name: "Kepresh Slime Oozes",
        firstMessage: "The hourglass of a longforgotten vizier is knocked from its pedestal in the palace of Khepresh... Enchanted grains pour out from its broken neck and dissipate into the sandbar and moat below..",
        secondMessage: "The vizier's curse is activated! The sands awaken with restless conviction to consume everything in their path.",
        thirdMessage: "",
        bossMessage: "",
        location: "Khepresh(Torture Room, Delta)",
        mobs: ["Slime Ooze"],
        bosses: [],
        floors: ["-4", "-5"],
        timeToSpawn: "?"
    },
    {
        href: "/view/durawiki/raids/venore-raids/flesh-of-women",
        name: "Flesh of Women",
        firstMessage: "The Orcs stream out of the forests and hills for the flesh of women!",
        secondMessage: "",
        thirdMessage: "",
        bossMessage: "",
        location: "Venore Amazon Camp",
        mobs: ["Orc", "Orc Warrior", "Orc Shaman", "Orc Leader"],
        bosses: [],
        floors: ["Surface", "-1"],
        timeToSpawn: "?"
    }
];

module.exports = {
    raidOverrides,
    customRaids
};


