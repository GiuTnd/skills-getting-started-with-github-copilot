document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants HTML (inline badges with a delete button)
        const participantsHtml =
          details.participants && details.participants.length
            ? `<div class="participants-section">
                 <h5 class="participants-title">Participants (${details.participants.length})</h5>
                 <ul class="participants-list">
                   ${details.participants
                     .map(
                       (p) => `
                     <li class="participant-item">
                       <span class="participant-email">${p}</span>
                       <button class="delete-btn" data-email="${p}" data-activity="${name}" aria-label="Remove participant">×</button>
                     </li>`
                     )
                     .join("")}
                 </ul>
               </div>`
            : `<div class="participants-section empty"><em>No participants yet</em></div>`;

        activityCard.innerHTML = `
          <h4 class="activity-title">${name}</h4>
          <p class="activity-desc">${details.description}</p>
          <p class="activity-schedule"><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="activity-availability"><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

        // Add event delegation for delete buttons (unregister participant)
        activitiesList.addEventListener("click", async (ev) => {
          const btn = ev.target.closest(".delete-btn");
          if (!btn) return;

          const email = btn.dataset.email;
          const activity = btn.dataset.activity;

          if (!email || !activity) return;

          if (!confirm(`Remove ${email} from ${activity}?`)) return;

          try {
            const res = await fetch(
              `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
              { method: "DELETE" }
            );

            const result = await res.json();

            if (res.ok) {
              messageDiv.textContent = result.message || "Participant removed";
              messageDiv.className = "success";
              messageDiv.classList.remove("hidden");
              // refresh activities to reflect removal
              fetchActivities();
            } else {
              messageDiv.textContent = result.detail || "Failed to remove participant";
              messageDiv.className = "error";
              messageDiv.classList.remove("hidden");
            }

            setTimeout(() => messageDiv.classList.add("hidden"), 4000);
          } catch (err) {
            console.error("Error removing participant:", err);
            messageDiv.textContent = "Failed to remove participant. Try again.";
            messageDiv.className = "error";
            messageDiv.classList.remove("hidden");
          }
        });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // refresh activities to show newly added participant
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
