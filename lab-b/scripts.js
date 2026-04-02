console.debug("Hello world!");

document.getElementById("datePicker").valueAsDate = new Date();

// Array to hold todo items
let todoItems = [];
let searchQuery = "";

// Function to save to localStorage
function saveToLocalStorage() {
    localStorage.setItem('todoItems', JSON.stringify(todoItems));
}

// Function to load from localStorage
function loadFromLocalStorage() {
    const stored = localStorage.getItem('todoItems');
    if (stored) {
        todoItems = JSON.parse(stored);
    }
}

// Function to highlight text
function highlightText(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

// Function to render the todo list
function renderTodoList() {
    const toDoList = document.getElementById("toDoItems");
    toDoList.innerHTML = ""; // Clear the list

    // Sort items by date (closest first)
    todoItems.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Filter items based on search query
    const filteredItems = searchQuery ? todoItems.filter(item => item.text.toLowerCase().includes(searchQuery.toLowerCase())) : todoItems;

    filteredItems.forEach((item, index) => {
        const listItem = document.createElement("li");

        // Checkbox
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `checkbox-${index}`;
        checkbox.addEventListener("change", updateSaveButton);

        // Text span
        const textSpan = document.createElement("span");
        textSpan.innerHTML = highlightText(item.text, searchQuery) + " - " + item.date;
        textSpan.addEventListener("click", () => editItem(index));

        // Delete button (X)
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "X";
        deleteButton.className = "delete-btn";
        deleteButton.addEventListener("click", () => {
            todoItems.splice(index, 1);
            saveToLocalStorage();
            renderTodoList();
        });

        listItem.appendChild(checkbox);
        listItem.appendChild(textSpan);
        listItem.appendChild(deleteButton);

        toDoList.appendChild(listItem);
    });
}

// Function to edit an item
function editItem(index) {
    const item = todoItems[index];
    const listItem = document.querySelector(`#checkbox-${index}`).parentElement;

    // Replace span with inputs
    const textInput = document.createElement("input");
    textInput.type = "text";
    textInput.value = item.text;

    const dateInput = document.createElement("input");
    dateInput.type = "date";
    dateInput.value = item.date;

    const saveEditBtn = document.createElement("button");
    saveEditBtn.textContent = "Save";
    saveEditBtn.addEventListener("click", () => {
        item.text = textInput.value.trim();
        item.date = dateInput.value;
        saveToLocalStorage();
        renderTodoList();
    });

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", () => renderTodoList());

    // Clear and rebuild li
    listItem.innerHTML = "";
    listItem.appendChild(textInput);
    listItem.appendChild(dateInput);
    listItem.appendChild(saveEditBtn);
    listItem.appendChild(cancelBtn);
}

// Function to update the Save/Delete button
function updateSaveButton() {
    const checkboxes = document.querySelectorAll("#toDoItems input[type='checkbox']");
    const saveButton = document.getElementById("saveButton");
    const anyChecked = Array.from(checkboxes).some(cb => cb.checked);

    if (anyChecked) {
        saveButton.textContent = "Delete";
        saveButton.className = "delete-mode";
    } else {
        saveButton.textContent = "Save";
        saveButton.className = "";
    }
}

// Search functionality
document.getElementById("searchButton").addEventListener("click", function() {
    searchQuery = document.getElementById("searchBar").value.trim();
    renderTodoList();
});

// Add todo item to the list
document.getElementById("saveButton").addEventListener("click", function(event) {
    event.preventDefault();

    const toDoInput = document.getElementById("toDoBar");
    const dateInput = document.getElementById("datePicker");
    const saveButton = document.getElementById("saveButton");

    if (saveButton.textContent === "Delete") {
        // Delete selected items
        const checkboxes = document.querySelectorAll("#toDoItems input[type='checkbox']");
        const indicesToDelete = [];
        checkboxes.forEach((cb, index) => {
            if (cb.checked) {
                indicesToDelete.push(index);
            }
        });
        // Remove from array in reverse order to maintain indices
        indicesToDelete.reverse().forEach(index => {
            todoItems.splice(index, 1);
        });
        saveToLocalStorage();
        renderTodoList();
        updateSaveButton();
    } else {
        // Add new item
        const toDoText = toDoInput.value.trim();
        const toDoDate = dateInput.value;

        // Validate that fields are not empty
        if (toDoText === "" || toDoDate === "") {
            alert("Please fill in both the todo text and date!");
            return;
        }

        // Add to array
        todoItems.push({ text: toDoText, date: toDoDate });
        saveToLocalStorage();

        // Render the list
        renderTodoList();

        // Clear the input fields
        toDoInput.value = "";
        dateInput.valueAsDate = new Date();
    }
});

// Load from localStorage on start
loadFromLocalStorage();

// Initial render
renderTodoList();
