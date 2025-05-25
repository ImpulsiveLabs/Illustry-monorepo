// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
    test: {
        testTimeout: 15000,
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./vitest.setup.ts'], // ✅ this line is important
        include: ['*/**/*.test.ts', '*/**/*.test.tsx'],
        exclude: [
            'node_modules',
            'dist',
            'app/layout.{ts,tsx}',
            'build',
            'coverage',
            '**/*.d.ts',
            '**/*.js',
            '**/*.jsx',
        ],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'json'],
            include: ['src/**/*.{ts,tsx}'],
            exclude: [
                'node_modules',
                'dist',
                'app/layout.{ts,tsx}',
                'build',
                'coverage',
                '**/*.d.ts',
                '**/*.js',
                '**/*.jsx',
            ]
        }
    },
    resolve: {
        alias: [
            {
                find: '@',
                replacement: resolve(__dirname, 'src'),
            },
            {
                find: /^monaco-editor$/,
                replacement: resolve(__dirname, '../node_modules/monaco-editor/esm/vs/editor/editor.api'),
            }
        ]
    }
});
