let Parser = require('rss-parser');
const express = require('express')
const dotenv = require('dotenv')
const emojiRegex = require('emoji-regex');
const sanitizeHtml = require('sanitize-html');

dotenv.config()

let parser = new Parser();
const emojiRemovalRegex = new RegExp(emojiRegex(), 'g');
const app = express()
const port = process.env.PORT || 1273
const debug = process.env.DEBUG || false

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
    let feeds = [];
    try{
        feeds = process.env.FEEDS.split(',')
    } catch {
        feeds = [
            'https://feeds.a.dj.com/rss/RSSWorldNews.xml',
            'https://www.theguardian.com/world/rss',
            'https://feeds.nbcnews.com/nbcnews/public/news',
            'https://feeds.npr.org/1001/rss.xml',
            'https://abcnews.go.com/abcnews/topstories',
            'https://www.cbsnews.com/latest/rss/us',
            'https://www.nytimes.com/services/xml/rss/nyt/HomePage.xml',
            'https://www.reddit.com/r/news.rss',
            'https://lwn.net/headlines/newrss',
            'http://rss.slashdot.org/Slashdot/slashdotMain',
            'https://www.cbsnews.com/latest/rss/technology',
            'https://www.theverge.com/rss/index.xml'
        ];
    }

    // Process all feeds concurrently and wait for all to complete
    await Promise.all(feeds.map(async (nonparsed) => {
        let feed = await parser.parseURL(nonparsed);
        html = html + `
        <h2>SOURCE: ${feed.title}</h2><br></br>
        `;
        if (debug) {
            console.log(feed.title);
        }

        feed.items.forEach(item => {
            let content = `${item.description || item.content || item.summary || "<b>No content or description available</b>"}`

            content = content.replace(/https?:\/\/[^\s]+/g, "")
            content = content.replace(emojiRemovalRegex, "")
            content = sanitizeHtml(content, {
                allowedTags: ['p', 'b', 'i', 'br', 'strong', "em", "a", "div", "ul", "li", "ol", "span"],
                allowedAttributes: {
                    'a': [''],
                    'p': [''],
                    'b': [''],
                    'i': [''],
                    'br': [''],
                    'strong': [''],
                    'em': [''],
                    'div': ['class'],
                    'ul': ['class'],
                    'li': ['class'],
                    'ol': ['class'],
                    'span': ['class']
                }
            });
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
    html = html + `
    <hr></hr>
    <p><i>Copyright <SCRIPT>document.write(new Date().getFullYear());</SCRIPT> Sammy Lord. All rights reserved.</i></p>
    <p><i>DISCLAIMER: This is a news aggregator. The news is not owned by me. I am not responsible for the content of the news.</i></p>
    `
    return html;
}

app.get('/', async (req, res) => {
    res.send(await getNews());
});

app.listen(port, () => {
    console.log(`News server is running on port ${port}`);
});