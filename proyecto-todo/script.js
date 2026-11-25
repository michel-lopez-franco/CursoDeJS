// ---------- Referencias al DOM ----------
const formTarea = document.getElementById("formTarea");
const textoTarea = document.getElementById("textoTarea");
const categoriaTarea = document.getElementById("categoriaTarea");
const fechaTarea = document.getElementById("fechaTarea");
const listaTareas = document.getElementById("listaTareas");
const filtroCategoria = document.getElementById("filtroCategoria");
const porVencer = document.getElementById("porVencer");
const listaPorVencer = document.getElementById("listaPorVencer");
const vacio = document.getElementById("vacio");
const btnTema = document.getElementById("btnTema");

// ---------- Estado ----------
let tareas = JSON.parse(localStorage.getItem("tareas")) || [];

function guardar() {
  localStorage.setItem("tareas", JSON.stringify(tareas));
}

// ---------- Mejora 2: fechas ----------
// Devuelve cuántos días faltan (negativo = ya venció)
function diasRestantes(fechaISO) {
  const [a, m, d] = fechaISO.split("-").map(Number);
  const limite = new Date(a, m - 1, d);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return Math.round((limite - hoy) / 86400000);
}

function textoFecha(fechaISO) {
  const dias = diasRestantes(fechaISO);
  if (dias < 0) return `Venció hace ${-dias} día(s)`;
  if (dias === 0) return "Vence hoy";
  if (dias === 1) return "Vence mañana";
  return `Vence en ${dias} días`;
}

// Una tarea está "por vencer" si no está completada y vence en 2 días o menos
function estaPorVencer(t) {
  return !t.completada && t.fecha && diasRestantes(t.fecha) <= 2;
}

// ---------- Renderizado ----------
function render() {
  listaTareas.innerHTML = "";

  const visibles = tareas.filter(
    (t) => filtroCategoria.value === "Todas" || t.categoria === filtroCategoria.value
  );
  vacio.hidden = visibles.length > 0;

  visibles.forEach((t) => listaTareas.append(crearElemento(t)));
  renderPorVencer();
}

function renderPorVencer() {
  const urgentes = tareas
    .filter(estaPorVencer)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  listaPorVencer.innerHTML = "";
  porVencer.hidden = urgentes.length === 0;

  urgentes.forEach((t) => {
    const li = document.createElement("li");
    li.textContent = `${t.texto} — ${textoFecha(t.fecha)}`;
    listaPorVencer.append(li);
  });
}

function crearElemento(t) {
  const li = document.createElement("li");
  li.className = "tarea";
  if (t.completada) li.classList.add("completada");
  if (estaPorVencer(t)) li.classList.add("urgente");
  li.dataset.id = t.id;

  const check = document.createElement("input");
  check.type = "checkbox";
  check.checked = t.completada;
  check.setAttribute("aria-label", "Marcar como completada");
  check.addEventListener("change", () => alternarCompletada(t.id));

  const info = document.createElement("div");
  info.className = "info";

  const texto = document.createElement("span");
  texto.className = "texto";
  texto.textContent = t.texto;

  const meta = document.createElement("small");
  meta.className = "meta";
  const etiqueta = document.createElement("span");
  etiqueta.className = "etiqueta cat-" + t.categoria.toLowerCase();
  etiqueta.textContent = t.categoria;
  meta.append(etiqueta);
  if (t.fecha) meta.append(" " + textoFecha(t.fecha));

  info.append(texto, meta);

  const acciones = document.createElement("div");
  acciones.className = "acciones";

  // Mejora 1: botón editar
  const btnEditar = document.createElement("button");
  btnEditar.type = "button";
  btnEditar.textContent = "✏️ Editar";
  btnEditar.addEventListener("click", () => editarTarea(t.id, li, info));

  const btnEliminar = document.createElement("button");
  btnEliminar.type = "button";
  btnEliminar.className = "eliminar";
  btnEliminar.textContent = "🗑️ Eliminar";
  btnEliminar.addEventListener("click", () => eliminarTarea(t.id, li));

  acciones.append(btnEditar, btnEliminar);
  li.append(check, info, acciones);
  return li;
}

// ---------- Acciones ----------
formTarea.addEventListener("submit", (e) => {
  e.preventDefault();
  const texto = textoTarea.value.trim();
  if (!texto) return;

  tareas.push({
    id: Date.now(),
    texto,
    categoria: categoriaTarea.value,
    fecha: fechaTarea.value, // "" si no se eligió
    completada: false,
  });
  guardar();
  formTarea.reset();
  render();
});

function alternarCompletada(id) {
  const t = tareas.find((x) => x.id === id);
  t.completada = !t.completada;
  guardar();
  render();
}

// Mejora 1: editar el texto de una tarea existente
function editarTarea(id, li, info) {
  const t = tareas.find((x) => x.id === id);
  const textoSpan = info.querySelector(".texto");

  const input = document.createElement("input");
  input.type = "text";
  input.className = "editando";
  input.value = t.texto;
  input.maxLength = 100;
  textoSpan.replaceWith(input);
  input.focus();
  input.select();

  const btnEditar = li.querySelector(".acciones button");
  btnEditar.textContent = "💾 Guardar";

  function guardarEdicion() {
    const nuevo = input.value.trim();
    if (nuevo) t.texto = nuevo;
    guardar();
    render();
  }

  btnEditar.onclick = guardarEdicion;
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") guardarEdicion();
    if (e.key === "Escape") render(); // cancelar
  });
}

// Mejora 5: animación antes de eliminar
function eliminarTarea(id, li) {
  li.classList.add("saliendo");
  li.addEventListener(
    "animationend",
    () => {
      tareas = tareas.filter((x) => x.id !== id);
      guardar();
      render();
    },
    { once: true }
  );
}

// Mejora 3: filtro por categoría
filtroCategoria.addEventListener("change", render);

// ---------- Mejora 4: modo claro / oscuro ----------
function aplicarTema(oscuro) {
  document.body.classList.toggle("oscuro", oscuro);
  btnTema.textContent = oscuro ? "☀️ Modo claro" : "🌙 Modo oscuro";
  localStorage.setItem("tema", oscuro ? "oscuro" : "claro");
}

btnTema.addEventListener("click", () => {
  aplicarTema(!document.body.classList.contains("oscuro"));
});

aplicarTema(localStorage.getItem("tema") === "oscuro");

// ---------- Inicio ----------
render();
