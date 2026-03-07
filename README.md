# empirical records

Independent archive of experimental electronic music from the 1990s and early 2000s.

**Live**: [www.empiricalrecords.com](https://www.empiricalrecords.com)

All releases are under [Creative Commons BY-SA 1.0](https://creativecommons.org/licenses/by-sa/1.0/).

## Artists

| Artist | Releases | Genre |
|--------|----------|-------|
| **CSU** | Data, Live 95, Boab, Nazca Plain | Heavy industrial |
| **Multivibrator** | Music For Stealth Bomber Pilots, Schmitt Trigger | Minimal experimental electronic |
| **UV** | (symbol), UFO | Guitar compositions, organic |
| **Disco Suicide Bomber** | Bombing For Love | Disco covers, experimental trance |

## Tech

Static site — HTML, CSS, vanilla JS. No build step, no framework.

- **Generative art**: Canvas-based animated visuals per artist on the homepage and artist pages (`js/cards.js`)
- **Audio player**: Custom HTML5 audio player with keyboard navigation (`js/player.js`)
- **Gallery**: Lightbox viewer for archival photos and artwork
- **Hosting**: JustHost shared hosting via FTP
- **Deployment**: `python3 upload.py` — FTP upload with verification

## Deployment

```bash
python3 upload.py
```

Uploads all site files via FTP to JustHost. Requires `FTP_USER` and `FTP_PASS` environment variables (or prompts interactively). Includes post-deploy verification of all pages.

## Structure

```
index.html              Homepage with generative art cards
artist-csu.html         CSU artist page
artist-multivibrator.html  Multivibrator artist page
artist-uv.html          UV artist page
artist-dsb.html         Disco Suicide Bomber artist page
404.html                Custom error page
css/style.css           All styles
js/cards.js             Generative canvas animations
js/player.js            Audio player + lightbox
upload.py               FTP deployment script
.htaccess               URL rewriting + security headers
CSU/                    CSU audio files + images
Multivibrator/          Multivibrator audio files
UV/                     UV audio files + artwork
DiscoSuicideBomber/     DSB audio files
```
