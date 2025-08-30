// Minimal tool definitions

export const tools = [
  {
    name: "google_search",
    description: "Search the web using Google Custom Search API and return snippets",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "The search query string" }
      },
      required: ["query"]
    },
    run: async ({ query }) => {
      const key = document.getElementById("google-key").value;
      const cx = document.getElementById("google-cx").value;
      if (!key || !cx) throw new Error("Google API key or cx missing");
      const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&key=${key}&cx=${cx}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Google API error ${res.status}`);
      const data = await res.json();
      return data.items?.map(i => ({ title: i.title, link: i.link, snippet: i.snippet })) || [];
    }
  },
  {
    name: "ai_pipe",
    description: "Call an AI Pipe proxy endpoint",
    parameters: {
      type: "object",
      properties: {
        endpoint: { type: "string", description: "The API endpoint URL" },
        payload: { type: "object", description: "Payload object to POST" }
      },
      required: ["endpoint","payload"]
    },
    run: async ({ endpoint, payload }) => {
      const res = await fetch(endpoint, { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(`AI Pipe error ${res.status}`);
      return await res.json();
    }
  },
  {
    name: "js_exec",
    description: "Run sandboxed JS code",
    parameters: {
      type: "object",
      properties: {
        code: { type: "string", description: "JavaScript code to execute" }
      },
      required: ["code"]
    },
    run: async ({ code }) => {
      try {
        const fn = new Function(`"use strict"; ${code}`);
        return fn();
      } catch (err) {
        throw new Error("JS error: " + err.message);
      }
    }
  }
];
