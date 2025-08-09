document.addEventListener('DOMContentLoaded', () => {
    console.log('🎪 DOM Content Loaded event fired');

    // --- DOM Elements ---
    const app = document.getElementById('app');
    const splashScreen = document.getElementById('splash-screen');

    console.log('🔍 Elementos principales:', { app: !!app, splashScreen: !!splashScreen });

    const views = {
        routines: document.getElementById('routines-view'),
        routineForm: document.getElementById('routine-form-view'),
        workoutSession: document.getElementById('workout-session-view'),
    };

    console.log('👁️ Vistas encontradas:', {
        routines: !!views.routines,
        routineForm: !!views.routineForm,
        workoutSession: !!views.workoutSession
    });

    // Buttons
    const createRoutineFab = document.getElementById('create-routine-fab');
    const saveRoutineBtn = document.getElementById('save-routine-btn');
    const cancelRoutineBtn = document.getElementById('cancel-routine-btn');
    const addExerciseBtn = document.getElementById('add-exercise-btn');
    const finishWorkoutBtn = document.getElementById('finish-workout-btn');
    const cancelWorkoutBtn = document.getElementById('cancel-workout-btn');
    const exportCsvBtn = document.getElementById('export-csv-btn');

    // Containers & Inputs
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

    // Confirmation Modal
    const confirmationModalContainer = document.getElementById('confirmation-modal-container');
    const confirmationTitle = document.getElementById('confirmation-title');
    const confirmationMessage = document.getElementById('confirmation-message');
    const confirmActionBtn = document.getElementById('confirm-action-btn');
    const cancelConfirmationBtn = document.getElementById('cancel-confirmation-btn');
    let confirmActionCallback = null;


    // --- State Management ---
    let state = { routines: [], history: [] };
    let currentSessionState = {};

    const loadState = () => {
        const savedState = localStorage.getItem('gymTrackerState');
        if (savedState) {
            try {
                const parsedState = JSON.parse(savedState);
                state.routines = parsedState.routines || [];
                state.history = parsedState.history || [];
            } catch (error) {
                console.error("Failed to parse state from localStorage", error);
                state = { routines: [], history: [] };
            }
        }
    };

    const saveState = () => {
        localStorage.setItem('gymTrackerState', JSON.stringify(state));
    };

    // --- View Navigation ---
    const showView = (viewName) => {
        Object.values(views).forEach(view => view && view.classList.remove('active'));
        const viewToShow = views[viewName];
        if (viewToShow) {
            viewToShow.classList.add('active');
            const heading = viewToShow.querySelector('h2[tabindex="-1"]');
            if (heading) heading.focus({ preventScroll: true });
        }
        if (createRoutineFab) {
            createRoutineFab.style.display = viewName === 'routines' ? 'flex' : 'none';
        }
    };

    // --- Modal Logic ---
    const showConfirmationModal = (config) => {
        if (!confirmationModalContainer || !confirmationTitle || !confirmationMessage || !confirmActionBtn) return;

        confirmationTitle.textContent = config.title;
        confirmationMessage.textContent = config.message;
        confirmActionBtn.textContent = config.confirmText;

        confirmActionBtn.className = 'py-3 px-6 font-bold rounded-lg text-white transition-colors'; // Reset
        confirmActionBtn.classList.add(...config.confirmClasses);

        confirmActionCallback = config.onConfirm;
        confirmationModalContainer.classList.remove('hidden');
        confirmActionBtn.focus();
    };

    const hideConfirmationModal = () => {
        confirmActionCallback = null;
        confirmationModalContainer?.classList.add('hidden');
    };

    // --- Rendering Helpers ---
    const createRoutineCard = (routine) => {
        const card = document.createElement('div');
        card.className = 'bg-gray-800 p-6 rounded-2xl transform hover:-translate-y-1 transition-transform duration-300 flex flex-col relative';

        const exerciseText = routine.exercises.length === 1 ? 'ejercicio' : 'ejercicios';
        const editIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg>`;
        const deleteIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" /></svg>`;

        card.innerHTML = `
            <div class="absolute top-3 right-3 flex items-center space-x-2">
                <button data-routine-id="${routine.id}" class="edit-routine-btn p-2 text-gray-500 hover:text-yellow-400 transition-colors rounded-full" aria-label="Editar rutina ${routine.name}">${editIcon}</button>
                <button data-routine-id="${routine.id}" class="delete-routine-btn p-2 text-gray-500 hover:text-red-500 transition-colors rounded-full" aria-label="Eliminar rutina ${routine.name}">${deleteIcon}</button>
            </div>
            <div class="flex-grow">
                <h3 class="text-2xl font-bold tracking-wide text-white">${routine.name}</h3>
                <p class="text-sm text-gray-400 mt-1">${routine.exercises.length} ${exerciseText}</p>
            </div>
            <button data-routine-id="${routine.id}" class="start-workout-btn w-full mt-6 py-3 px-5 font-bold rounded-lg text-gray-900 bg-yellow-400 hover:bg-yellow-300 transition-colors" aria-label="Empezar entrenamiento ${routine.name}">Empezar</button>
        `;
        return card;
    };

    const addExerciseInput = (name = '', sets = 4) => {
        if (!exercisesContainer) return;
        const div = document.createElement('div');
        div.className = 'exercise-entry flex items-center space-x-2';

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = name;
        nameInput.className = 'exercise-name-input flex-grow p-3 rounded-lg bg-gray-700 border-2 border-gray-600 focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-white';
        nameInput.placeholder = 'Nombre del ejercicio';
        nameInput.addEventListener('input', () => nameInput.classList.remove('border-red-500'));

        const setsInput = document.createElement('input');
        setsInput.type = 'number';
        setsInput.value = String(sets);
        setsInput.min = '1';
        setsInput.className = 'exercise-sets-input w-20 text-center p-3 rounded-lg bg-gray-700 border-2 border-gray-600 focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-white';
        setsInput.setAttribute('aria-label', 'Número de series');
        setsInput.addEventListener('input', () => setsInput.classList.remove('border-red-500'));

        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'remove-exercise-btn text-gray-500 hover:text-red-500 p-2 rounded-full transition-colors flex-shrink-0';
        removeButton.setAttribute('aria-label', 'Quitar ejercicio');
        removeButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;

        div.appendChild(nameInput);
        div.appendChild(setsInput);
        div.appendChild(removeButton);
        exercisesContainer.appendChild(div);
    };


    // --- Main Rendering Functions ---
    const renderRoutines = () => {
        if (!routinesList || !noRoutinesMessage) return;
        routinesList.innerHTML = '';
        if (state.routines.length === 0) {
            noRoutinesMessage.style.display = 'block';
            routinesList.style.display = 'none';
        } else {
            noRoutinesMessage.style.display = 'none';
            routinesList.style.display = 'grid';
            const fragment = document.createDocumentFragment();
            state.routines.forEach(routine => {
                const card = createRoutineCard(routine);
                fragment.appendChild(card);
            });
            routinesList.appendChild(fragment);
        }
    };

    const openCreateRoutineForm = () => {
        if (!routineFormView || !routineFormTitle || !routineNameInput || !exercisesContainer || !saveRoutineBtn) return;
        routineFormView.removeAttribute('data-editing-id');
        routineFormTitle.textContent = 'Crear Nueva Rutina';
        routineNameInput.value = '';
        routineNameInput.classList.remove('border-red-500');
        exercisesContainer.innerHTML = '';
        saveRoutineBtn.textContent = 'Guardar Rutina';
        addExerciseInput();
        showView('routineForm');
    };

    const openEditRoutineForm = (routineId) => {
        const routine = state.routines.find(r => r.id === routineId);
        if (!routine || !routineFormView || !routineFormTitle || !routineNameInput || !exercisesContainer || !saveRoutineBtn) return;

        routineFormView.dataset.editingId = String(routineId);
        routineFormTitle.textContent = 'Editar Rutina';
        routineNameInput.value = routine.name;
        routineNameInput.classList.remove('border-red-500');
        exercisesContainer.innerHTML = '';
        routine.exercises.forEach((ex) => addExerciseInput(ex.name, ex.sets));
        saveRoutineBtn.textContent = 'Actualizar Rutina';
        showView('routineForm');
    };

    // --- Session History Functions ---

    const loadSessions = (routineId) => {
        const key = `sessions_${routineId}`;
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];
        } catch (e) {
            console.error("Error loading sessions from localStorage", e);
            return [];
        }
    };

    const saveSession = (routineId, newSession) => {
        const sessions = loadSessions(routineId);
        sessions.unshift(newSession);
        const key = `sessions_${routineId}`;
        localStorage.setItem(key, JSON.stringify(sessions));
    };

    const deleteSession = (routineId, sessionId) => {
        let sessions = loadSessions(routineId);
        sessions = sessions.filter(s => s.session_id !== sessionId);
        const key = `sessions_${routineId}`;
        localStorage.setItem(key, JSON.stringify(sessions));

        state.history = state.history.filter(s => s.session_id !== sessionId);
        saveState();
    };

    const renderSessionTabs = (routineId, sessions, { limit = 4 } = {}) => {
        if (!sessionTabsContainer) return;
        sessionTabsContainer.innerHTML = '';
        const fragment = document.createDocumentFragment();

        const todayTab = document.createElement('button');
        todayTab.className = 'session-tab';
        todayTab.textContent = 'Hoy';
        todayTab.setAttribute('role', 'tab');
        todayTab.setAttribute('aria-selected', 'true');
        todayTab.dataset.sessionId = 'today';
        fragment.appendChild(todayTab);

        sessions.slice(0, limit).forEach(session => {
            const date = new Date(session.date);
            const dateString = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });

            const tab = document.createElement('button');
            tab.className = 'session-tab';
            tab.setAttribute('role', 'tab');
            tab.setAttribute('aria-selected', 'false');
            tab.dataset.sessionId = session.session_id;

            const dateSpan = document.createElement('span');
            dateSpan.textContent = dateString;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'session-tab-delete-btn';
            deleteBtn.dataset.sessionId = session.session_id;
            deleteBtn.setAttribute('aria-label', `Eliminar sesión del ${dateString}`);
            deleteBtn.innerHTML = `<svg class="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;

            tab.appendChild(dateSpan);
            tab.appendChild(deleteBtn);
            fragment.appendChild(tab);
        });

        sessionTabsContainer.appendChild(fragment);
    };

    const renderSessionBlock = (sessionData, { editable, prefillData = null }) => {
        if (!sessionContentContainer) return;
        sessionContentContainer.innerHTML = '';
        const fragment = document.createDocumentFragment();

        const exercises = editable ? sessionData.exercises : sessionData.workoutData;

        if (!exercises || exercises.length === 0) {
            sessionContentContainer.innerHTML = `<p class="text-center text-gray-400">No se encontraron ejercicios.</p>`;
            return;
        }

        exercises.forEach((exercise) => {
            const exerciseName = editable ? exercise.name : exercise.exerciseName;

            const exerciseCard = document.createElement('div');
            exerciseCard.className = 'bg-gray-800 p-5 rounded-xl';
            exerciseCard.dataset.exerciseName = exerciseName;

            const title = document.createElement('h4');
            title.className = 'text-xl font-bold mb-4 text-yellow-400 tracking-wide';
            title.textContent = exerciseName;
            exerciseCard.appendChild(title);

            const headerRow = document.createElement('div');
            headerRow.className = 'grid grid-cols-4 items-center gap-3 mb-3 text-xs text-gray-400 font-bold uppercase tracking-wider';
            headerRow.innerHTML = `<span>Serie</span><span>Reps</span><span>Peso (kg)</span><span>RPE</span>`;
            exerciseCard.appendChild(headerRow);

            const numSets = editable ? exercise.sets : exercise.sets.length;

            for (let i = 1; i <= numSets; i++) {
                const setRow = document.createElement('div');
                setRow.className = 'grid grid-cols-4 items-center gap-3 mb-2 set-row';
                setRow.dataset.setIndex = String(i);

                const setLabel = document.createElement('span');
                setLabel.className = 'font-semibold text-gray-300';
                setLabel.textContent = `Serie ${i}`;
                setRow.appendChild(setLabel);

                const createCell = (value, type) => {
                    if (editable && type !== 'text') {
                        const input = document.createElement('input');
                        input.type = 'number';
                        input.dataset.type = type;
                        input.placeholder = '-';
                        input.value = value;
                        input.className = 'w-full text-center p-2 rounded-lg bg-gray-700 border-2 border-gray-600 text-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent';
                        input.setAttribute('aria-label', `${type} para ${exerciseName} serie ${i}`);
                        if (type === 'rpe') { input.step = '0.5'; input.min = '1'; input.max = '10'; }
                        return input;
                    }
                    const span = document.createElement('span');
                    span.className = 'text-center font-medium p-2';
                    span.textContent = value || '-';
                    return span;
                };

                const stateKey = `${exerciseName}-${i}`;
                let repsVal, weightVal, rpeVal;

                if (editable) {
                    const prefillSet = prefillData?.workoutData
                        ?.find((e) => e.exerciseName === exerciseName)?.sets
                        ?.find((s) => s.set === i);
                    repsVal = currentSessionState[stateKey]?.reps ?? prefillSet?.reps ?? '';
                    weightVal = currentSessionState[stateKey]?.weight ?? prefillSet?.weight ?? '';
                    rpeVal = currentSessionState[stateKey]?.rpe ?? prefillSet?.rpe ?? '';

                    setRow.appendChild(createCell(String(repsVal), 'reps'));
                    setRow.appendChild(createCell(String(weightVal), 'weight'));
                    setRow.appendChild(createCell(String(rpeVal), 'rpe'));
                } else {
                    const historicSet = exercise.sets.find((s) => s.set === i);
                    repsVal = historicSet?.reps ?? '-';
                    weightVal = historicSet?.weight ?? '-';
                    rpeVal = historicSet?.rpe ?? '-';

                    setRow.appendChild(createCell(repsVal, 'text'));
                    setRow.appendChild(createCell(weightVal, 'text'));
                    setRow.appendChild(createCell(rpeVal, 'text'));
                }

                exerciseCard.appendChild(setRow);
            }
            fragment.appendChild(exerciseCard);
        });

        sessionContentContainer.appendChild(fragment);
    };

    const renderWorkoutSession = (routineId) => {
        console.log('🏋️ Renderizando sesión de entrenamiento para rutina:', routineId);
        const routine = state.routines.find(r => r.id === routineId);
        if (!routine) {
            console.error('❌ No se encontró la rutina con ID:', routineId);
            return;
        }
        if (!app) {
            console.error('❌ No se encontró el elemento app');
            return;
        }
        if (!sessionInfo.name || !sessionInfo.date) {
            console.error('❌ No se encontraron elementos sessionInfo');
            return;
        }

        currentSessionState = {};

        app.dataset.currentRoutineId = String(routineId);
        sessionInfo.name.textContent = routine.name;
        sessionInfo.date.textContent = "Historial y Sesión Actual";

        const sessions = loadSessions(routineId);
        renderSessionTabs(routineId, sessions);

        if (sessions.length === 0 && sessionContentContainer) {
            sessionContentContainer.innerHTML = `<div id="empty-history-message"><h4 class="text-lg font-bold mb-2">¡Primera sesión!</h4><p class="text-gray-400">Completa los campos y pulsa "Finalizar y Guardar" para crear tu primer registro histórico.</p></div>`;
        }

        renderSessionBlock(routine, { editable: true, prefillData: null });

        console.log('📱 Cambiando a vista workoutSession');
        showView('workoutSession');
    };

    const handleSaveSession = () => {
        const routineId = Number(app.dataset.currentRoutineId);
        const routine = state.routines.find(r => r.id === routineId);
        if (!routine || !sessionContentContainer) return;

        const workoutData = [];
        let hasReps = false;
        const exerciseCards = sessionContentContainer.querySelectorAll('[data-exercise-name]');

        exerciseCards.forEach(card => {
            const exerciseName = card.dataset.exerciseName;
            const sets = [];
            card.querySelectorAll('.set-row').forEach(row => {
                const repsInput = row.querySelector('[data-type="reps"]');
                const reps = repsInput && repsInput.value ? parseInt(repsInput.value, 10) : null;
                if (reps !== null && reps > 0) hasReps = true;

                const weightInput = row.querySelector('[data-type="weight"]');
                const weight = weightInput && weightInput.value ? parseFloat(weightInput.value) : null;

                const rpeInput = row.querySelector('[data-type="rpe"]');
                const rpe = rpeInput && rpeInput.value ? parseFloat(rpeInput.value) : null;

                if ((repsInput && repsInput.value) || (weightInput && weightInput.value) || (rpeInput && rpeInput.value)) {
                    sets.push({
                        set: Number(row.dataset.setIndex),
                        reps: reps !== null && !isNaN(reps) ? reps : null,
                        weight: weight !== null && !isNaN(weight) ? weight : null,
                        rpe: rpe !== null && !isNaN(rpe) ? rpe : null,
                    });
                }
            });

            if (sets.length > 0) workoutData.push({ exerciseName, sets });
        });

        if (!hasReps) {
            showConfirmationModal({
                title: 'Entrenamiento Vacío',
                message: 'Debes registrar al menos una repetición para guardar la sesión.',
                confirmText: 'Entendido',
                confirmClasses: ['bg-yellow-400', 'hover:bg-yellow-300', 'text-gray-900'],
                onConfirm: () => { }
            });
            return;
        }

        const newSession = {
            session_id: `sess_${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            routineName: routine.name,
            workoutData,
        };

        saveSession(routineId, newSession);

        state.history.push(newSession);
        saveState();

        showConfirmationModal({
            title: '¡Guardado!',
            message: 'Tu sesión se ha guardado correctamente en el historial.',
            confirmText: 'Genial',
            confirmClasses: ['bg-yellow-400', 'hover:bg-yellow-300', 'text-gray-900'],
            onConfirm: () => showView('routines')
        });
    };

    const exportHistoryToCsv = () => {
        if (state.history.length === 0) {
            showConfirmationModal({
                title: 'Historial Vacío',
                message: 'No hay datos de entrenamiento para exportar.',
                confirmText: 'Entendido',
                confirmClasses: ['bg-yellow-400', 'hover:bg-yellow-300', 'text-gray-900'],
                onConfirm: () => { }
            });
            return;
        }

        const headers = ["Fecha", "Nombre de la Rutina", "Nombre del Ejercicio", "Numero de Serie", "Repeticiones", "Peso (kg)", "RPE"];
        let csvContent = headers.join(",") + "\r\n";

        state.history.forEach(entry => {
            const { date, routineName, workoutData } = entry;
            workoutData.forEach((exercise) => {
                const { exerciseName, sets } = exercise;
                sets.forEach((set) => {
                    const row = [`"${date}"`, `"${routineName}"`, `"${exerciseName}"`, set.set, set.reps ?? '', set.weight ?? '', set.rpe ?? ''];
                    csvContent += row.join(",") + "\r\n";
                });
            });
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `historial_entrenamiento_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- Event Handlers ---
    createRoutineFab?.addEventListener('click', openCreateRoutineForm);

    addExerciseBtn?.addEventListener('click', () => addExerciseInput());

    exercisesContainer?.addEventListener('click', (e) => {
        const target = e.target;
        if (target.closest('.remove-exercise-btn')) {
            target.closest('.exercise-entry')?.remove();
        }
    });

    cancelRoutineBtn?.addEventListener('click', () => showView('routines'));

    saveRoutineBtn?.addEventListener('click', () => {
        if (!routineNameInput) return;
        let isValid = true;
        routineNameInput.classList.remove('border-red-500');

        const name = routineNameInput.value.trim();
        if (!name) {
            routineNameInput.classList.add('border-red-500');
            routineNameInput.focus();
            isValid = false;
        }

        const exercises = [];
        const exerciseEntries = document.querySelectorAll('.exercise-entry');

        exerciseEntries.forEach(entry => {
            const nameInput = entry.querySelector('.exercise-name-input');
            const setsInput = entry.querySelector('.exercise-sets-input');

            if (nameInput && setsInput) {
                nameInput.classList.remove('border-red-500');
                setsInput.classList.remove('border-red-500');

                const exName = nameInput.value.trim();
                const exSets = parseInt(setsInput.value, 10);

                let entryIsValid = true;
                if (!exName) {
                    nameInput.classList.add('border-red-500');
                    if (isValid) nameInput.focus();
                    entryIsValid = false;
                }
                if (isNaN(exSets) || exSets <= 0) {
                    setsInput.classList.add('border-red-500');
                    if (isValid && entryIsValid) setsInput.focus();
                    entryIsValid = false;
                }

                if (entryIsValid) {
                    exercises.push({ name: exName, sets: exSets });
                } else {
                    isValid = false;
                }
            }
        });

        if (!isValid) return;

        if (exercises.length === 0) {
            showConfirmationModal({
                title: 'No hay Ejercicios',
                message: 'Por favor, añade al menos un ejercicio válido a la rutina.',
                confirmText: 'Entendido',
                confirmClasses: ['bg-yellow-400', 'hover:bg-yellow-300', 'text-gray-900'],
                onConfirm: () => (document.querySelector('.exercise-name-input'))?.focus()
            });
            return;
        }

        const editingId = routineFormView?.dataset.editingId;
        if (editingId) {
            const routineIndex = state.routines.findIndex(r => r.id === Number(editingId));
            if (routineIndex > -1) {
                state.routines[routineIndex] = { ...state.routines[routineIndex], name, exercises };
            }
        } else {
            state.routines.push({ id: Date.now(), name, exercises });
        }

        saveState();
        renderRoutines();
        showView('routines');
    });

    routinesList?.addEventListener('click', e => {
        console.log('🎯 Click detectado en routinesList');
        const target = e.target;
        const button = target.closest('button');
        if (!button) {
            console.log('❌ No se encontró botón');
            return;
        }

        const routineIdStr = button.getAttribute('data-routine-id');
        if (!routineIdStr) {
            console.log('❌ No se encontró data-routine-id');
            return;
        }
        const routineId = Number(routineIdStr);
        console.log('🆔 Routine ID:', routineId);

        if (button.classList.contains('start-workout-btn')) {
            console.log('▶️ Botón Empezar clickeado');
            renderWorkoutSession(routineId);
        } else if (button.classList.contains('edit-routine-btn')) {
            console.log('✏️ Botón Editar clickeado');
            openEditRoutineForm(routineId);
        } else if (button.classList.contains('delete-routine-btn')) {
            console.log('🗑️ Botón Eliminar clickeado');
            showConfirmationModal({
                title: '¿Eliminar Rutina?',
                message: 'Esta acción no se puede deshacer y borrará la rutina permanentemente.',
                confirmText: 'Eliminar',
                confirmClasses: ['bg-red-600', 'hover:bg-red-700'],
                onConfirm: () => {
                    state.routines = state.routines.filter(r => r.id !== routineId);
                    localStorage.removeItem(`sessions_${routineId}`);
                    saveState();
                    renderRoutines();
                }
            });
        }
    });

    cancelWorkoutBtn?.addEventListener('click', () => {
        showConfirmationModal({
            title: '¿Cancelar Entrenamiento?',
            message: 'El progreso no guardado se perderá. ¿Estás seguro?',
            confirmText: 'Sí, Cancelar',
            confirmClasses: ['bg-gray-600', 'hover:bg-gray-500'],
            onConfirm: () => showView('routines')
        });
    });

    // REFACTOR: Centralized event listener for session tabs
    sessionTabsContainer?.addEventListener('click', (e) => {
        const target = e.target;
        const routineId = Number(app.dataset.currentRoutineId);
        if (isNaN(routineId)) return;

        const deleteButton = target.closest('.session-tab-delete-btn');
        const tabButton = target.closest('.session-tab');

        if (deleteButton) {
            e.stopPropagation(); // Prevent tab selection when clicking delete
            const sessionId = deleteButton.dataset.sessionId;
            if (!sessionId) return;

            showConfirmationModal({
                title: '¿Eliminar Sesión?',
                message: 'Se eliminará el historial de este día de forma permanente.',
                confirmText: 'Sí, Eliminar',
                confirmClasses: ['bg-red-600', 'hover:bg-red-700'],
                onConfirm: () => {
                    deleteSession(routineId, sessionId);
                    // Re-render the session view to reflect the deletion
                    renderWorkoutSession(routineId);
                }
            });
        } else if (tabButton) {
            sessionTabsContainer.querySelectorAll('.session-tab').forEach(t => t.setAttribute('aria-selected', 'false'));
            tabButton.setAttribute('aria-selected', 'true');

            const sessionId = tabButton.dataset.sessionId;
            const routine = state.routines.find(r => r.id === routineId);

            if (sessionId === 'today') {
                renderSessionBlock(routine, { editable: true });
            } else {
                const sessions = loadSessions(routineId);
                const historicSession = sessions.find(s => s.session_id === sessionId);
                renderSessionBlock(historicSession, { editable: false });
            }
        }
    });

    finishWorkoutBtn?.addEventListener('click', handleSaveSession);
    exportCsvBtn?.addEventListener('click', exportHistoryToCsv);
    cancelConfirmationBtn?.addEventListener('click', hideConfirmationModal);
    confirmActionBtn?.addEventListener('click', () => {
        confirmActionCallback?.();
        hideConfirmationModal();
    });

    sessionContentContainer?.addEventListener('input', (e) => {
        const target = e.target;
        if (target.matches('input[data-type]')) {
            const setRow = target.closest('.set-row');
            const exerciseCard = target.closest('[data-exercise-name]');

            if (setRow && exerciseCard) {
                const exerciseName = exerciseCard.dataset.exerciseName;
                const setIndex = setRow.dataset.setIndex;
                const stateKey = `${exerciseName}-${setIndex}`;
                const inputType = target.dataset.type;

                if (!currentSessionState[stateKey]) {
                    currentSessionState[stateKey] = {};
                }
                currentSessionState[stateKey][inputType] = target.value;
            }
        }
    });

    // --- Initial Load ---
    const handleInitialLoad = () => {
        console.log('🚀 Iniciando aplicación...');
        try {
            console.log('📦 Cargando estado...');
            loadState();
            console.log('🎯 Renderizando rutinas...');
            renderRoutines();
            console.log('👀 Mostrando vista de rutinas...');
            showView('routines');
            console.log('✅ Aplicación iniciada correctamente');
        } catch (e) {
            console.error('❌ Error al iniciar la app:', e);
            if (document.body && !document.getElementById('fatal-error')) {
                const errDiv = document.createElement('div');
                errDiv.id = 'fatal-error';
                errDiv.style = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:#1a1a1a;color:#fff;z-index:9999;display:flex;align-items:center;justify-content:center;font-size:1.5rem;text-align:center;padding:2rem;';
                errDiv.innerText = 'Ocurrió un error al iniciar la aplicación. Revisa la consola para más detalles.';
                document.body.appendChild(errDiv);
            }
        } finally {
            console.log('🌅 Ocultando splash screen...');
            if (splashScreen) {
                splashScreen.classList.add('fade-out');
                setTimeout(() => {
                    if (splashScreen) splashScreen.style.display = 'none';
                    console.log('🎭 Splash screen ocultado');
                }, 500);
            }
        }
    };

    console.log('🎬 DOM cargado, iniciando app...');
    // Esperar 1.5 segundos para mostrar el splash, luego iniciar la app
    setTimeout(handleInitialLoad, 1500);
});