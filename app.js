import {createTaskButtons} from "./components.js";
import {translations} from "./languages.js";

const globalBell = new Audio('audio/bell.mp3');

let currentLanguage = localStorage.getItem('todo-lang') || 'ru';

const html = document.documentElement;
const toggleBtn = document.querySelector('.toolbar__theme-btn');

const saveTheme = localStorage.getItem('theme') || 'light';
html.setAttribute('data-theme', saveTheme);

function toggleTheme() {
    let currentTheme = html.getAttribute('data-theme');
    let newTheme = currentTheme === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

toggleBtn.addEventListener('click', toggleTheme);

let tasks = JSON.parse(localStorage.getItem('tasks') || '[]'); // беру из браузера список задач, который там был сохранен

const container = document.querySelector('.todo');
const openModalBtn = container.querySelector('.actions__add-btn');
const modal = document.querySelector('.modal');
const tasksList = container.querySelector('.tasks-list__items');
const btnConfirmAdd = document.querySelector('.modal__btn-save');
const btnCancelAdd = document.querySelector('.modal__btn-cancel');
const inputTask = document.querySelector('.modal__input');
const clearBtn = document.querySelector('.actions__clear-btn');
const archivedBtn = document.querySelector('.actions__archive-btn');
const plug = container.querySelector('.task-list__empty');
const search = container.querySelector('#input-search');
const btnSearchTask = container.querySelector('.search__button');
const btnSelectTask = container.querySelector('.filter__button');
const btnConfirmEdit = document.querySelector('#btnSaveEdit');
const filterBtns = container.querySelectorAll('.filter__item');
const filterDropdown = container.querySelector('.filter__dropdown');
const btnChevron = container.querySelector('.btn__chevron');
const btnChangeLanguage = container.querySelector('.btn-lang');
//let inputTime = document.querySelector('.modal__time-input');
const celebrationModal = document.querySelector('#celebrationModal');
const btnCloseCelebration = document.querySelector('#btnCloseCelebration');

let currentEditIndex = null;
let currentFilter = 'all';

let archivedTasks = JSON.parse(localStorage.getItem('todo-archive') || '[]');

function saveArchive() {
    localStorage.setItem('todo-archive', JSON.stringify(archivedTasks));
}

function archiveCompletedTasks() {
    const completed = tasks.filter(task => task.completed === true);

    if (completed.length === 0) return;

    archivedTasks.push(...completed);

    tasks = tasks.filter(task => task.completed === false);
    saveTask();
    saveArchive();
    filterAndRenderTasks();
}

function updatePlaceholder() {
    if (tasks.length > 0) {
        plug.classList.add('hidden');
        clearBtn.classList.remove('hidden');
    } else {
        plug.classList.remove('hidden');
        clearBtn.classList.add('hidden');
    }

    if (archivedBtn) {
        const hasCompletedTasks = tasks.some(task => task.completed === true);

        if (hasCompletedTasks) {
            archivedBtn.classList.remove('hidden', 'btn--disabled');
            archivedBtn.disabled = false;
        } else {
            archivedBtn.classList.add('hidden', 'btn--disabled');
            archivedBtn.disabled = true;
        }
    }
}

function createTaskLi(taskStorage) {
    const listItem = document.createElement('li');
    listItem.className = 'tasks-list__items-cell task';

    const checkbox = document.createElement('input');
    checkbox.className = 'checkbox visually-hidden';
    checkbox.type = 'checkbox';
    checkbox.id = taskStorage.id;
    listItem.appendChild(checkbox);

    //label
    const label = document.createElement('label');
    label.className = 'checkbox-label';
    label.htmlFor = taskStorage.id;

    // Получаем иконки для чекбокса
    const {checkIcon, checkboxIcon} = createTaskButtons(currentLanguage);
    label.appendChild(checkboxIcon);
    label.appendChild(checkIcon);

    listItem.appendChild(label);

    // Текст в спан
    const textSpan = document.createElement('span');
    textSpan.classList.add('task__text');
    textSpan.textContent = taskStorage.title;
    listItem.appendChild(textSpan);

    // Кнопки управления задачей
    const {editTaskBtn, deleteTaskBtn, importantBtn, inProgressBtn} = createTaskButtons(currentLanguage);// Получаем кнопки из функции createTaskButtons
    listItem.appendChild(importantBtn);
    listItem.appendChild(editTaskBtn);
    listItem.appendChild(deleteTaskBtn);
    listItem.appendChild(inProgressBtn);

    if (taskStorage.status === 'in-progress') {
        listItem.classList.add('task--in-progress');
    }

    inProgressBtn.addEventListener('click', () => {
        if (taskStorage.status === 'in-progress') {
            taskStorage.status = 'normal';
            inProgressBtn.ariaLabel = currentLanguage === 'ru' ? 'Отметить как в процессе' : 'Mark as in progress';
        } else {
            taskStorage.status = 'in-progress';
            inProgressBtn.ariaLabel = currentLanguage === 'ru' ? 'Убрать статус в процессе' : 'Remove in progress status';
        }

        listItem.classList.toggle('task--in-progress', taskStorage.status === 'in-progress');

        saveTask();
    })

    if (taskStorage.completed) {
        checkbox.checked = true;
        listItem.classList.add('completed');
        editTaskBtn.classList.add('hidden');
        deleteTaskBtn.classList.add('hidden');
        importantBtn.classList.add('hidden');
        inProgressBtn.classList.add('hidden');
    }

    if (taskStorage.status === 'important') {
        listItem.classList.add('task--important')
    }

    importantBtn.addEventListener('click', () => {
        if (taskStorage.status === 'important') {
            taskStorage.status = 'normal';
            importantBtn.ariaLabel = 'Отметить задачу как важную';
        } else {
            taskStorage.status = 'important';
            importantBtn.ariaLabel = 'Убрать отметку важности';
        }

        listItem.classList.toggle('task--important', taskStorage.status === 'important');

        saveTask();
    })

    checkbox.addEventListener('change', () => {
        taskStorage.completed = checkbox.checked;
        listItem.classList.toggle('completed', checkbox.checked);
        editTaskBtn.classList.toggle('hidden', checkbox.checked);
        deleteTaskBtn.classList.toggle('hidden', checkbox.checked);
        importantBtn.classList.toggle('hidden', checkbox.checked);
        inProgressBtn.classList.toggle('hidden', checkbox.checked);

        saveTask();
        updatePlaceholder();

        const isAllCompleted = tasks.length > 0 && tasks.every(task => task.completed === true);
        if (isAllCompleted === true) {
            celebrationModal.classList.remove('modal--hidden');
            confetti({zIndex: 99999});
        }
    });

    return listItem;
}

function renderTask(taskStorage) {
    const fullTaskRow = createTaskLi(taskStorage)
    tasksList.appendChild(fullTaskRow); // в ul вставляю li
}

function saveTask() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function onHandlerSave() {
    const value = inputTask.value.trim();
    if (value === '' || currentEditIndex === null) return;

    tasks[currentEditIndex].title = value;
    saveTask();
    //localStorage.setItem('tasks', JSON.stringify(tasks));

    const taskElements = document.querySelectorAll('.task');
    const taskDom = taskElements[currentEditIndex];

    if (taskDom) {
        const textSpan = taskDom.querySelector('.task__text');
        if (textSpan) {
            textSpan.textContent = value;
        }
    }

    inputTask.value = '';
    modal.classList.add('modal--hidden');
    updatePlaceholder();
}

function searchTask() {
    const searchTaskValue = search.value.trim().toLowerCase();

    const taskElements = tasksList.querySelectorAll('.task');

    taskElements.forEach(taskElement => {
        const taskText = taskElement.textContent ? taskElement.textContent.trim().toLowerCase() : '';

        if (searchTaskValue === '') {
            return;
        }

        if (taskText.includes(searchTaskValue)) {
            taskElement.classList.add('current-task');
        }

    })
}

function filterAndRenderTasks() {
    tasksList.innerHTML = '';

    let filteredTasks;

    if (currentFilter === 'archived') {
        filteredTasks = archivedTasks;
    } else {
        filteredTasks = tasks.filter(elem => {
            if (currentFilter === 'all') {
                return true;
            }
            if (currentFilter === 'completed') {
                return elem.completed === true;
            }
            if (currentFilter === 'uncompleted') {
                return elem.completed === false;
            }
        })
    }

    filteredTasks.forEach(renderTask);
}

function openModalNewTask() {
    currentEditIndex = null;
    inputTask.value = '';
    inputTask.placeholder = translations[currentLanguage].inputPlaceholderTask;

    const title = document.querySelector('h2');
    title.textContent = translations[currentLanguage].capture;
    btnConfirmAdd.classList.remove('hidden');
    btnConfirmEdit.classList.add('modal__btn-save--hidden');

    modal.classList.remove('modal--hidden');
}

if (clearBtn) {
    clearBtn.textContent = translations[currentLanguage].btnClearAll;
}

function changeLanguage() {
    document.documentElement.lang = currentLanguage;

    const title = document.querySelector('.todo__title');
    const btnTextLang = document.querySelector('.btn__text');
    const searchInput = document.querySelector('.search__input');
    const filterAll = document.querySelector('[data-filter="all"]');
    const filterCompleted = document.querySelector('[data-filter="completed"]');
    const filterUncompleted = document.querySelector('[data-filter="uncompleted"]');
    const filterArchived = document.querySelector('[data-filter="archived"]');
    const filterBtnText = btnSelectTask.querySelector('.btn__text');

    const capture = document.querySelector('#celebrationModal .modal__title');
    const simpleModal = document.querySelector('#simpleModal .modal__title');
    const modalText = document.querySelector('#celebrationModal .modal__text');
    const emptyText = document.querySelector('.task-list__empty-text');
    const btnCancelText = document.querySelector('.modal__btn-cancel .btn__text');
    const btnSaveText = document.querySelector('.modal__btn-save .btn__text');
    const btnSaveNewTask = document.querySelector('#btnSaveEdit .btn__text');
    const btnCelebrationText = btnCloseCelebration.querySelector('.btn__text');

    if (capture) {
        capture.textContent = translations[currentLanguage].titleSuccess;
    }

    if (emptyText) {
        emptyText.textContent = translations[currentLanguage].plug;
    }

    if (simpleModal) {
        simpleModal.textContent = translations[currentLanguage].capture;
    }

    title.textContent = translations[currentLanguage].title;
    btnTextLang.textContent = translations[currentLanguage].btnLang;
    searchInput.placeholder = translations[currentLanguage].inputPlaceholderSearch;
    filterAll.textContent = translations[currentLanguage].filtersAll;
    filterCompleted.textContent = translations[currentLanguage].filterCompleted;
    filterUncompleted.textContent = translations[currentLanguage].filterUncompleted;
    filterArchived.textContent = translations[currentLanguage].filterArchived;
    filterBtnText.textContent = translations[currentLanguage].btnAllTasks;
    capture.textContent = translations[currentLanguage].titleSuccess;
    modalText.textContent = translations[currentLanguage].textSuccess;
    simpleModal.textContent = translations[currentLanguage].capture;
    btnCancelText.textContent = translations[currentLanguage].btnCancel;
    btnSaveText.textContent = translations[currentLanguage].btnSave;
    btnSaveNewTask.textContent = translations[currentLanguage].btnSave;
    btnCelebrationText.textContent = translations[currentLanguage].btnSuccess;
    emptyText.textContent = translations[currentLanguage].plug;

    if (clearBtn) {
        clearBtn.textContent = translations[currentLanguage].btnClearAll;
    }
    if (archivedBtn) {
        archivedBtn.textContent = translations[currentLanguage].btnArchived;
    }

}

btnChangeLanguage.addEventListener('click', () => {
    if (currentLanguage === 'ru') {
        currentLanguage = 'en';
    } else {
        currentLanguage = 'ru';
    }
    localStorage.setItem('todo-lang', currentLanguage);

    changeLanguage();
});

btnSelectTask.addEventListener('click', () => {
    filterDropdown.classList.toggle('hidden');
    btnChevron.classList.toggle('rotate');
});
btnSearchTask.addEventListener('click', searchTask);

clearBtn.addEventListener('click', () => {
    tasks = [];
    localStorage.setItem('tasks', JSON.stringify(tasks));
    tasksList.innerHTML = '';

    updatePlaceholder();
})

openModalBtn.addEventListener('click', openModalNewTask)

btnCancelAdd.addEventListener('click', () => {
    inputTask.value = '';
    modal.classList.add('modal--hidden');
    updatePlaceholder();
})

/*добавление новой задачи*/
btnConfirmAdd.addEventListener('click', () => {
    globalBell.play().then(() => {
        globalBell.pause();
        globalBell.currentTime = 0;
    }).catch(e => console.log("Аудио ждет полной активации"));

    const uniqueId = 'todo-' + Date.now() + Math.random().toString(36).slice(2, 4);

    let taskData = {
        id: uniqueId,
        title: '',
        status: 'normal',
        completed: false,
       // reminderTime: inputTime.value
    }
    const value = inputTask.value.trim();
    if (value === '') return;
    taskData.title = value;
    taskData.id = uniqueId;
    tasks.push(taskData);
    saveTask();
    renderTask(taskData);
    inputTask.value = '';
 //   inputTime.value = '';
    modal.classList.add('modal--hidden');
    updatePlaceholder();
});

btnConfirmEdit.addEventListener('click', onHandlerSave);

tasksList.addEventListener('click', (e) => {
    const targetElem = e.target;
    const trashBtn = targetElem.closest('.task__btn-trash');
    const editBtn = targetElem.closest('.task__btn-edit');

    if (trashBtn) {
        const taskItem = trashBtn.closest('.task');
        if (!taskItem) return;
        const taskElements = Array.from(tasksList.querySelectorAll('.task'));
        const index = taskElements.indexOf(taskItem);

        if (index !== -1) {
            tasks.splice(index, 1);
            localStorage.setItem('tasks', JSON.stringify(tasks));
            taskItem.remove();
        }
    } else if (editBtn) {
        /*редактирование текущей задачи*/
        const editTask = editBtn.closest('.task');

        if (!editTask) return;

        const textSpan = editTask.querySelector('.task__text');
        const editTaskText = textSpan ? textSpan.textContent.trim() : '';

        const taskElements = Array.from(tasksList.querySelectorAll('.task'));
        currentEditIndex = taskElements.indexOf(editTask);

        modal.classList.remove('modal--hidden');

        const title = document.querySelector('h2');
        title.textContent = translations[currentLanguage].modalCapture;
        inputTask.placeholder = editTaskText;
        inputTask.value = editTaskText;

        btnConfirmAdd.classList.add('hidden');
        btnConfirmEdit.classList.remove('modal__btn-save--hidden');
    }

    updatePlaceholder();
});

filterBtns.forEach(filterBtn => {
    filterBtn.addEventListener('click', (e) => {
        currentFilter = e.target.getAttribute('data-filter');
        filterAndRenderTasks();

        filterDropdown.classList.add('hidden');
        btnChevron.classList.remove('hidden');
    });
});

btnCloseCelebration.addEventListener('click', () => {
    celebrationModal.classList.add('modal--hidden');
})

archivedBtn.addEventListener('click', archiveCompletedTasks);

changeLanguage();
filterAndRenderTasks();
updatePlaceholder();

function checkReminders () {
    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getHours()).padStart(2, '0');
    const currentTime = `${currentHours} : ${currentMinutes}`;

    tasks.forEach(task => {
        if (!task.completed && task.reminderTime === currentTime) {
            globalBell.play().catch(err => console.log("Браузер все еще блокирует звук:", err));

            task.reminderTime = '';
            saveTask();
        }
    })
}

setInterval(checkReminders, 60000);
