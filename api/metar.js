// ============================================================
// Fonction serveur (Vercel) — METAR / TAF de la station officielle
// la plus proche d'un point (lat/lon).
// ============================================================
// Source : aviationweather.gov (service public, sans clé). Un terrain
// ULM comme Fronton (LF3177) n'émet pas de METAR ; on cherche donc la
// station aéronautique officielle la plus proche (ex. Toulouse-Blagnac
// LFBO) et on renvoie son bulletin réel.

function haversineKm(lat1, lon1, lat2, lon2) {
    const toRad = x => (x * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
}

module.exports = async function handler(req, res) {
    const q = req.query || {};
    const lat = parseFloat(q.lat);
    const lon = parseFloat(q.lon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
        res.status(400).json({ error: "Coordonnées invalides" });
        return;
    }

    // Boîte d'environ ±1,3° (~140 km) autour du terrain
    const d = 1.3;
    const bbox = [
        (lat - d).toFixed(3), (lon - d).toFixed(3),
        (lat + d).toFixed(3), (lon + d).toFixed(3)
    ].join(",");
    const awc = "https://aviationweather.gov/api/data";

    try {
        const mResp = await fetch(`${awc}/metar?format=json&bbox=${bbox}`);
        const stations = mResp.ok ? await mResp.json() : [];
        if (!Array.isArray(stations) || stations.length === 0) {
            res.setHeader("Cache-Control", "s-maxage=600");
            res.status(200).json({ found: false });
            return;
        }

        stations.sort((a, b) =>
            haversineKm(lat, lon, a.lat, a.lon) - haversineKm(lat, lon, b.lat, b.lon));
        const s = stations[0];

        let tafRaw = null;
        try {
            const tResp = await fetch(`${awc}/taf?ids=${encodeURIComponent(s.icaoId)}&format=json`);
            if (tResp.ok) {
                const arr = await tResp.json();
                if (Array.isArray(arr) && arr.length) tafRaw = arr[0].rawTAF || null;
            }
        } catch (e) { /* TAF facultatif */ }

        res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=1200");
        res.status(200).json({
            found: true,
            station: s.icaoId,
            name: s.name || s.icaoId,
            distance_km: Math.round(haversineKm(lat, lon, s.lat, s.lon)),
            obs_time: s.reportTime || null,
            flt_cat: s.fltCat || null,
            wdir: s.wdir, wspd: s.wspd,
            temp: s.temp, dewp: s.dewp,
            altim: s.altim != null ? Math.round(s.altim) : null,
            visib: s.visib != null ? String(s.visib) : null,
            metar_raw: s.rawOb || null,
            taf_raw: tafRaw
        });
    } catch (e) {
        res.status(502).json({ error: "Service METAR indisponible" });
    }
};
