document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activityCardTemplate = document.getElementById("activity-card-template");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  let hideMessageTimeoutId;

  function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");
    clearTimeout(hideMessageTimeoutId);

    // Hide message after 5 seconds
    hideMessageTimeoutId = setTimeout(() => messageDiv.classList.add("hidden"), 5000);
  }

  async function unregisterParticipant(activity, email) {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        await fetchActivities();
      } else {
        showMessage(result.detail || "Could not remove participant.", "error");
      }
    } catch (error) {
      showMessage("Failed to remove participant. Please try again.", "error");
      console.error("Error unregistering participant:", error);
    }
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch(`/activities?ts=${Date.now()}`, {
        cache: "no-store",
      });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = activityCardTemplate.content.cloneNode(true);
        const activityName = activityCard.querySelector(".activity-name");
        const activityDescription = activityCard.querySelector(".activity-description");
        const activitySchedule = activityCard.querySelector(".activity-schedule");
        const activityAvailability = activityCard.querySelector(".activity-availability");
        const participantsList = activityCard.querySelector(".participants-list");

        const spotsLeft = details.max_participants - details.participants.length;
        activityName.textContent = name;
        activityDescription.textContent = details.description;
        activitySchedule.textContent = details.schedule;
        activityAvailability.textContent = `${spotsLeft} spots left`;

        if (details.participants.length) {
          details.participants.forEach((participant) => {
            const participantItem = document.createElement("li");
            participantItem.className = "participant-item";

            const participantEmail = document.createElement("span");
            participantEmail.className = "participant-email";
            participantEmail.textContent = participant;

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "participant-delete-button";
            deleteButton.setAttribute("aria-label", `Remove ${participant} from ${name}`);
            deleteButton.title = "Remove participant";
            deleteButton.textContent = "x";
            deleteButton.addEventListener("click", () => unregisterParticipant(name, participant));

            participantItem.appendChild(participantEmail);
            participantItem.appendChild(deleteButton);
            participantsList.appendChild(participantItem);
          });
        } else {
          const emptyItem = document.createElement("li");
          emptyItem.className = "participant-empty";
          emptyItem.textContent = "No participants yet";
          participantsList.appendChild(emptyItem);
        }

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
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
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
