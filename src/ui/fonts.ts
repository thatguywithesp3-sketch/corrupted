// Era I fonts, bundled with the game (no Google Fonts CDN): the build works offline and opens from a file.
// Only the Cyrillic and Latin subsets: the woff2 files are inlined into the CSS (vite.config.ts), so the
// single-file build for Max carries them with it.
import '@fontsource/old-standard-tt/cyrillic-400.css';
import '@fontsource/old-standard-tt/latin-400.css';
import '@fontsource/old-standard-tt/cyrillic-400-italic.css';
import '@fontsource/old-standard-tt/latin-400-italic.css';
import '@fontsource/old-standard-tt/cyrillic-700.css';
import '@fontsource/old-standard-tt/latin-700.css';
import '@fontsource/ruslan-display/cyrillic-400.css';
import '@fontsource/ruslan-display/latin-400.css';
import '@fontsource/marck-script/cyrillic-400.css';
import '@fontsource/marck-script/latin-400.css';
import '@fontsource/abril-fatface/latin-400.css';
import '@fontsource/pt-mono/cyrillic-400.css';
import '@fontsource/pt-mono/latin-400.css';
import '@fontsource/pt-sans/cyrillic-400.css';
import '@fontsource/pt-sans/latin-400.css';
import '@fontsource/pt-sans/cyrillic-700.css';
import '@fontsource/pt-sans/latin-700.css';

/** eras whose fonts are bundled: their Google Fonts links are skipped */
export const LOCAL_FONT_ERAS = new Set([1]);
