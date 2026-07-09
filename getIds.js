const https = require('https');
https.get('https://www.youtube.com/results?search_query=' + encodeURIComponent('Travis Scott KICK OUT audio'), (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const match = data.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
    console.log(match ? match[1] : null);
  });
});
