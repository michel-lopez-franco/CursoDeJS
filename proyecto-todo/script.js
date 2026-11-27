// Selección de elementos del DOM
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskDate = document.getElementById('task-date');
const taskCategory = document.getElementById('task-category');
const taskList = document.getElementById('task-list');
const themeToggle = document.getElementById('theme-toggle');
const filterBtns = document.querySelectorAll('.filter-btn');
const categoryFilter = document.getElementById('category-filter');

// Estado de la aplicación
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'todas';
let currentCategory = 'todas';

// 1. MODO CLARO Y OSCURO
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  themeToggle.textContent = isDark ? '☀️ Modo Claro' : '🌙 Modo Oscuro';
  localStorage.setItem('darkMode', isDark);
});

// Cargar preferencia de tema al iniciar
if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark-mode');
  themeToggle.textContent = '☀️ Modo Claro';
}

// 2. AGREGAR TAREA
taskForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const newTask = {
    id: Date.now(),
    text: taskInput.value.trim(),
    dueDate: taskDate.value,
    category: taskCategory.value
  };

  tasks.push(newTask);
  saveAndRender();
  taskForm.reset();
});

// 3. VERIFICAR SI ESTÁ POR VENCER (Hoy o en los próximos 3 días)
function isExpiringSoon(dateString) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Ajuste de zona horaria para evitar desfases de un día
  const [year, month, day] = dateString.split('-');
  const dueDate = new Date(year, month - 1, day);

  const diffTime = dueDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays >= 0 && diffDays <= 3;
}

// 4. RENDERIZAR TAREAS Y FILTROS
function renderTasks() {
  taskList.innerHTML = '';

  const filteredTasks = tasks.filter(task => {
    const matchesCategory = currentCategory === 'todas' || task.category === currentCategory;
    const matchesExpiration = currentFilter === 'todas' || isExpiringSoon(task.dueDate);
    return matchesCategory && matchesExpiration;
  });

  filteredTasks.forEach(task => {
    const li = document.createElement('li');
    const expiring = isExpiringSoon(task.dueDate);
    
    li.className = `task-item ${expiring ? 'expiring-soon' : ''}`;
    li.dataset.id = task.id;

    li.innerHTML = `
      <div class="task-info">
        <span class="task-text">${task.text}</span>
        <div class="task-meta">
          <span class="badge">${task.category}</span>
          <span>📅 Vence: ${task.dueDate} ${expiring ? '<strong>(¡Por vencer!)</strong>' : ''}</span>
        </div>
      </div>
      <div class="task-actions">
        <button class="btn-edit" onclick="editTask(${task.id})">✏️ Editar</button>
        <button class="btn-delete" onclick="deleteTask(${task.id}, this)">🗑️ Eliminar</button>
      </div>
    `;

    taskList.appendChild(li);
  });
}

// 5. EDITAR TEXTO DE TAREA EXISTENTE
window.editTask = function(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  const newText = prompt('Edita el texto de la tarea:', task.text);
  
  if (newText !== null && newText.trim() !== '') {
    task.text = newText.trim();
    saveAndRender();
  }
};

// 6. ANIMACIÓN ANTES DE ELIMINAR
window.deleteTask = function(id, buttonElement) {
  const taskItem = buttonElement.closest('.task-item');
  
  // Agrega la clase que dispara el @keyframes en CSS
  taskItem.classList.add('removing');

  // Espera a que termine la animación para eliminar del arreglo y re-renderizar
  taskItem.addEventListener('animationend', () => {
    tasks = tasks.filter(t => t.id !== id);
    saveAndRender();
  });
};

// Eventos de filtros
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

categoryFilter.addEventListener('change', (e) => {
  currentCategory = e.target.value;
  renderTasks();
});

function saveAndRender() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
  renderTasks();
}

// Inicializar vista
renderTasks();
