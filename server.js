require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ORG_NAME = 'ZAPL-corp';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const headers = {
    'User-Agent': 'ZAPL-Cloud-Viewer',
    'Accept': 'application/vnd.github.v3+json'
};

if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
}

// 1. Получить список всех репозиториев ZAPL-corp
app.api_repos = app.get('/api/repos', async (req, res) => {
    try {
        const response = await fetch(`https://api.github.com/orgs/${ORG_NAME}/repos?per_page=100&sort=updated`, { headers });
        if (!response.ok) throw new Error(`GitHub API error: ${response.statusText}`);
        
        const repos = await response.json();
        const data = repos.map(r => ({
            name: r.name,
            description: r.description || 'Нет описания',
            language: r.language || 'Code',
            stars: r.stargazers_count,
            forks: r.forks_count,
            updated_at: r.updated_at,
            clone_url: r.clone_url,
            html_url: r.html_url,
            default_branch: r.default_branch || 'main'
        }));
        
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Получить список файлов репозитория для просмотра структуры
app.get('/api/repos/:repo/contents/:path(*)?', async (req, res) => {
    const { repo, path: filePath = '' } = req.params;
    try {
        const url = `https://api.github.com/repos/${ORG_NAME}/${repo}/contents/${filePath}`;
        const response = await fetch(url, { headers });
        if (!response.ok) throw new Error('Не удалось загрузить содержимое');
        
        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Для локального запуска (когда вы тестируете через node server.js)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`[ZAPL Cloud] Server running at http://localhost:${PORT}`);
    });
}

// Экспорт для Vercel Serverless
module.exports = app;