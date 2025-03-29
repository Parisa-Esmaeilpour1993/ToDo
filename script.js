moment.loadPersian({ usePersianDigits: true, dialect: "persian-modern" });

function toShamsi(date) {
  return moment(date, "YYYY-MM-DD").format("jYYYY/jMM/jDD");
}
function toGregorian(date) {
  if (!date) return "";
  const [year, month, day] = date.split("/").map(Number);
  return moment(`${year}/${month}/${day}`, "jYYYY/jMM/jDD").format(
    "YYYY-MM-DD"
  );
}

const addTaskBtn = document.getElementById("addTaskBtn");
const modalBox = document.getElementById("modal-box");
const modalContent = document.getElementById("modal-content");
const closeModalBtn = document.getElementById("closeModalBtn");
const saveTaskBtn = document.getElementById("saveTaskBtn");
const taskBodyTable = document.getElementById("taskBodyTable");
const overlay = document.getElementById("overlay");
const detailModal = document.getElementById("detailModal");
const closeShowModal = document.getElementById("closeShowModal");

let isEditing = false;
let editingId = null;
let isLoading = false;
let currentPage = 1;
const tasksPerPage = 3;

let toDo = JSON.parse(localStorage.getItem("toDo")) || [];

addTaskBtn.addEventListener("click", () => {
  isEditing = false;
  clearModalInputs();
  openModal(modalBox, modalContent);
  document.addEventListener("keydown", enterKey);
});

function enterKey(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    saveTaskBtn.click();
  }
}

closeModalBtn.addEventListener("click", () => {
  closeModal(modalBox, modalContent);
  isEditing = false;
  editingId = null;
  showToast("Operation Canceled", "error");
});

function renderToDos() {
  taskBodyTable.innerHTML = "";

  const start = (currentPage - 1) * tasksPerPage;
  const end = start + tasksPerPage;
  const paginatedTasks = toDo.slice(start, end);

  paginatedTasks.forEach((todo) => {
    let priorityColor = getPriorityColor(todo.taskPriority);
    let statusColor = getStatusColor(todo.taskStatus);

    const deadlineContent = todo.taskDeadLine
      ? `<div class="border border-blue-500 rounded-xl p-2">${todo.taskDeadLine}</div>`
      : "-";

    const priorityContent =
      todo.taskPriority === "Choose"
        ? "-"
        : ` <span class="px-6 py-1 rounded-2xl ${priorityColor}">${todo.taskPriority}</span>`;

    const statusContent =
      todo.taskStatus === "Choose"
        ? "-"
        : `<span class="px-6 py-1 rounded-2xl ${statusColor}">${todo.taskStatus}</span>`;

    taskBodyTable.innerHTML += `
        <tr>
          <td class="text-left p-4 border">${todo.taskName}</td>

          <td class="text-center py-4 border">
           ${priorityContent}
          </td>

          <td class="text-center py-4 border">
            ${statusContent}
          </td>

          <td class="text-center justify-items-center border">${deadlineContent}</td>

          <td class="text-center px-4 border">
            <div class="flex gap-2 justify-center">
              <button onclick="deleteTask('${todo.id}')">
                <img src="./assets/images/delete.svg" alt="delete" class="w-7 rounded-lg hover:scale-110 transition duration-200 ease-in">
              </button>
              <button onclick="editTask('${todo.id}')">
                <img src="./assets/images/edit.svg" alt="edit" class="w-7 rounded-lg hover:scale-110 transition duration-200 ease-in">
              </button>
              <button onclick="showDetail('${todo.id}')">
                <img src="./assets/images/show.svg" alt="showDetail" class="w-7 rounded-lg hover:scale-110 transition duration-200 ease-in">
              </button>
            </div>
          </td>
        </tr>
      `;
  });
  renderPagination();
}

function getPriorityColor(priority) {
  switch (priority) {
    case "Low":
      return "bg-gray-200";
    case "Medium":
      return "bg-yellow-400";
    case "High":
      return "bg-red-500 text-white";
    default:
      return "";
  }
}

function getStatusColor(status) {
  switch (status) {
    case "ToDo":
      return "bg-red-500 text-white";
    case "Doing":
      return "bg-yellow-400";
    case "Done":
      return "bg-green-600 text-white";
    default:
      return "";
  }
}

document.getElementById("prevPage").addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderToDos();
  }
});

document.getElementById("nextPage").addEventListener("click", () => {
  const totalPages = Math.ceil(toDo.length / tasksPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    renderToDos();
  }
});

function renderPagination() {
  const totalPages = Math.ceil(toDo.length / tasksPerPage);

  const prevButton = document.getElementById("prevPage");
  prevButton.disabled = currentPage === 1;

  const nextButton = document.getElementById("nextPage");
  nextButton.disabled =
    currentPage === totalPages || toDo.length <= tasksPerPage;

  document.getElementById("currentPage").textContent = currentPage;
}

