
import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-netlify';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const port = Number(env.APP_PORT) || 3005;

    return {
        plugins: [
            tailwindcss(),
            sveltekit({
                adapter: adapter({
                    edge: false,
                    split: false,
                    publish: 'build'
                }),
                compilerOptions: {
                    runes: ({ filename }) =>
                        filename.split(/[/\\]/).includes('node_modules')
                            ? undefined
                            : true
                }
            })
        ],
        server: {
            port,
            strictPort: true
        },
        preview: {
            port,
            strictPort: true
        }
    };
});
