export async function onRequest(context) {
    const { searchParams } = new URL(context.request.url);
    const vanityurl = searchParams.get('vanityurl');
    const key = searchParams.get('key');

    if (!vanityurl || !key) {
        return new Response(JSON.stringify({ error: 'Missing vanityurl or key' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const steamApiUrl = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${key}&vanityurl=${encodeURIComponent(vanityurl)}`;

    try {
        const response = await fetch(steamApiUrl);
        const data = await response.json();

        return new Response(JSON.stringify(data), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to resolve vanity URL' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
