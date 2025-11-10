const Sentiment = require('sentiment');
const sentiment = new Sentiment();

function analyzeText(text) {
  const result = sentiment.analyze(text || '');
  const score = result.score || 0;
  const label = score > 0 ? 'Positive' : score < 0 ? 'Negative' : 'Neutral';
  return { label, score };
}

module.exports = { analyzeText };
