export async function onRequest(context) {
    const { searchParams } = new URL(context.request.url);
    const steamids = searchParams.get('steamids');
    const key = searchParams.get('key');

    if (!steamids || !key) {
        return new Response(JSON.stringify({ error: 'Missing steamids or key' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const steamApiUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${key}&steamids=${steamids}`;

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
        return new Response(JSON.stringify({ error: 'Failed to fetch from Steam API' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
