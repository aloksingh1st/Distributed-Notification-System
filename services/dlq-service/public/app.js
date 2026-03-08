const API_BASE = "/dlq";

async function fetchJobs() {
  const res = await fetch(`${API_BASE}/list`);
  const jobs = await res.json();


  console.log("Fetched jobs:", jobs); // Debug log to check the fetched data

  const table = document.getElementById("dlqTable");
  table.innerHTML = "";

  jobs.forEach(job => {
    const row = `
      <tr class="border-t">
        <td class="p-2">
          <input type="checkbox" class="jobCheckbox" value="${job.id}" />
        </td>
        <td class="p-2 text-xs">${job.id}</td>
        <td class="p-2">${job.error_reason ??  "-"}</td>
        <td class="p-2 text-center">${job.retry_count}</td>
        <td class="p-2">${new Date(job.created_at).toLocaleString()}</td>
        <td class="p-2">
          <button onclick="viewHistory('${job.id}')" class="text-blue-600 underline">
            History
          </button>
        </td>
      </tr>
    `;
    table.innerHTML += row;
  });
}

function toggleAll(source) {
  document.querySelectorAll(".jobCheckbox")
    .forEach(cb => cb.checked = source.checked);
}

function getSelectedIds() {
  return Array.from(document.querySelectorAll(".jobCheckbox:checked"))
    .map(cb => cb.value);
}

async function replaySelected() {
  const ids = getSelectedIds();
  if (!ids.length) return alert("No jobs selected");

  await fetch(`${API_BASE}/replay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids })
  });

  alert("Replay triggered");
  fetchJobs();
}

async function discardSelected() {
  const ids = getSelectedIds();
  if (!ids.length) return alert("No jobs selected");

  await fetch(`${API_BASE}/discard`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids })
  });

  alert("Discarded");
  fetchJobs();
}

async function viewHistory(id) {
  const res = await fetch(`${API_BASE}/${id}/history`);
  const history = await res.json();

  const content = document.getElementById("historyContent");
  content.innerHTML = history.map(h => `
    <div class="border-b py-2">
      <strong>${h.action}</strong>
      <div class="text-sm text-gray-600">${h.reason || ""}</div>
      <div class="text-xs text-gray-400">${new Date(h.createdAt).toLocaleString()}</div>
    </div>
  `).join("");

  document.getElementById("historyModal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("historyModal").classList.add("hidden");
}

fetchJobs();