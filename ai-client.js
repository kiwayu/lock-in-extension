async function promptSuggestBansPicks(topic) {
    if (!(window.navigator && navigator.languageModel && typeof navigator.languageModel.create === 'function')) {
        throw new Error('Prompt API not available');
    }


    const model = await navigator.languageModel.create();
    const promptText = `You are a productivity assistant. Given the focus topic: "${topic}", return a JSON object with two arrays: \"bans\" and \"picks\". Bans are distracting websites (domain names) to block. Picks are helpful websites to keep open. Keep lists short (3-6 items each). Return valid JSON only.`;


    const schema = {
        type: 'object',
        properties: {
            bans: { type: 'array', items: { type: 'string' } },
            picks: { type: 'array', items: { type: 'string' } }
        },
        required: ['bans', 'picks']
    };


    const resp = await model.prompt({ prompt: promptText, responseConstraint: schema });


    if (resp && resp.outputStructured) return resp.outputStructured;
    if (resp && typeof resp.output === 'string') {
        try { return JSON.parse(resp.output); } catch (e) { }
    }
    throw new Error('Could not parse model response');
}


async function generateMotivation(topic, minutes) {
    const promptText = `Write a short (1-2 sentence) motivational line encouraging someone to focus on "${topic}" for ${minutes} minutes.`;
    try {
        if (window.navigator && navigator.languageModel && typeof navigator.languageModel.create === 'function') {
            const model = await navigator.languageModel.create();
            const resp = await model.prompt({ prompt: promptText });
            if (resp && typeof resp.output === 'string') return resp.output.trim();
            if (resp && resp.outputStructured) return String(resp.outputStructured).trim();
        }
    } catch (e) { console.warn('Motivation generation failed', e); }
    return `Focus on ${topic} for ${minutes} minutes — you've got this!`;
}