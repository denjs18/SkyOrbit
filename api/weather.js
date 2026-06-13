// ============================================================
// Fonction serveur (Vercel) — proxy météo OpenWeatherMap
// ============================================================
// La clé OpenWeatherMap est lue dans la variable d'environnement
// OPENWEATHER_API_KEY (configurée dans Vercel > Settings > Environment
// Variables). Elle reste côté serveur : le navigateur appelle seulement
// /api/weather?lat=..&lon=.. et ne voit jamais la clé.
//
// En local sans serveur (ou si la variable n'est pas définie), le client
// reçoit une erreur et affiche des données d'exemple (voir weather.js).

module.exports = async function handler(req, res) {
    const key = process.env.OPENWEATHER_API_KEY;
    if (!key) {
        res.status(503).json({ error: "Clé météo non configurée sur le serveur" });
        return;
    }

    const query = req.query || {};
    const lat = parseFloat(query.lat);
    const lon = parseFloat(query.lon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
        res.status(400).json({ error: "Coordonnées invalides" });
        return;
    }

    const base = `lat=${lat}&lon=${lon}&appid=${key}&units=metric&lang=fr`;
    const root = "https://api.openweathermap.org/data/2.5";

    try {
        const [wResp, fResp] = await Promise.all([
            fetch(`${root}/weather?${base}`),
            fetch(`${root}/forecast?${base}`)
        ]);

        if (!wResp.ok) {
            const body = await wResp.json().catch(() => ({}));
            res.status(wResp.status).json({ error: body.message || "Erreur API météo" });
            return;
        }

        const current = await wResp.json();
        const forecast = fResp.ok ? await fResp.json() : null;

        // Cache court au niveau du CDN Vercel pour limiter les appels API
        res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
        res.status(200).json({ current, forecast });
    } catch (e) {
        res.status(502).json({ error: "Service météo indisponible" });
    }
};
