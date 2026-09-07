module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { query, mode = "quick" } = req.body || {};

    if (!query || typeof query !== "string") {
      return res.status(400).json({
        error: "A search query is required."
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "OPENAI_API_KEY is not configured in Vercel."
      });
    }

    const searchDepth =
      mode === "deep"
        ? "Perform broad and thorough research."
        : "Perform a focused, efficient search.";

    const prompt = `
You are the intelligence engine for an AI news and research intelligence platform.

The user's question is:

"${query}"

${searchDepth}

CORE RULE:

More information is not better information.

Better information is information that answers the question accurately,
with enough context to make it useful.

SEARCH AGGRESSIVELY.
REJECT NARROWLY.
RANK INTELLIGENTLY.

Find approximately 10 serious candidate developments internally.

Then return only the strongest legitimate results.

A DEVELOPMENT is the underlying event or storyline,
not an individual article.

Multiple articles covering the same event should be treated
as one development.

Do NOT manufacture stories simply to fill space.

Reject only:

- material unrelated to the user's question
- AI mentions that are merely incidental
- spam or obvious SEO filler
- duplicate coverage containing no meaningful new information
- unsupported claims
- material with no actual development

Do not automatically reject unusual or emerging stories
if they have genuine potential significance.

For every final result determine:

1. What happened?
2. Why does it matter?
3. What changed recently?
4. Current status
5. What may happen next
6. Best available sources
7. News Strength from 0-100
8. Query Usefulness from 0-100
9. Freshness classification

NEWS STRENGTH:

Measure how strong or important the development is
independently of the user's question.

Consider:

- concrete development
- potential significance
- freshness
- source reliability
- actionability
- originality
- evidence depth

QUERY USEFULNESS:

Measure how useful the development is specifically
for the user's question.

FRESHNESS must be event-based rather than simply
publication-date based.

Use one of:

NEW
BREAKING
UPDATED
DEVELOPING
EMERGING
BACKGROUND
DORMANT

SOURCE QUALITY:

Prefer:

1. Government, court, legislation, university, research,
company or regulatory sources

2. Reuters, AP, major newspapers and established broadcasters

3. Established trade and industry publications

Treat aggregators and low-quality sources primarily
as discovery sources.

Return only legitimate developments supported by web evidence.
`;

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-5.6-luna",
          tools: [
            {
              type: "web_search"
            }
          ],
          input: prompt
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      return res.status(response.status).json({
        error: "OpenAI request failed.",
        details: errorText
      });
    }

    const data = await response.json();

    return res.status(200).json({
      success: true,
      query,
      mode,
      answer: data.output_text || ""
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Search failed.",
      details: error.message
    });
  }
};
