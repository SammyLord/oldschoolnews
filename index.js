let Parser = require('rss-parser');
const express = require('express')
const dotenv = require('dotenv')
const emojiRegex = require('emoji-regex');

dotenv.config()

let parser = new Parser();
const emojiRemovalRegex = new RegExp(emojiRegex(), 'g');
const app = express()
const port = process.env.PORT || 1273

// Polyfill for String.replaceAll
if (!String.prototype.replaceAll) {
    String.prototype.replaceAll = function(search, replacement) {
        return this.split(search).join(replacement);
    };
}

async function getNews() {

    let html = `<h1>Old School News</h1>
    <p><b><i>News back to the future.</b></i></p>
    <hr></hr>
    
    `;

    let feeds = [
        'https://feeds.a.dj.com/rss/RSSWorldNews.xml',
        'https://www.theverge.com/rss/index.xml',
        'https://www.theguardian.com/world/rss',
        'https://www.nytimes.com/services/xml/rss/nyt/HomePage.xml',
        'https://www.reddit.com/r/news.rss',
        'https://lwn.net/headlines/newrss',
        'http://rss.slashdot.org/Slashdot/slashdotMain'
    ];

    // Process all feeds concurrently and wait for all to complete
    await Promise.all(feeds.map(async (nonparsed) => {
        let feed = await parser.parseURL(nonparsed);
        html = html + `
        <h2>SOURCE: ${feed.title}</h2><br></br>
        `;
        console.log(feed.title);

        feed.items.forEach(item => {
            let content = `${item.description || item.content || item.summary || "<b>No content or description available</b>"}`
            content = content.replace(/https?:\/\/[^\s]+/g, "")
            content = content.replaceAll('<a href="', "")
            content = content.replaceAll('</a>', "")
            content = content.replaceAll('<img src="', "")
            content = content.replaceAll('</img>', "")
            content = content.replace(emojiRemovalRegex, "")
            if (content.length < 25) {
                content = "<b>No content or description available</b>"
            }
            html = html + ` 
            <h3>${item.title}</h3>
            <p>${content}</p>
            <br></br>
            `
        });
    }));
    return html;
}

app.get('/', async (req, res) => {
    res.send(await getNews());
});

app.listen(port, () => {
    console.log(`News server is running on port ${port}`);
});