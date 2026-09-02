import express from 'express';
import path from 'path';
import * as XLSX from 'xlsx';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Proxy endpoint for Google Drive and Google Sheets file sync
 * Resolves CORS limitations, handles OAuth Bearer tokens, and converts native Sheets or binary Drive files
 * Includes real-time cache busting and Sheets API v4 support for large files (>100k rows)
 */
app.get('/api/drive/download', async (req, res) => {
  try {
    const fileId = (req.query.fileId as string) || '1Xv3Bf8-lfCXVWoqy2iPP2R5AOEs84BHbO_m2Sb-PrpM';
    const gid = (req.query.gid as string) || '1486132296';
    const token = req.headers.authorization;

    if (!fileId) {
      return res.status(400).json({ error: 'fileId query parameter is required' });
    }

    // Set non-caching HTTP response headers so the browser never serves stale cached data
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const headers: Record<string, string> = {
      'Cache-Control': 'no-cache, no-store',
      'Pragma': 'no-cache',
    };
    if (token) {
      headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }

    const timestamp = Date.now();

    // 1. If OAuth Token is present, attempt Google Sheets API v4 first
    // This completely bypasses the 403 "exportSizeLimitExceeded" error on large files (>100,000 rows)
    if (token) {
      try {
        const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${fileId}?fields=sheets.properties`, {
          headers,
          cache: 'no-store',
        });

        if (metaRes.ok) {
          const metaJson = await metaRes.json();
          const sheetsList: any[] = metaJson.sheets || [];
          let selectedTitle = sheetsList[0]?.properties?.title || 'BASE';
          for (const s of sheetsList) {
            const props = s.properties || {};
            if (String(props.sheetId) === String(gid) || props.title?.toUpperCase() === 'BASE' || props.title?.toUpperCase().includes('BASE')) {
              selectedTitle = props.title;
              break;
            }
          }

          const valuesRes = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${fileId}/values/${encodeURIComponent(selectedTitle)}?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`,
            { headers, cache: 'no-store' }
          );

          if (valuesRes.ok) {
            const valuesJson = await valuesRes.json();
            if (valuesJson.values && Array.isArray(valuesJson.values) && valuesJson.values.length > 0) {
              const wb = XLSX.utils.book_new();
              const ws = XLSX.utils.aoa_to_sheet(valuesJson.values);
              XLSX.utils.book_append_sheet(wb, ws, selectedTitle);
              const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
              res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
              res.setHeader('Content-Disposition', `attachment; filename="BASE_KPI_${fileId}.xlsx"`);
              return res.send(buf);
            }
          }
        }
      } catch (v4Err) {
        console.warn('Sheets API v4 direct values fetch skipped, trying alternate export links:', v4Err);
      }
    }

    // List of download URLs to try in order of preference (with cache-busting timestamp)
    const urlsToTry: { url: string; useAuth: boolean }[] = [];

    // If token is provided, prioritize authenticated endpoints
    if (token) {
      // 1. Google Visualization query export (instant CSV from active sheet memory)
      urlsToTry.push({
        url: `https://docs.google.com/spreadsheets/d/${fileId}/gviz/tq?tqx=out:csv&tq=&gid=${gid}&_cb=${timestamp}`,
        useAuth: true,
      });
      urlsToTry.push({
        url: `https://docs.google.com/spreadsheets/d/${fileId}/gviz/tq?tqx=out:csv&tq=&sheet=BASE&_cb=${timestamp}`,
        useAuth: true,
      });
      urlsToTry.push({
        url: `https://docs.google.com/spreadsheets/d/${fileId}/gviz/tq?tqx=out:csv&tq=&_cb=${timestamp}`,
        useAuth: true,
      });

      // 2. Google Sheets CSV direct export
      urlsToTry.push({
        url: `https://docs.google.com/spreadsheets/d/${fileId}/export?format=csv&gid=${gid}&id=${fileId}&_cb=${timestamp}`,
        useAuth: true,
      });
      urlsToTry.push({
        url: `https://docs.google.com/spreadsheets/d/${fileId}/export?format=csv&id=${fileId}&_cb=${timestamp}`,
        useAuth: true,
      });

      // 3. Google Sheets XLSX export (with cache buster)
      urlsToTry.push({
        url: `https://docs.google.com/spreadsheets/d/${fileId}/export?format=xlsx&_cb=${timestamp}`,
        useAuth: true,
      });

      // 4. Google Drive v3 alt=media (works for uploaded .xlsx / .xls / .csv binaries of any size)
      urlsToTry.push({
        url: `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&_cb=${timestamp}`,
        useAuth: true,
      });

      // 5. Google Drive v3 export
      urlsToTry.push({
        url: `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet&_cb=${timestamp}`,
        useAuth: true,
      });
    }

    // Public / Fallback endpoints with cache buster
    urlsToTry.push({
      url: `https://docs.google.com/spreadsheets/d/${fileId}/gviz/tq?tqx=out:csv&tq=&gid=${gid}&_cb=${timestamp}`,
      useAuth: false,
    });
    urlsToTry.push({
      url: `https://docs.google.com/spreadsheets/d/${fileId}/gviz/tq?tqx=out:csv&tq=&sheet=BASE&_cb=${timestamp}`,
      useAuth: false,
    });
    urlsToTry.push({
      url: `https://docs.google.com/spreadsheets/d/${fileId}/gviz/tq?tqx=out:csv&tq=&_cb=${timestamp}`,
      useAuth: false,
    });
    urlsToTry.push({
      url: `https://docs.google.com/spreadsheets/d/${fileId}/export?format=csv&gid=${gid}&id=${fileId}&_cb=${timestamp}`,
      useAuth: false,
    });
    urlsToTry.push({
      url: `https://docs.google.com/spreadsheets/d/${fileId}/export?format=csv&id=${fileId}&_cb=${timestamp}`,
      useAuth: false,
    });
    urlsToTry.push({
      url: `https://docs.google.com/spreadsheets/d/${fileId}/export?format=xlsx&_cb=${timestamp}`,
      useAuth: false,
    });
    urlsToTry.push({
      url: `https://drive.google.com/uc?export=download&id=${fileId}&_cb=${timestamp}`,
      useAuth: false,
    });
    urlsToTry.push({
      url: `https://docs.google.com/spreadsheets/d/${fileId}/export?format=csv&id=${fileId}&_cb=${timestamp}`,
      useAuth: false,
    });

    let lastErrorDetails = '';

    for (const item of urlsToTry) {
      try {
        const fetchHeaders: Record<string, string> = item.useAuth ? headers : { 'Cache-Control': 'no-cache' };
        const fetchResponse = await fetch(item.url, {
          headers: fetchHeaders,
          cache: 'no-store',
        });

        if (fetchResponse.ok) {
          const contentType = fetchResponse.headers.get('content-type') || '';
          
          // If returned HTML login page, skip to next attempt
          if (contentType.includes('text/html')) {
            const html = await fetchResponse.text();
            // Check if large file virus scan confirm page
            const confirmMatch = html.match(/confirm=([a-zA-Z0-9_-]+)/);
            if (confirmMatch && confirmMatch[1]) {
              const confirmRes = await fetch(`https://drive.google.com/uc?export=download&confirm=${confirmMatch[1]}&id=${fileId}&_cb=${timestamp}`);
              if (confirmRes.ok) {
                const buffer = await confirmRes.arrayBuffer();
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                return res.send(Buffer.from(buffer));
              }
            }
            continue;
          }

          const buffer = await fetchResponse.arrayBuffer();
          if (buffer.byteLength > 100) {
            res.setHeader('Content-Type', contentType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            return res.send(Buffer.from(buffer));
          }
        } else {
          const errTxt = await fetchResponse.text();
          lastErrorDetails = `HTTP ${fetchResponse.status}: ${errTxt.slice(0, 200)}`;
        }
      } catch (err: any) {
        lastErrorDetails = err?.message || 'Network error';
      }
    }

    return res.status(403).json({
      error: 'No se pudo descargar el archivo de Google Drive / Sheets.',
      details: lastErrorDetails || 'Asegúrate de que la cuenta tenga permisos o que el enlace sea compartido.',
    });
  } catch (error: any) {
    console.error('Error proxying Drive download:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
