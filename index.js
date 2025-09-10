// GymTracker - Clean unified session state implementation
// Persisted under localStorage key: gymTrackerState

window.addEventListener('DOMContentLoaded', () => {
  // --- Elements ---
  const app = document.getElementById('app');
  const splashScreen = document.getElementById('splash-screen');
  // Asegurar que el splash esté visible al inicio
  splashScreen?.classList.remove('hidden');

  const views = {
    routines: document.getElementById('routines-view'),
    routineForm: document.getElementById('routine-form-view'),
    workoutSession: document.getElementById('workout-session-view'),
  };
  // Listeners delegados como respaldo por si falla el binding directo
  document.addEventListener('click', (e) => {
    const finishBtn = e.target.closest('#finish-workout-btn');
    if (finishBtn) {
      console.log('[UI] Click en Finalizar y Guardar (delegated)');
      if (confirmationModalContainer) {
        showConfirmationModal({
          title: '¿Finalizar y Guardar?',
          message: 'Se guardará tu sesión en el historial. ¿Deseas continuar?',
          confirmText: 'Guardar',
          confirmClasses: ['bg-yellow-400','hover:bg-yellow-300','text-gray-900'],
          onConfirm: handleSaveSession,
        });
      } else if (window.confirm('¿Finalizar y Guardar? Se guardará tu sesión en el historial.')) {
        handleSaveSession();
      }
      return;
    }
    const cancelBtn = e.target.closest('#cancel-workout-btn');
    if (cancelBtn) {
      console.log('[UI] Click en Cancelar (delegated)');
      if (confirmationModalContainer) {
        handleCancelSession();
      } else if (window.confirm('¿Cancelar Entrenamiento? El progreso no guardado se perderá.')) {
        state.activeSession = null;
        saveState();
        loadState();
        renderRoutines();
        showView('routines');
      }
    }
  });

  const createRoutineFab = document.getElementById('create-routine-fab');
  const saveRoutineBtn = document.getElementById('save-routine-btn');
  const cancelRoutineBtn = document.getElementById('cancel-routine-btn');
  const addExerciseBtn = document.getElementById('add-exercise-btn');
  const finishWorkoutBtn = document.getElementById('finish-workout-btn');
  const cancelWorkoutBtn = document.getElementById('cancel-workout-btn');
  const exportCsvBtn = document.getElementById('export-csv-btn');

  const routinesList = document.getElementById('routines-list');
  const noRoutinesMessage = document.getElementById('no-routines-message');
  const routineFormView = document.getElementById('routine-form-view');
  const routineFormTitle = document.getElementById('routine-form-title');
  const routineNameInput = document.getElementById('routine-name-input');
  const exercisesContainer = document.getElementById('exercises-container');

  const sessionInfo = {
    name: document.getElementById('session-routine-name'),
    date: document.getElementById('session-date'),
  };
  const sessionTabsContainer = document.getElementById('session-tabs-container');
  const sessionContentContainer = document.getElementById('session-content-container');

  const confirmationModalContainer = document.getElementById('confirmation-modal-container');
  const confirmationTitle = document.getElementById('confirmation-title');
  const confirmationMessage = document.getElementById('confirmation-message');
  const confirmActionBtn = document.getElementById('confirm-action-btn');
  const cancelConfirmationBtn = document.getElementById('cancel-confirmation-btn');
  let confirmActionCallback = null;

  // --- State ---
  let state = { routines: [], history: [], activeSession: null };

  const loadState = () => {
    const saved = localStorage.getItem('gymTrackerState');
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      state.routines = parsed.routines || [];
      state.history = parsed.history || [];
      state.activeSession = parsed.activeSession || null;
    } catch (e) {
      console.error('Error parsing gymTrackerState', e);
      state = { routines: [], history: [], activeSession: null };
    }
  };

  const saveState = () => {
    try {
      localStorage.setItem('gymTrackerState', JSON.stringify(state));
    } catch (e) {
      console.error('Error saving gymTrackerState', e);
    }
  };

  // Per-routine sessions store
  const loadSessions = (routineId) => {
    try {
      const raw = localStorage.getItem(`sessions_${routineId}`);
      return raw ? JSON.parse(raw).sort((a,b)=> new Date(b.date)-new Date(a.date)) : [];
    } catch (e) { console.error('loadSessions error', e); return []; }
  };
  const saveSession = (routineId, session) => {
    const sessions = loadSessions(routineId);
    sessions.unshift(session);
    localStorage.setItem(`sessions_${routineId}`, JSON.stringify(sessions));
  };
  const deleteSession = (routineId, sessionId) => {
    let sessions = loadSessions(routineId);
    sessions = sessions.filter(s => s.session_id !== sessionId);
    localStorage.setItem(`sessions_${routineId}`, JSON.stringify(sessions));
  };

  // --- Navigation ---
  const showView = (name) => {
    Object.values(views).forEach(v => v && v.classList.remove('active'));
    const v = views[name];
    if (v) v.classList.add('active');
    if (createRoutineFab) createRoutineFab.style.display = name === 'routines' ? 'flex' : 'none';
  };

  // --- Modal ---
  const showConfirmationModal = ({ title, message, confirmText, confirmClasses, onConfirm }) => {
    if (!confirmationModalContainer) return;
    console.log('[Modal] Abriendo modal:', { title, confirmText });
    confirmationTitle.textContent = title;
    confirmationMessage.textContent = message;
    confirmActionBtn.textContent = confirmText;
    confirmActionBtn.className = 'py-3 px-6 font-bold rounded-lg text-white transition-colors';
    confirmActionBtn.classList.add(...confirmClasses);
    confirmActionCallback = onConfirm;
    confirmationModalContainer.classList.remove('hidden');
    confirmActionBtn.focus();
  };
  const hideConfirmationModal = () => {
    confirmActionCallback = null;
    confirmationModalContainer?.classList.add('hidden');
  };

  // --- Routines UI ---
  const createRoutineCard = (routine) => {
    const card = document.createElement('div');
    card.className = 'bg-gray-800 p-6 rounded-2xl transform hover:-translate-y-1 transition-transform duration-300 flex flex-col relative';
    const exerciseText = routine.exercises.length === 1 ? 'ejercicio' : 'ejercicios';
    card.innerHTML = `
      <div class="absolute top-3 right-3 flex items-center space-x-2">
        <button data-routine-id="${routine.id}" class="edit-routine-btn p-2 text-gray-500 hover:text-yellow-400 transition-colors rounded-full" aria-label="Editar rutina ${routine.name}">✏️</button>
        <button data-routine-id="${routine.id}" class="delete-routine-btn p-2 text-gray-500 hover:text-red-500 transition-colors rounded-full" aria-label="Eliminar rutina ${routine.name}">🗑️</button>
      </div>
      <div class="flex-grow">
        <h3 class="text-2xl font-bold tracking-wide text-white">${routine.name}</h3>
        <p class="text-sm text-gray-400 mt-1">${routine.exercises.length} ${exerciseText}</p>
      </div>
      <button data-routine-id="${routine.id}" class="start-workout-btn w-full mt-6 py-3 px-5 font-bold rounded-lg text-gray-900 bg-yellow-400 hover:bg-yellow-300 transition-colors" aria-label="Empezar entrenamiento ${routine.name}">Empezar</button>
    `;
    return card;
  };

  const renderRoutines = () => {
    if (!routinesList || !noRoutinesMessage) return;
    routinesList.innerHTML = '';
    if (state.routines.length === 0) {
      noRoutinesMessage.style.display = 'block';
      routinesList.style.display = 'none';
      return;
    }
    noRoutinesMessage.style.display = 'none';
    routinesList.style.display = 'grid';
    const frag = document.createDocumentFragment();
    state.routines.forEach(r => frag.appendChild(createRoutineCard(r)));
    routinesList.appendChild(frag);
  };

  const addExerciseInput = (name = '', sets = 4) => {
    if (!exercisesContainer) return;
    const div = document.createElement('div');
    div.className = 'exercise-entry flex items-center space-x-2';
    div.innerHTML = `
      <input type="text" value="${name}" class="exercise-name-input flex-grow p-3 rounded-lg bg-gray-700 border-2 border-gray-600 focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-white" placeholder="Nombre del ejercicio" />
      <input type="number" value="${String(sets)}" min="1" class="exercise-sets-input w-20 text-center p-3 rounded-lg bg-gray-700 border-2 border-gray-600 focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-white" aria-label="Número de series" />
      <button type="button" class="remove-exercise-btn text-gray-500 hover:text-red-500 p-2 rounded-full transition-colors flex-shrink-0">✖</button>
    `;
    exercisesContainer.appendChild(div);
  };

  const openCreateRoutineForm = () => {
    if (!routineFormView) return;
    routineFormView.removeAttribute('data-editing-id');
    routineFormTitle.textContent = 'Crear Nueva Rutina';
    routineNameInput.value = '';
    exercisesContainer.innerHTML = '';
    addExerciseInput();
    saveRoutineBtn.textContent = 'Guardar Rutina';
    showView('routineForm');
  };

  const openEditRoutineForm = (routineId) => {
    const routine = state.routines.find(r => r.id === routineId);
    if (!routine || !routineFormView) return;
    routineFormView.dataset.editingId = String(routineId);
    routineFormTitle.textContent = 'Editar Rutina';
    routineNameInput.value = routine.name;
    exercisesContainer.innerHTML = '';
    routine.exercises.forEach(ex => addExerciseInput(ex.name, ex.sets));
    saveRoutineBtn.textContent = 'Actualizar Rutina';
    showView('routineForm');
  };

  // --- Workout session UI ---
  const renderSessionTabs = (routineId, { limit = 4 } = {}) => {
    if (!sessionTabsContainer) return;
    sessionTabsContainer.innerHTML = '';
    const frag = document.createDocumentFragment();

    const todayTab = document.createElement('button');
    todayTab.className = 'session-tab';
    todayTab.textContent = 'Hoy';
    todayTab.setAttribute('role', 'tab');
    todayTab.setAttribute('aria-selected', 'true');
    todayTab.dataset.sessionId = 'today';
    frag.appendChild(todayTab);

    const sessions = loadSessions(routineId);
    sessions.slice(0, limit).forEach(s => {
      const d = new Date(s.date);
      const dateString = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
      const tab = document.createElement('button');
      tab.className = 'session-tab';
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', 'false');
      tab.dataset.sessionId = s.session_id;
      tab.innerHTML = `<span>${dateString}</span><button class="session-tab-delete-btn" data-session-id="${s.session_id}" aria-label="Eliminar sesión del ${dateString}">✖</button>`;
      frag.appendChild(tab);
    });

    sessionTabsContainer.appendChild(frag);
  };

  const renderSessionBlock = (routine, { editable, prefillData = null }) => {
    if (!sessionContentContainer) return;
    sessionContentContainer.innerHTML = '';
    const frag = document.createDocumentFragment();

    const exercises = editable ? routine.exercises : routine.workoutData;
    if (!exercises || exercises.length === 0) {
      sessionContentContainer.innerHTML = `<p class="text-center text-gray-400">No se encontraron ejercicios.</p>`;
      return;
    }

    exercises.forEach(exercise => {
      const exerciseName = editable ? exercise.name : exercise.exerciseName;
      const card = document.createElement('div');
      card.className = 'bg-gray-800 p-5 rounded-xl';
      card.dataset.exerciseName = exerciseName;
      const title = document.createElement('h4');
      title.className = 'text-xl font-bold mb-4 text-yellow-400 tracking-wide';
      title.textContent = exerciseName;
      card.appendChild(title);

      const header = document.createElement('div');
      header.className = 'grid grid-cols-4 items-center gap-3 mb-3 text-xs text-gray-400 font-bold uppercase tracking-wider';
      header.innerHTML = `<span>Serie</span><span>Reps</span><span>Peso (kg)</span><span>RPE</span>`;
      card.appendChild(header);

      const numSets = editable ? exercise.sets : exercise.sets.length;
      for (let i = 1; i <= numSets; i++) {
        const row = document.createElement('div');
        row.className = 'grid grid-cols-4 items-center gap-3 mb-2 set-row';
        row.dataset.setIndex = String(i);
        const setLabel = document.createElement('span');
        setLabel.className = 'font-semibold text-gray-300';
        setLabel.textContent = `Serie ${i}`;
        row.appendChild(setLabel);

        const makeCell = (value, type) => {
          if (editable && type !== 'text') {
            const input = document.createElement('input');
            input.type = 'number';
            input.dataset.type = type;
            input.placeholder = '-';
            input.value = value ?? '';
            input.className = 'w-full text-center p-2 rounded-lg bg-gray-700 border-2 border-gray-600 text-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent';
            input.setAttribute('aria-label', `${type} para ${exerciseName} serie ${i}`);
            if (type === 'rpe') { input.step = '0.5'; input.min = '1'; input.max = '10'; }
            return input;
          }
          const span = document.createElement('span');
          span.className = 'text-center font-medium p-2';
          span.textContent = value ?? '-';
          return span;
        };

        if (editable) {
          const key = `${exerciseName}-${i}`;
          const prefillSet = prefillData?.[key] || {};
          row.appendChild(makeCell(prefillSet.reps ?? '', 'reps'));
          row.appendChild(makeCell(prefillSet.weight ?? '', 'weight'));
          row.appendChild(makeCell(prefillSet.rpe ?? '', 'rpe'));
        } else {
          const hist = exercise.sets.find(s => s.set === i) || {};
          row.appendChild(makeCell(hist.reps ?? '-', 'text'));
          row.appendChild(makeCell(hist.weight ?? '-', 'text'));
          row.appendChild(makeCell(hist.rpe ?? '-', 'text'));
        }

        card.appendChild(row);
      }

      frag.appendChild(card);
    });

    sessionContentContainer.appendChild(frag);
  };

  const renderWorkoutSession = (routineId) => {
    const routine = state.routines.find(r => r.id === routineId);
    if (!routine) { showView('routines'); return; }
    // ensure active session
    if (!state.activeSession || state.activeSession.routineId !== routineId) {
      state.activeSession = { routineId, sessionData: {} };
      saveState();
    }
    app.dataset.currentRoutineId = String(routineId);
    sessionInfo.name.textContent = routine.name;
    sessionInfo.date.textContent = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    renderSessionTabs(routineId);
    renderSessionBlock(routine, { editable: true, prefillData: state.activeSession.sessionData });
    showView('workoutSession');
  };

  // --- Session I/O ---
  const handleInputChange = (e) => {
    const target = e.target;
    if (!target.matches('input[data-type]')) return;
    if (!state.activeSession) return;
    const row = target.closest('.set-row');
    const card = target.closest('[data-exercise-name]');
    if (!row || !card) return;
    const exercise = card.dataset.exerciseName;
    const setIndex = row.dataset.setIndex;
    const key = `${exercise}-${setIndex}`;
    if (!state.activeSession.sessionData[key]) state.activeSession.sessionData[key] = {};
    state.activeSession.sessionData[key][target.dataset.type] = target.value;
    saveState();
  };

  const handleSaveSession = () => {
    console.log('[Guardar] Iniciando guardado de sesión...');
    try {
      if (!state.activeSession) return;
      const routineId = state.activeSession.routineId;
      const routine = state.routines.find(r => r.id === routineId);
      if (!routine) return;

      const workoutData = [];
      let hasAnyData = false; // considerar reps, peso o rpe como dato válido
      const cards = sessionContentContainer?.querySelectorAll('[data-exercise-name]') || [];

      cards.forEach(c => {
        const name = c.dataset.exerciseName;
        const sets = [];
        c.querySelectorAll('.set-row').forEach(row => {
          const idx = Number(row.dataset.setIndex);
          const repsEl = row.querySelector('input[data-type="reps"]');
          const weightEl = row.querySelector('input[data-type="weight"]');
          const rpeEl = row.querySelector('input[data-type="rpe"]');
          const reps = repsEl ? repsEl.value : '';
          const weight = weightEl ? weightEl.value : '';
          const rpe = rpeEl ? rpeEl.value : '';
          if (reps || weight || rpe) {
            hasAnyData = true;
            sets.push({ set: idx, reps: reps ? Number(reps) : null, weight: weight ? Number(weight) : null, rpe: rpe ? Number(rpe) : null });
          }
        });
        if (sets.length) workoutData.push({ exerciseName: name, sets });
      });

      if (!hasAnyData) {
        console.warn('[Guardar] No hay datos cargados, mostrando aviso');
        if (confirmationModalContainer) {
          showConfirmationModal({
            title: 'Entrenamiento vacío',
            message: 'Añade al menos un dato (reps, peso o RPE) para guardar.',
            confirmText: 'Entendido',
            confirmClasses: ['bg-yellow-400', 'hover:bg-yellow-300', 'text-gray-900'],
            onConfirm: () => {}
          });
        } else {
          alert('Entrenamiento vacío: añade al menos un dato (reps, peso o RPE) para guardar.');
        }
        return;
      }

      const newSession = { session_id: `sess_${Date.now()}`, date: new Date().toISOString(), workoutData };
      console.log('[Guardar] Guardando sesión:', newSession);
      saveSession(routineId, newSession);
      state.history.push({ ...newSession, routineName: routine.name });
      state.activeSession = null;
      saveState();

      // Cerrar cualquier modal abierto por seguridad
      const modalOpen = !confirmationModalContainer?.classList.contains('hidden');
      if (modalOpen) confirmationModalContainer.classList.add('hidden');

      console.log('[Guardar] Sesión guardada. Navegando a rutinas');
      renderRoutines();
      showView('routines');
      // Mostrar confirmación de éxito
      setTimeout(() => {
        showConfirmationModal({
          title: '¡Guardado! ✅',
          message: 'Tu sesión se guardó correctamente en el historial.',
          confirmText: 'Aceptar',
          confirmClasses: ['bg-yellow-400','hover:bg-yellow-300','text-gray-900'],
          onConfirm: () => {}
        });
      }, 100);
    } catch (err) {
      console.error('Error al guardar la sesión:', err);
      showConfirmationModal({
        title: 'Error al guardar',
        message: 'Ocurrió un problema al guardar la sesión. Revisa los datos e inténtalo nuevamente.',
        confirmText: 'Entendido',
        confirmClasses: ['bg-red-600', 'hover:bg-red-700'],
        onConfirm: () => {}
      });
    }
  };

  const handleCancelSession = () => {
    showConfirmationModal({
      title: '¿Cancelar Entrenamiento?',
      message: 'El progreso no guardado se perderá. ¿Estás seguro?',
      confirmText: 'Sí, Cancelar',
      confirmClasses: ['bg-gray-600', 'hover:bg-gray-500'],
      onConfirm: () => {
        console.log('[Cancelar] Confirmado, limpiando sesión y volviendo a rutinas');
        // Limpiar sesión activa y refrescar la vista de rutinas
        state.activeSession = null;
        saveState();
        // Asegurar estado actualizado desde localStorage (por si algo externo lo modificó)
        loadState();
        renderRoutines();
        hideConfirmationModal();
        showView('routines');
      }
    });
  };

  const exportHistoryToCsv = () => {
    if (state.history.length === 0) {
      showConfirmationModal({
        title: 'Historial vacío',
        message: 'No hay datos para exportar.',
        confirmText: 'Entendido',
        confirmClasses: ['bg-yellow-400', 'hover:bg-yellow-300', 'text-gray-900'],
        onConfirm: () => {}
      });
      return;
    }
    const headers = ["Fecha","Nombre de la Rutina","Nombre del Ejercicio","Numero de Serie","Repeticiones","Peso (kg)","RPE"];
    let csv = headers.join(',') + '\r\n';
    state.history.forEach(h => {
      const date = new Date(h.date).toISOString().slice(0,10);
      const routineName = h.routineName || '';
      h.workoutData.forEach(ex => {
        ex.sets.forEach(s => {
          csv += [`"${date}"`,`"${routineName}"`,`"${ex.exerciseName}"`,s.set,s.reps ?? '',s.weight ?? '',s.rpe ?? ''].join(',') + '\r\n';
        });
      });
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `historial_entrenamiento_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // --- Event wiring ---
  routinesList?.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const routineId = Number(btn.getAttribute('data-routine-id'));
    if (btn.classList.contains('start-workout-btn')) {
      renderWorkoutSession(routineId);
    } else if (btn.classList.contains('edit-routine-btn')) {
      openEditRoutineForm(routineId);
    } else if (btn.classList.contains('delete-routine-btn')) {
      showConfirmationModal({
        title: '¿Eliminar Rutina?',
        message: 'Esta acción no se puede deshacer.',
        confirmText: 'Eliminar',
        confirmClasses: ['bg-red-600','hover:bg-red-700'],
        onConfirm: () => {
          state.routines = state.routines.filter(r => r.id !== routineId);
          localStorage.removeItem(`sessions_${routineId}`);
          saveState();
          renderRoutines();
        }
      });
    }
  });

  sessionTabsContainer?.addEventListener('click', (e) => {
    const delBtn = e.target.closest('.session-tab-delete-btn');
    const tabBtn = e.target.closest('.session-tab');
    const routineId = Number(app.dataset.currentRoutineId);
    if (!routineId) return;

    if (delBtn) {
      e.stopPropagation();
      const sessionId = delBtn.dataset.sessionId;
      showConfirmationModal({
        title: '¿Eliminar Sesión?',
        message: 'Se eliminará el historial de este día.',
        confirmText: 'Sí, Eliminar',
        confirmClasses: ['bg-red-600','hover:bg-red-700'],
        onConfirm: () => {
          deleteSession(routineId, sessionId);
          renderWorkoutSession(routineId);
        }
      });
      return;
    }

    if (tabBtn) {
      sessionTabsContainer.querySelectorAll('.session-tab').forEach(t => t.setAttribute('aria-selected','false'));
      tabBtn.setAttribute('aria-selected','true');
      const sessionId = tabBtn.dataset.sessionId;
      const routine = state.routines.find(r => r.id === routineId);
      if (sessionId === 'today') {
        renderSessionBlock(routine, { editable: true, prefillData: state.activeSession?.sessionData || null });
      } else {
        const sessions = loadSessions(routineId);
        const historic = sessions.find(s => s.session_id === sessionId);
        renderSessionBlock(historic, { editable: false });
      }
    }
  });

  sessionContentContainer?.addEventListener('input', handleInputChange);
  createRoutineFab?.addEventListener('click', openCreateRoutineForm);
  addExerciseBtn?.addEventListener('click', () => addExerciseInput());
  exercisesContainer?.addEventListener('click', (e) => {
    const btn = e.target.closest('.remove-exercise-btn');
    if (btn) btn.closest('.exercise-entry')?.remove();
  });
  cancelRoutineBtn?.addEventListener('click', () => showView('routines'));
  saveRoutineBtn?.addEventListener('click', () => {
    if (!routineNameInput) return;
    const name = routineNameInput.value.trim();
    const entries = document.querySelectorAll('.exercise-entry');
    const exercises = [];
    let valid = !!name;
    entries.forEach(entry => {
      const nameInput = entry.querySelector('.exercise-name-input');
      const setsInput = entry.querySelector('.exercise-sets-input');
      const exName = nameInput.value.trim();
      const exSets = parseInt(setsInput.value, 10);
      if (exName && exSets > 0) exercises.push({ name: exName, sets: exSets }); else valid = false;
    });
    if (!valid || exercises.length === 0) {
      showConfirmationModal({ title:'Datos inválidos', message:'Revisa el formulario.', confirmText:'Ok', confirmClasses:['bg-yellow-400','hover:bg-yellow-300','text-gray-900'], onConfirm:()=>{} });
      return;
    }
    const editingId = routineFormView?.dataset.editingId;
    if (editingId) {
      const idx = state.routines.findIndex(r => r.id === Number(editingId));
      if (idx > -1) state.routines[idx] = { ...state.routines[idx], name, exercises };
    } else {
      state.routines.push({ id: Date.now(), name, exercises });
    }
    saveState();
    renderRoutines();
    showView('routines');
  });
  // Confirmación antes de finalizar y guardar
  finishWorkoutBtn?.addEventListener('click', () => {
    console.log('[UI] Click en Finalizar y Guardar (direct)');
    if (confirmationModalContainer) {
      showConfirmationModal({
        title: '¿Finalizar y Guardar?',
        message: 'Se guardará tu sesión en el historial. ¿Deseas continuar?',
        confirmText: 'Guardar',
        confirmClasses: ['bg-yellow-400','hover:bg-yellow-300','text-gray-900'],
        onConfirm: handleSaveSession,
      });
    } else if (window.confirm('¿Finalizar y Guardar? Se guardará tu sesión en el historial.')) {
      handleSaveSession();
    }
  });
  cancelWorkoutBtn?.addEventListener('click', () => {
    console.log('[UI] Click en Cancelar (direct)');
    if (confirmationModalContainer) {
      handleCancelSession();
    } else if (window.confirm('¿Cancelar Entrenamiento? El progreso no guardado se perderá.')) {
      // Ejecutar la rama "onConfirm" de handleCancelSession manualmente
      state.activeSession = null;
      saveState();
      loadState();
      renderRoutines();
      showView('routines');
    }
  });
  exportCsvBtn?.addEventListener('click', exportHistoryToCsv);
  cancelConfirmationBtn?.addEventListener('click', hideConfirmationModal);
  confirmActionBtn?.addEventListener('click', () => {
    console.log('[Modal] Botón confirmar presionado');
    // Guardar referencia antes de ocultar el modal (ocultarlo lo pone a null)
    const cb = confirmActionCallback;
    hideConfirmationModal();
    if (typeof cb === 'function') {
      cb();
    } else {
      console.warn('[Modal] No hay callback de confirmación definido');
    }
  });

  // Initial load
  const init = () => {
    loadState();
    if (state.activeSession) {
      renderWorkoutSession(state.activeSession.routineId);
    } else {
      renderRoutines();
      showView('routines');
    }
  };
  // Retrasar el inicio 2s y ocultar el splash al mismo tiempo
  console.log('[Splash] Retrasando init 2000ms');
  setTimeout(() => {
    console.log('[Splash] Iniciando app y ocultando splash');
    init();
    splashScreen?.classList.add('hidden');
  }, 2000);

  // Warn on unload if active session exists
  window.addEventListener('beforeunload', (e) => {
    if (state.activeSession) {
      const msg = '⚠️ ¡Atención! Tienes un entrenamiento en progreso. Si recargas la página, perderás todos los datos no guardados.';
      e.preventDefault();
      e.returnValue = msg;
      return msg;
    }
  });
});
