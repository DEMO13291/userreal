const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const usersFile = './users.json';
let users = [];

// Load existing users
if (fs.existsSync(usersFile)) {
    users = JSON.parse(fs.readFileSync(usersFile));
}

// Your Discord webhook URLs
const signupWebhook = 'https://discord.com/api/webhooks/1353568401699639307/fXXO9CLV4CX4xQmE948jUHOvfEXh4Qb7IfOJ4RxWVXMpKHDkeZ52ErTpAodWqPva7Jni';
const banWebhook = 'https://discord.com/api/webhooks/1353568170455203903/7gySEuxeFZAhQzR1WSlvemwQOgkCDvkiZVkiPZk10CuupIIzJWsXA_FHEhHQL7jhzlZS';

// Helper function to save users
function saveUsers() {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

// Signup route
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    if (users.find(u => u.username === username)) {
        return res.json({ success: false, message: "User already exists!" });
    }

    users.push({ username, password, banned: false });
    saveUsers();

    // Send signup webhook to Discord
    await axios.post(signupWebhook, {
        content: `New Signup:\nUsername: **${username}**\nPassword: **${password}**`,
        components: [
            {
                type: 1,
                components: [
                    {
                        type: 2,
                        label: "BAN",
                        style: 4, // red button
                        custom_id: `ban_${username}`
                    }
                ]
            }
        ]
    });

    res.json({ success: true });
});

// Login route
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) return res.json({ success: false, message: "Invalid credentials" });
    if (user.banned) return res.json({ success: false, message: "You have been banned." });

    res.json({ success: true });
});

// Ban/unban route (this needs a Discord bot to handle interactions; this example simplifies it)
app.post('/ban', async (req, res) => {
    const { username } = req.body;
    const user = users.find(u => u.username === username);

    if (user) {
        user.banned = true;
        saveUsers();
        await axios.post(banWebhook, { content: `User **${username}** has been banned.` });
        res.json({ success: true });
    } else {
        res.json({ success: false, message: 'User not found' });
    }
});

app.post('/unban', async (req, res) => {
    const { username } = req.body;
    const user = users.find(u => u.username === username);

    if (user) {
        user.banned = false;
        saveUsers();
        await axios.post(banWebhook, { content: `User **${username}** has been unbanned.` });
        res.json({ success: true });
    } else {
        res.json({ success: false, message: 'User not found' });
    }
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