saveTaskBtn.addEventListener("click", () => {
  const taskName = document.getElementById("taskName").value.trim();
  const taskPriority = document.getElementById("taskPriority").value;
  const taskStatus = document.getElementById("taskStatus").value;
  let taskDeadLine = document.getElementById("taskDeadLine").value;
  let taskDetails = document.getElementById("taskDetails").value.trim();

  if (taskDeadLine) {
    taskDeadLine = toShamsi(taskDeadLine);
  }

  if (taskName) {
    isLoading = true;
    toggleLoadingModal();
    setTimeout(() => {
      if (isEditing) {
        const taskIndex = toDo.findIndex((todo) => todo.id === editingId);
        if (taskIndex !== -1) {
          toDo[taskIndex] = {
            taskName,
            taskPriority,
            taskStatus,
            taskDeadLine,
            taskDetails,
            id: editingId,
          };
          showToast("Task updated successfully!", "info");
        }
      } else {
        toDo.push({
          taskName,
          taskPriority,
          taskStatus,
          taskDeadLine,
          taskDetails,
          id: Date.now().toString(),
        });

        currentPage = Math.ceil(toDo.length / tasksPerPage);

        showToast("Task added successfully!", "success");
      }

      localStorage.setItem("toDo", JSON.stringify(toDo));
      closeModal(modalBox, modalContent);
      renderToDos();
      clearModalInputs();

      isEditing = false;
      editingId = null;

      isLoading = false;
      toggleLoadingModal();
    }, 1000);
  } else {
    alert("Please add your Task.");
  }
});

function toggleLoadingModal() {
  const loadingModal = document.getElementById("loading-modal");
  loadingModal.style.display = isLoading ? "flex" : "none";
}

function deleteTask(id) {
  if (confirm("Are you sure you want to delete this task?")) {
    toDo = toDo.filter((todo) => todo.id !== id);
    localStorage.setItem("toDo", JSON.stringify(toDo));

    const totalPages = Math.ceil(toDo.length / tasksPerPage);
    if (currentPage > totalPages) {
      currentPage = totalPages;
    } else if (totalPages === 0) {
      currentPage = 1;
    }

    showToast("Task deleted successfully!", "delete");
    renderToDos();
  }
}

function editTask(id) {
  const task = toDo.find((todo) => todo.id === id);
  if (task) {
    document.getElementById("taskName").value = task.taskName;
    document.getElementById("taskPriority").value = task.taskPriority;
    document.getElementById("taskStatus").value = task.taskStatus;
    document.getElementById("taskDeadLine").value = toGregorian(
      task.taskDeadLine
    );

    openModal(modalBox, modalContent);

    isEditing = true;
    editingId = id;
  }
}

function showDetail(id) {
  const task = toDo.find((todo) => todo.id === id);

  const priorityShow = task.taskPriority === "Choose" ? "-" : task.taskPriority;
  const statusShow = task.taskStatus === "Choose" ? "-" : task.taskStatus;
  const deadLineShow = task.taskDeadLine ? task.taskDeadLine : "-";
  const taskDetails = task.taskDetails ? task.taskDetails : "-";

  detailModal.innerHTML = `
    <div class="flex flex-col gap-4 p-4">
        <div class="relative flex justify-between">
            <button id="closeShowModal" class="absolute top-1 right-0 bg-red-500 px-2 py-1 text-xs text-white rounded">X</button>
            <h2 class="text-lg font-bold">Task Details</h2>
        </div>
         <table class="border bg-gray-100">
            <tr class="border border-2">
              <td class="p-2 border">Task Name:</td>
              <td class="p-2 text-red-700">${task.taskName}</td>
            </tr>
            <tr class="border border-2">
              <td class="p-2 border">Priority:</td>
              <td class="p-2 text-gray-700">${priorityShow}</td>
            </tr>
            <tr class="border border-2">
              <td class="p-2 border">Status:</td>
              <td class="p-2 text-gray-700">${statusShow}</td>
            </tr>
            <tr class="border border-2">
              <td class="p-2 border">Deadline:</td>
              <td class="p-2 text-gray-700">${deadLineShow}</td>
            </tr>
            <tr class="border border-2">
              <td class="p-2 border">Task Details:</td>
              <td class="p-2 text-red-700">${taskDetails}</td>
            </tr>
          </table>
    </div>
  `;

  document.getElementById("closeShowModal").addEventListener("click", () => {
    closeModal(overlay, detailModal);
  });

  openModal(overlay, detailModal);
}

function clearModalInputs() {
  document.getElementById("taskName").value = "";
  document.getElementById("taskPriority").value = "Choose";
  document.getElementById("taskStatus").value = "Choose";
  document.getElementById("taskDeadLine").value = "";
  document.getElementById("taskDetails").value = "";
}

function openModal(modal, content) {
  modal.classList.remove("hidden");

  content.classList.remove("opacity-0", "scale-75");
  content.classList.add("opacity-0", "scale-75");

  setTimeout(() => {
    content.classList.remove("opacity-0", "scale-75");
    content.classList.add("opacity-100", "scale-100");
  }, 100);
}

function closeModal(modal, content) {
  content.classList.remove("opacity-100", "scale-100");
  content.classList.add("opacity-0", "scale-75");

  setTimeout(() => {
    modal.classList.add("hidden");
  }, 10);
}

function showToast(message, type) {
  const toast = document.getElementById("toast");

  let bgColor;
  switch (type) {
    case "success":
      bgColor = "bg-green-500";
      break;
    case "delete":
      bgColor = "bg-red-500";
      break;
    case "info":
      bgColor = "bg-blue-800";
      break;
    default:
      bgColor = "bg-gray-800";
  }
  toast.textContent = message;
  toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded shadow-lg text-sm text-white ${bgColor} transition transform scale-105 duration-400`;
  toast.classList.remove("hidden");

  setTimeout(() => {
    toast.classList.add("hidden");
  }, 3000);
}

renderToDos();
