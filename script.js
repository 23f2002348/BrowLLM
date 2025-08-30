import { tools } from "./config.js";

const chat = document.getElementById("chat");
const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const alertBox = document.getElementById("alert");

let messages = [];

function showMessage(role, content) {
  const div = document.createElement("div");
  div.className = role === "user" ? "text-end mb-2" : "text-start mb-2";
  div.innerHTML = `<span class="badge bg-${role === "user" ? "primary" : role==="tool" ? "info" : "secondary"}">${role}</span> ${content}`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function showError(msg) {
  alertBox.innerHTML = `<div class="alert alert-danger alert-dismissible" role="alert">
    ${msg}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  </div>`;
}

async function callLLM() {
  const model = document.getElementById("model").value;
  const apiKey = document.getElementById("openai-key").value;
  const baseUrl = document.getElementById("openai-url").value || "https://api.openai.com/v1";

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "Authorization":"Bearer " + apiKey
      },
      body: JSON.stringify({
        model,
        messages,
        tools: tools.map(t => ({
          type:"function",
          function: { name:t.name, description:t.description, parameters:t.parameters }
        }))
      })
    });

    const data = await res.json();
    if (data.error) {
      throw new Error(data.error.message);
    }
    if (!data.choices || !data.choices[0]) {
      throw new Error("No response from model");
    }
    
    const msg = data.choices[0].message;

    if (msg.tool_calls) {
      for (let tc of msg.tool_calls) {
        const tool = tools.find(t => t.name === tc.function.name);
        try {
          const result = await tool.run(JSON.parse(tc.function.arguments));
          messages.push({
            role: "tool",
            tool_call_id: tc.id,             // required by API
            content: JSON.stringify(result)
          });
          showMessage("tool", JSON.stringify(result));
        } catch (err) {
          showError(err.message);
        }
      }
      return callLLM(); // loop until LLM stops calling tools
    } else {
      messages.push({ role:"assistant", content:msg.content });
      showMessage("assistant", msg.content);
    }
  } catch (err) {
    showError(err.message);
  }
}

form.addEventListener("submit", e => {
  e.preventDefault();
  const text = input.value;
  if (!text) return;
  messages.push({ role:"user", content:text });
  showMessage("user", text);
  input.value = "";
  callLLM();
});
